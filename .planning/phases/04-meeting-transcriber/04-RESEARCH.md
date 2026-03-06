# Phase 4: Meeting Transcriber - Research

**Researched:** 2026-03-06
**Domain:** Local speech-to-text transcription (Whisper), audio capture, Electron multi-window
**Confidence:** HIGH

## Summary

This phase adds a meeting recording and transcription feature to the existing Electron desktop app. The agent clicks a microphone icon in the title bar, a floating always-on-top pop-out window appears for recording controls, and after stopping, the transcribed text appears in the main window for copy-paste. All processing is local via OpenAI's Whisper model running through `@huggingface/transformers` (Transformers.js) with ONNX Runtime. No audio or transcript is saved to disk -- everything is ephemeral and in-memory.

The recommended approach uses `@huggingface/transformers` (v3+) running Whisper in the Electron renderer process via a Web Worker. This avoids native addon compilation issues (no node-gyp, no C++ toolchain requirement for users) and leverages WebGPU acceleration when available (Electron 34 ships Chromium 132, which has full WebGPU support) with automatic WASM fallback. Audio capture uses the standard `navigator.mediaDevices.getUserMedia()` + `MediaRecorder` API, which works natively in Electron's Chromium-based renderer.

**Primary recommendation:** Use `@huggingface/transformers` with `onnx-community/whisper-base.en` model (quantized q8), running in a Web Worker in the renderer process, with WebGPU acceleration and WASM fallback. Audio captured via `getUserMedia` + Web Audio API for 16kHz PCM conversion.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Mic icon in the title bar (alongside Hotkeys/Education/Settings buttons) -- always accessible, no contact required
- Clicking the mic icon opens a separate always-on-top pop-out window for the recording session
- Pause/resume supported within a recording session
- Title bar mic icon pulses red while recording is active (visual confirmation in main window)
- After stopping: pop-out closes, main window navigates to transcript view
- Local Whisper -- completely free, no API costs, no data leaves the device
- Default: English-only Whisper model (~75MB) -- small, fast, ships or downloads quickly
- Optional: multilingual model (~1.5GB) downloadable from Settings for agents who need Arabic/Hindi/Russian support
- No audio saved to disk -- audio held in memory during recording, discarded after transcription
- No transcript saved to disk -- fully ephemeral
- Zero cost -- hard requirement. Nothing in this feature incurs ongoing charges
- Transcript appears as a new view in the main window (like Education, Hotkeys views)
- "Copy All" button to copy full transcript to clipboard for pasting into ChatGPT
- Text is selectable for partial copy too
- Once the agent navigates away or starts a new recording, the transcript is gone
- No contact required to record -- mic button works anytime
- No linking to contacts, no OneNote integration, no storage

### Claude's Discretion
- Pop-out window design (layout, size, what it shows)
- Maximum recording length (reasonable cap with warning)
- Transcription timing (real-time streaming vs post-recording)
- Transcript view layout and styling
- Model download UX (first-use download flow)
- Audio format and in-memory handling
- Whisper model size selection (tiny/base/small/medium for English)

### Deferred Ideas (OUT OF SCOPE)
- Speaker diarization (who said what) -- separate enhancement
- Meeting summaries / AI extraction within the app -- agent uses ChatGPT externally for now
- Saved transcript history / searchable archive -- explicitly out of scope (privacy)
- OneNote integration for transcripts -- not needed since nothing is saved
- Cloud transcription fallback -- conflicts with free/privacy requirements
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@huggingface/transformers` | ^3.4 | Whisper model loading + inference via ONNX Runtime | Only mature JS library for local Whisper with WebGPU+WASM support; no native compilation needed |
| Web Audio API (built-in) | N/A | Microphone capture + PCM conversion to 16kHz mono | Browser-native, no dependencies, works in Electron renderer |
| MediaRecorder API (built-in) | N/A | Recording state management (start/stop/pause/resume) | Browser-native, handles pause/resume natively |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `electron` (existing) | ^34.0.0 | Pop-out BrowserWindow, IPC for recording state sync | Already in project -- Chromium 132 has WebGPU |
| `electron-store` (existing) | ^9.0.0 | Persist whisper model preference (English vs multilingual) | Already in project |
| `lucide-react` (existing) | ^0.576.0 | Mic, MicOff, Pause, Square, Copy icons | Already in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@huggingface/transformers` | `whisper-node` / `nodejs-whisper` | Requires whisper.cpp compilation, C++ toolchain on user machine, node-gyp headaches with Electron |
| `@huggingface/transformers` | `@kutalia/whisper-node-addon` | Pre-built binaries available but adds native addon complexity to electron-builder; less community support |
| Web Worker (renderer) | Main process Node.js | Would use `onnxruntime-node` instead of `onnxruntime-web`; loses WebGPU acceleration, adds native addon |
| WebGPU | WASM only | WASM is the reliable fallback; WebGPU is 2-5x faster when GPU available but not universally supported |

**Installation:**
```bash
npm install @huggingface/transformers
```

No additional native dependencies. The library bundles `onnxruntime-web` which provides both WebGPU and WASM backends.

## Architecture Patterns

### Recommended Project Structure
```
src/
  main/
    transcriber.ts       # Pop-out window creation/management, IPC handlers
    ipc.ts               # (extend) New transcriber IPC registrations
    index.ts             # (extend) Import transcriber module
  renderer/
    panel/
      components/
        TranscriptView.tsx    # Transcript display + Copy All button
      workers/
        whisper-worker.ts     # Web Worker: loads model, runs transcription
      App.tsx                 # (extend) Add 'transcriber' view, mic icon
  preload/
    index.ts             # (extend) Expose transcriber IPC methods
  shared/
    types.ts             # (extend) TranscriberState, WhisperModelPreference
```

### Pattern 1: Web Worker for Whisper Inference
**What:** Run the Whisper model in a dedicated Web Worker to avoid blocking the renderer UI thread during transcription.
**When to use:** Always -- transcription is CPU/GPU-intensive and would freeze the UI if run on the main thread.
**Example:**
```typescript
// whisper-worker.ts (Web Worker)
import { pipeline, env } from '@huggingface/transformers'

// Configure model caching
env.cacheDir = null // Use browser Cache API (default in web context)
env.allowRemoteModels = true

let transcriber: any = null

self.onmessage = async (event) => {
  const { type, data } = event.data

  if (type === 'load') {
    // data.model e.g. 'onnx-community/whisper-base.en'
    // data.device e.g. 'webgpu' or 'wasm'
    // data.dtype e.g. { encoder_model: 'q8', decoder_model_merged: 'q8' }
    self.postMessage({ type: 'loading', progress: 0 })

    transcriber = await pipeline(
      'automatic-speech-recognition',
      data.model,
      {
        device: data.device,
        dtype: data.dtype,
        progress_callback: (progress: any) => {
          self.postMessage({ type: 'loading', progress })
        }
      }
    )
    self.postMessage({ type: 'ready' })
  }

  if (type === 'transcribe') {
    // data.audio: Float32Array (16kHz mono PCM)
    const result = await transcriber(data.audio, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: false
    })
    self.postMessage({ type: 'result', text: result.text })
  }
}
```

### Pattern 2: Audio Capture with 16kHz PCM Conversion
**What:** Use getUserMedia + AudioContext to capture microphone audio and convert to 16kHz mono Float32Array for Whisper.
**When to use:** Recording phase -- Whisper requires 16kHz mono PCM input.
**Example:**
```typescript
// Audio recording utility (in renderer)
class AudioRecorder {
  private stream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private chunks: Float32Array[] = []
  private processor: ScriptProcessorNode | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private isPaused = false

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true
      }
    })

    this.audioContext = new AudioContext({ sampleRate: 16000 })
    this.source = this.audioContext.createMediaStreamSource(this.stream)

    // ScriptProcessorNode for raw PCM access
    // (AudioWorklet is preferred but ScriptProcessor is simpler and sufficient)
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1)
    this.processor.onaudioprocess = (e) => {
      if (!this.isPaused) {
        const pcm = e.inputBuffer.getChannelData(0)
        this.chunks.push(new Float32Array(pcm))
      }
    }
    this.source.connect(this.processor)
    this.processor.connect(this.audioContext.destination)
  }

  pause(): void { this.isPaused = true }
  resume(): void { this.isPaused = false }

  stop(): Float32Array {
    // Stop all tracks
    this.stream?.getTracks().forEach(t => t.stop())
    this.processor?.disconnect()
    this.source?.disconnect()
    this.audioContext?.close()

    // Merge chunks into single Float32Array
    const totalLength = this.chunks.reduce((sum, c) => sum + c.length, 0)
    const merged = new Float32Array(totalLength)
    let offset = 0
    for (const chunk of this.chunks) {
      merged.set(chunk, offset)
      offset += chunk.length
    }
    this.chunks = [] // Release memory
    return merged
  }
}
```

### Pattern 3: Pop-out Recording Window
**What:** A small, frameless, always-on-top BrowserWindow for recording controls. Communicates with main window via IPC through the main process.
**When to use:** When mic icon is clicked in title bar.
**Example:**
```typescript
// transcriber.ts (main process)
import { BrowserWindow, ipcMain } from 'electron'
import path from 'path'

let recorderWindow: BrowserWindow | null = null

export function createRecorderWindow(): BrowserWindow {
  recorderWindow = new BrowserWindow({
    width: 280,
    height: 120,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    transparent: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false  // Required for getUserMedia in pop-out
    }
  })
  // Load same renderer entry or a dedicated recorder page
  return recorderWindow
}
```

### Pattern 4: IPC State Synchronization
**What:** The pop-out window manages recording; main window shows pulsing mic icon and receives transcript. State flows through main process IPC.
**When to use:** Coordinating between two renderer windows.
**Example flow:**
```
Pop-out renderer                Main process               Panel renderer
      |                              |                          |
      |-- transcriber:start -------->|                          |
      |                              |-- transcriber:state ---->| (pulsing mic)
      |-- transcriber:pause -------->|                          |
      |                              |-- transcriber:state ---->| (paused icon)
      |-- transcriber:stop --------->|                          |
      |                              |-- transcriber:state ---->| (transcribing)
      |                              |<--- (pop-out closes) ----|
      |                              |                          |
      |   [Worker transcribes...]    |                          |
      |                              |-- transcriber:result --->| (show transcript)
```

### Pattern 5: Model Download with Progress
**What:** First-time use downloads the Whisper ONNX model (~40-80MB for base.en quantized). Show download progress in the UI.
**When to use:** When the model is not yet cached.
**Example:**
```typescript
// The transformers.js pipeline() accepts a progress_callback
const transcriber = await pipeline(
  'automatic-speech-recognition',
  'onnx-community/whisper-base.en',
  {
    device: 'webgpu',
    dtype: { encoder_model: 'q8', decoder_model_merged: 'q8' },
    progress_callback: (progress) => {
      // progress has: { status, file, loaded, total, progress (0-100) }
      // Post to UI for progress bar
      self.postMessage({ type: 'download-progress', progress })
    }
  }
)
```

### Anti-Patterns to Avoid
- **Running Whisper on the main thread:** Will freeze the entire app UI during transcription. Always use a Web Worker.
- **Saving audio to temp files:** CONTEXT.md explicitly forbids disk writes. Keep all audio data as in-memory Float32Array.
- **Using whisper.cpp native addons:** Requires C++ compilation toolchain, node-gyp, and complicates the electron-builder packaging. The ONNX/WASM approach avoids all of this.
- **Real-time streaming transcription for v1:** While technically possible with chunked processing, it adds significant complexity. Post-recording batch transcription is simpler and more reliable. Can be added later.
- **Loading the model on app startup:** The Whisper model is large. Only load it when the user first clicks Record. Lazy initialization.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Speech-to-text inference | Custom WASM/WebGPU inference code | `@huggingface/transformers` pipeline | Handles ONNX model loading, tokenization, beam search decoding, chunked processing |
| Audio resampling to 16kHz | Manual sample rate conversion | `AudioContext({ sampleRate: 16000 })` | Browser handles hardware-accelerated resampling natively |
| Model file caching | Custom download + file cache | Transformers.js browser Cache API | Built-in cache management, deduplication, cache invalidation |
| WebGPU/WASM fallback | Device detection + conditional loading | Transformers.js automatic fallback | Library handles `navigator.gpu` detection and falls back to WASM transparently |
| Pause/resume recording | Custom audio buffer management | `MediaRecorder.pause()` / `MediaRecorder.resume()` | Browser-native, handles edge cases |

**Key insight:** The `@huggingface/transformers` library abstracts away ONNX Runtime configuration, model downloading, caching, WebGPU/WASM backend selection, and the entire Whisper processing pipeline. Trying to hand-roll any of these would be error-prone and take weeks.

## Common Pitfalls

### Pitfall 1: Microphone Permission in Sandboxed Renderer
**What goes wrong:** `getUserMedia()` fails silently or throws `NotAllowedError` in a sandboxed Electron renderer.
**Why it happens:** Electron's `sandbox: true` setting (used in the existing panel window) can interfere with media device access. Electron auto-approves permissions by default, but only when no custom permission handler is set.
**How to avoid:** Either (a) use `sandbox: false` for the recording window's webPreferences, or (b) add a `setPermissionRequestHandler` on the session that explicitly grants 'media' permission. The existing panel uses `sandbox: true` but does not request media permissions, so the recording window should use its own session or set `sandbox: false`.
**Warning signs:** `getUserMedia` promise rejects, or resolves but stream has no audio tracks.

### Pitfall 2: WebGPU Not Available
**What goes wrong:** `pipeline()` with `device: 'webgpu'` throws an error on machines without GPU or with older drivers.
**Why it happens:** Not all machines support WebGPU. Electron 34 (Chromium 132) supports WebGPU, but the GPU hardware/drivers may not.
**How to avoid:** Try WebGPU first, catch the error, fall back to WASM. The `@huggingface/transformers` library does NOT auto-fallback -- you must handle this in your code.
**Warning signs:** Error mentioning "Failed to create WebGPU adapter" or `navigator.gpu.requestAdapter()` returning null.

### Pitfall 3: Memory Pressure from Long Recordings
**What goes wrong:** Recording for 60+ minutes accumulates hundreds of MB of Float32Array PCM data in memory, potentially causing the renderer to run out of memory or become very slow.
**Why it happens:** 16kHz mono Float32 audio = ~3.84 MB/minute. A 60-minute recording = ~230 MB. Add the Whisper model (~150-200MB in memory) and you're pushing limits.
**How to avoid:** Cap recording at a reasonable maximum (e.g., 60 minutes) with a warning at 45 minutes. Show a timer so the agent knows how long they've been recording.
**Warning signs:** Renderer process memory exceeding 500MB, UI becoming sluggish.

### Pitfall 4: Vite/Electron Web Worker Bundling
**What goes wrong:** Web Workers need special handling in Vite + Electron. The worker file may not be found at runtime, or imports inside the worker may fail.
**Why it happens:** Vite handles workers differently in dev vs production. The worker needs to be created with `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })` for Vite to bundle it correctly.
**How to avoid:** Use Vite's built-in worker support with the URL pattern. Test in both dev and production builds.
**Warning signs:** "Worker is not defined" errors, 404 for worker script, module import errors inside worker.

### Pitfall 5: Model Cache Location in Production
**What goes wrong:** In development, the model caches in `node_modules/.cache`. In production (packaged app), this path doesn't exist or isn't writable.
**Why it happens:** Transformers.js defaults to different cache strategies based on environment detection. In Electron's renderer (browser-like), it uses the browser Cache API by default, which should work. But if it falls back to filesystem caching, the path may be wrong.
**How to avoid:** In the Web Worker, the library should detect a browser-like environment and use the Cache API automatically. Verify this works in production builds. If not, explicitly set `env.useBrowserCache = true` and `env.useFSCache = false`.
**Warning signs:** Model re-downloads every time the app starts in production.

### Pitfall 6: Pop-out Window and Main Window Lifecycle
**What goes wrong:** User closes the main panel while recording is active in the pop-out, or closes the pop-out mid-recording without stopping.
**Why it happens:** Two independent windows with shared state.
**How to avoid:** When pop-out closes (via X or `window.close()`), auto-stop recording and trigger transcription. When main window hides to tray, keep the pop-out alive (it's always-on-top and independent). Main process owns the lifecycle.
**Warning signs:** Orphaned recording state, memory leaks from unclosed audio streams.

## Code Examples

### Whisper Model Options for This Project
```typescript
// Source: https://huggingface.co/onnx-community/whisper-base.en
// English-only models (default):
const ENGLISH_MODELS = {
  tiny:  { id: 'onnx-community/whisper-tiny.en',  size: '~40MB (q8)' },
  base:  { id: 'onnx-community/whisper-base.en',  size: '~77MB (q8)' },
  small: { id: 'onnx-community/whisper-small.en', size: '~200MB (q8)' }
}

// Multilingual model (optional download from Settings):
const MULTILINGUAL_MODEL = {
  id: 'onnx-community/whisper-small',  // ~466MB quantized
  size: '~200MB (q8)',
  languages: ['en', 'ar', 'hi', 'ru', '...100+ languages']
}

// Recommended default: base.en with q8 quantization
// - Good accuracy (5.0% WER on English)
// - Fast transcription (~7x realtime speed)
// - Reasonable download size (~77MB)
// - 388MB RAM at runtime -- well within Electron's renderer limits
```

### Microphone Permission in Electron
```typescript
// Source: https://www.electronjs.org/docs/latest/api/session
// In main process, when creating the recorder window:
const { session } = require('electron')

// Auto-grant media permission for the app's own windows
session.defaultSession.setPermissionRequestHandler(
  (webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true) // Grant microphone access
      return
    }
    callback(false)
  }
)
```

### Creating the Whisper Pipeline with Fallback
```typescript
// Source: https://huggingface.co/docs/transformers.js/main/en/guides/webgpu
async function createTranscriber(modelId: string) {
  // Try WebGPU first for faster inference
  try {
    if (typeof navigator !== 'undefined' && navigator.gpu) {
      const adapter = await navigator.gpu.requestAdapter()
      if (adapter) {
        return await pipeline('automatic-speech-recognition', modelId, {
          device: 'webgpu',
          dtype: { encoder_model: 'fp32', decoder_model_merged: 'q8' }
        })
      }
    }
  } catch (e) {
    console.warn('WebGPU not available, falling back to WASM:', e)
  }

  // Fallback to WASM (CPU)
  return await pipeline('automatic-speech-recognition', modelId, {
    dtype: 'q8'
  })
}
```

### Vite Web Worker Creation Pattern
```typescript
// In React component or module (renderer):
// Source: https://vitejs.dev/guide/features#web-workers
const worker = new Worker(
  new URL('./workers/whisper-worker.ts', import.meta.url),
  { type: 'module' }
)

worker.onmessage = (event) => {
  const { type, ...data } = event.data
  switch (type) {
    case 'loading':
      setDownloadProgress(data.progress)
      break
    case 'ready':
      setModelReady(true)
      break
    case 'result':
      setTranscript(data.text)
      break
  }
}

// Load model
worker.postMessage({
  type: 'load',
  data: { model: 'onnx-community/whisper-base.en', device: 'webgpu' }
})

// Send audio for transcription
worker.postMessage(
  { type: 'transcribe', data: { audio: float32Array } },
  [float32Array.buffer]  // Transfer ownership for zero-copy
)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@xenova/transformers` (v2) | `@huggingface/transformers` (v3+) | Late 2024 | Package renamed, WebGPU support added, new model format |
| WASM-only inference | WebGPU + WASM fallback | Transformers.js v3, 2024 | 2-5x speed improvement on machines with GPU |
| whisper.cpp via Node.js FFI | ONNX Runtime Web in browser | 2024-2025 | No native compilation, works in Electron renderer directly |
| File-based audio input | In-memory Float32Array input | Transformers.js v3 | Perfect for ephemeral recording -- no temp files needed |

**Deprecated/outdated:**
- `@xenova/transformers` v2: Replaced by `@huggingface/transformers` v3. Same author, new package name.
- `whisper-node` / `nodejs-whisper`: Require whisper.cpp compilation. Still work but unnecessary complexity for Electron apps.

## Open Questions

1. **Pop-out window: Shared renderer entry or dedicated HTML?**
   - What we know: The existing app has `panel/index.html` and `settings/index.html` as separate renderer entries. A third entry for the recorder is possible but adds build complexity.
   - What's unclear: Whether the pop-out should share the panel's renderer (and show a different component based on IPC) or have its own entry. Sharing is simpler but creates coupling.
   - Recommendation: Use the same `panel/index.html` entry and conditionally render a `RecorderOverlay` component when the window is the pop-out. This avoids a new electron-vite entry point and keeps things simple.

2. **Real-time vs Post-recording Transcription**
   - What we know: Real-time streaming is possible with chunked Whisper (process every 30s of audio), but adds significant complexity. Post-recording is simpler and more reliable.
   - What's unclear: How long agents typically record (5 min? 30 min? 60 min?).
   - Recommendation: Start with post-recording transcription. For a 10-minute recording, transcription takes ~30-60 seconds on a modern CPU with WASM, or ~10-20 seconds with WebGPU. Show a progress indicator during transcription.

3. **Multilingual Model Download UX**
   - What we know: The multilingual model is ~200-466MB. Downloading it needs a progress indicator and should happen in Settings, not during a recording.
   - What's unclear: Exact model to use for multilingual (whisper-small vs whisper-base multilingual).
   - Recommendation: Use `onnx-community/whisper-small` (q8 quantized, ~200MB) for multilingual. Download via a button in Settings with progress bar. Cache via browser Cache API.

## Sources

### Primary (HIGH confidence)
- [onnx-community/whisper-base.en](https://huggingface.co/onnx-community/whisper-base.en) - ONNX model files and sizes verified
- [Transformers.js WebGPU docs](https://huggingface.co/docs/transformers.js/main/en/guides/webgpu) - WebGPU pipeline API verified, code examples from official docs
- [Transformers.js env API](https://huggingface.co/docs/transformers.js/en/api/env) - Cache and environment configuration verified
- [Electron 34 release](https://www.electronjs.org/blog/electron-34-0) - Chromium 132 version confirmed (WebGPU supported)
- [Electron BrowserWindow API](https://www.electronjs.org/docs/latest/api/browser-window) - alwaysOnTop, webPreferences options verified
- [Electron session permissions](https://www.electronjs.org/docs/latest/api/session) - setPermissionRequestHandler for media verified

### Secondary (MEDIUM confidence)
- [Whisper model comparison](https://openwhispr.com/blog/whisper-model-sizes-explained) - Model sizes and WER rates cross-referenced with OpenAI docs
- [Whisper WebGPU vs WASM performance](https://github.com/huggingface/transformers.js/issues/894) - Benchmarks from community testing
- [Electron microphone permissions](https://blog.doyensec.com/2022/09/27/electron-api-default-permissions.html) - Permission handling patterns verified against Electron docs
- [Vite Web Worker docs](https://vitejs.dev/guide/features#web-workers) - Worker creation pattern

### Tertiary (LOW confidence)
- Exact quantized model download sizes may vary by a few MB depending on quantization method used
- WebGPU vs WASM relative performance varies significantly by hardware; benchmarks are indicative not definitive

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - `@huggingface/transformers` is the clear ecosystem standard for browser/Electron Whisper; verified via official docs and HuggingFace model pages
- Architecture: HIGH - Web Worker + getUserMedia + pipeline() is the documented pattern from Xenova/HuggingFace examples and multiple community projects
- Pitfalls: HIGH - Permission handling, WebGPU fallback, memory pressure, and worker bundling are well-documented issues with known solutions
- Model selection: MEDIUM - base.en is a strong default but exact quantized sizes depend on which ONNX files transformers.js actually downloads (encoder + decoder + merged variants)

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (30 days -- transformers.js is actively developed but core API is stable in v3)
