/**
 * Whisper Web Worker -- loads a Whisper ONNX model via @huggingface/transformers
 * and transcribes Float32Array audio to text.
 *
 * Runs in a dedicated Web Worker so transcription does not block the UI thread.
 *
 * Message protocol:
 *   Incoming: { type: 'load', model: WhisperModelId }
 *             { type: 'transcribe', audio: Float32Array }
 *             { type: 'unload' }
 *
 *   Outgoing: { type: 'loading', progress: { status, file, loaded, total, progress } }
 *             { type: 'ready' }
 *             { type: 'result', text: string }
 *             { type: 'error', error: string }
 *             { type: 'unloaded' }
 */

import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers'

// Allow downloading models from HuggingFace Hub
env.allowRemoteModels = true
// Let the browser Cache API handle caching (correct for Electron renderer/worker context)

let transcriber: AutomaticSpeechRecognitionPipeline | null = null

self.onmessage = async (event: MessageEvent) => {
  const { type } = event.data

  if (type === 'load') {
    const { model } = event.data as { type: 'load'; model: string }

    try {
      // Detect WebGPU availability
      let device: 'webgpu' | 'wasm' = 'wasm'
      let dtype: 'q8' | { encoder_model: 'fp32'; decoder_model_merged: 'q8' } = 'q8'

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gpu = (navigator as any).gpu
        if (gpu) {
          const adapter = await gpu.requestAdapter()
          if (adapter) {
            device = 'webgpu'
            dtype = { encoder_model: 'fp32', decoder_model_merged: 'q8' }
          }
        }
      } catch {
        // WebGPU not available, fall back to WASM
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const progressCallback = (progress: any): void => {
        self.postMessage({ type: 'loading', progress })
      }

      // Cast options to any to work around TS2590 -- the @huggingface/transformers
      // pipeline() overload signature produces a union too complex for TypeScript
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transcriber = await (pipeline as any)(
        'automatic-speech-recognition',
        model,
        { device, dtype, progress_callback: progressCallback }
      ) as AutomaticSpeechRecognitionPipeline

      self.postMessage({ type: 'ready' })
    } catch (err) {
      self.postMessage({ type: 'error', error: err instanceof Error ? err.message : String(err) })
    }
  }

  if (type === 'transcribe') {
    const { audio } = event.data as { type: 'transcribe'; audio: Float32Array }

    if (!transcriber) {
      self.postMessage({ type: 'error', error: 'Model not loaded. Send a "load" message first.' })
      return
    }

    try {
      const result = await transcriber(audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: false
      })

      // result can be a single object or array; handle both
      const text = Array.isArray(result) ? result.map((r) => r.text).join(' ') : result.text
      self.postMessage({ type: 'result', text })
    } catch (err) {
      self.postMessage({ type: 'error', error: err instanceof Error ? err.message : String(err) })
    }
  }

  if (type === 'unload') {
    transcriber = null
    self.postMessage({ type: 'unloaded' })
  }
}
