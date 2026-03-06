# Phase 4: Meeting Transcriber - Context

**Gathered:** 2026-03-06
**Updated:** 2026-03-06 (architectural pivot: phone recording via local WiFi)
**Status:** Ready for re-planning

<domain>
## Phase Boundary

Record client meetings via the agent's phone microphone, transfer audio to the desktop app over local WiFi, transcribe locally using Whisper, and present the transcript for copy-paste. Fully ephemeral -- no audio or transcript data is saved to disk. Agent copies the text into ChatGPT (or similar) to extract relevant information. All processing stays on-device.

</domain>

<architectural_pivot>
## Architectural Pivot (2026-03-06)

**Original approach:** Record from desktop microphone via Web Audio API getUserMedia, pop-out recorder window on desktop.

**New approach:** Record from phone microphone via local WiFi connection. Desktop app starts a local HTTP/WebSocket server, displays a QR code. Agent scans QR on phone, phone browser opens a recorder page, captures audio from phone mic, streams/sends audio to desktop over local network. Desktop transcribes with Whisper.

**Why:** The phone is physically closer to both parties in a meeting (sitting on the table). Better audio quality. The agent's laptop may be across the room or closed. Phone recording is the natural gesture for real estate agents in client meetings.

**What changed:**
- No desktop mic recording (AudioRecorder class from 04-01 is obsolete)
- No pop-out recorder window on desktop
- New: local HTTP server + WebSocket for phone-to-desktop communication
- New: QR code generation and display on desktop
- New: phone-side web page (served by desktop) with recording UI
- Preload API methods need revision (no openRecorder/closeRecorder for pop-out)

**What stays from 04-01 (already built):**
- Whisper Web Worker (whisper-worker.ts) -- transcription is identical regardless of audio source
- Shared types (WhisperModelId, TranscriberState, TranscriberStatus) -- still useful, may need minor tweaks
- @huggingface/transformers dependency -- still needed
- whisperModel setting in electron-store -- still needed

**What needs replacing/removing from 04-01:**
- AudioRecorder class (src/renderer/panel/lib/audio-recorder.ts) -- delete, phone browser handles recording
- Some preload API methods (openRecorder, closeRecorder, onTranscriberState for pop-out relay) -- revise
- env.d.ts declarations -- revise to match new IPC methods

</architectural_pivot>

<decisions>
## Implementation Decisions

### Recording Experience
- Mic icon in the title bar (alongside Hotkeys/Education/Settings buttons) -- always accessible, no contact required
- Clicking the mic icon shows a QR code in the main window
- Agent scans QR on phone -- phone browser opens a recorder page served by the desktop app
- Phone page has Start/Pause/Stop controls, records from phone mic
- Desktop shows connection status and recording state in real-time via WebSocket
- After stopping: audio transfers to desktop, Whisper transcribes, transcript view appears

### Local WiFi Server
- Desktop app starts a lightweight HTTP server on a local port when mic icon is clicked
- Serves a minimal recording web page to the phone browser
- WebSocket connection for real-time state sync (recording/paused/stopped) and audio transfer
- Server shuts down after transcript is complete or session is cancelled
- Phone and desktop must be on the same WiFi network

### QR Code
- QR code contains the local server URL (e.g., http://192.168.x.x:PORT)
- Displayed prominently in the main window when waiting for phone connection
- Once phone connects, QR view transitions to recording status view

### Transcription Approach
- Local Whisper -- completely free, no API costs, no data leaves the device
- Default: English-only Whisper model (~75MB) -- small, fast, ships or downloads quickly
- Optional: multilingual model (~1.5GB) downloadable from Settings for agents who need Arabic/Hindi/Russian support
- No audio saved to disk -- audio held in memory during recording, discarded after transcription
- No transcript saved to disk -- fully ephemeral
- Zero cost -- hard requirement. Nothing in this feature incurs ongoing charges

### Transcript Display
- Transcript appears as a new view in the main window (like Education, Hotkeys views)
- "Copy All" button to copy full transcript to clipboard for pasting into ChatGPT
- Text is selectable for partial copy too
- Once the agent navigates away or starts a new recording, the transcript is gone

### Contact Association
- No contact required to record -- mic button works anytime
- No linking to contacts, no OneNote integration, no storage
- The transcript is standalone, ephemeral text

### Claude's Discretion
- Local server port selection (dynamic or fixed)
- QR code library choice
- Phone recorder page design (must work on both iOS Safari and Android Chrome)
- WebSocket protocol details (binary audio streaming vs post-recording transfer)
- Maximum recording length (reasonable cap with warning)
- Transcription timing (real-time streaming vs post-recording)
- Transcript view layout and styling
- Model download UX (first-use download flow)
- Audio format on phone side (MediaRecorder API vs ScriptProcessor)

</decisions>

<specifics>
## Specific Ideas

- Agent's workflow: Click mic -> Scan QR on phone -> Record meeting on phone -> Stop -> Audio transfers to desktop -> Whisper transcribes -> Copy transcript -> Paste into ChatGPT
- "Data is sensitive" -- no temp files, no disk writes, no logs of transcript content
- Phone recorder page must be minimal and mobile-friendly -- big Start/Stop buttons, clear status
- Multilingual model must be optional, not forced -- keeps things lightweight for agents who only need English
- Feature must be completely free -- no API keys, no subscriptions, no cloud services
- Must work on both iPhone (Safari) and Android (Chrome) browsers

</specifics>

<code_context>
## Existing Code Insights

### Already Built (04-01, salvageable)
- `src/renderer/panel/workers/whisper-worker.ts` -- Whisper Web Worker, fully functional
- `src/shared/types.ts` -- WhisperModelId, TranscriberState, TranscriberStatus types
- `src/main/store.ts` -- whisperModel default setting
- `@huggingface/transformers` -- installed in package.json

### Needs Replacing (04-01, obsolete)
- `src/renderer/panel/lib/audio-recorder.ts` -- desktop mic recorder, DELETE
- Some preload API methods in `src/preload/index.ts` -- revise (openRecorder/closeRecorder were for pop-out window)
- Some env.d.ts declarations -- revise to match

### Reusable Assets
- `TitleBar` component (App.tsx): Nav buttons pattern -- mic icon slots in next to Keyboard/BookOpen/Settings2
- `View` type union in App.tsx: Add 'transcriber' view alongside existing views
- `FlashcardView` pattern: Standalone view with back button, no contact dependency

### Established Patterns
- Frameless window with custom title bar
- IPC via `ipcMain.handle`/`ipcMain.on` in `ipc.ts`, `window.electronAPI.*` in renderer
- electron-store for settings/preferences
- Dark theme: `bg-[#0d0d0e]`, `text-[#ededee]`, Tailwind utility classes
- Lucide icons for all UI icons

### Integration Points
- `src/main/index.ts`: Local HTTP/WebSocket server lifecycle
- `src/main/ipc.ts`: New IPC handlers for server start/stop, transcription status
- `src/renderer/panel/App.tsx`: New 'transcriber' view, mic icon in TitleBar
- `src/preload/index.ts`: Revised electronAPI methods for local server approach
- Settings window: Toggle for multilingual model download

</code_context>

<deferred>
## Deferred Ideas

- Speaker diarization (who said what) -- separate enhancement
- Meeting summaries / AI extraction within the app -- agent uses ChatGPT externally for now
- Saved transcript history / searchable archive -- explicitly out of scope (privacy)
- OneNote integration for transcripts -- not needed since nothing is saved
- Cloud transcription fallback -- conflicts with free/privacy requirements
- Bluetooth audio streaming from phone -- too complex, WiFi approach is simpler
- Companion mobile app for recording -- browser-based approach avoids app install

</deferred>

---

*Phase: 04-meeting-transcriber*
*Context gathered: 2026-03-06*
*Architectural pivot: 2026-03-06*
