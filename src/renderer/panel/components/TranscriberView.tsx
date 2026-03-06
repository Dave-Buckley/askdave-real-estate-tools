import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Smartphone,
  Monitor,
  Mic,
  Loader2,
  Copy,
  Check,
  Pause,
  Square,
  Play,
  ChevronLeft,
  Wifi,
  AlertCircle
} from 'lucide-react'
import QRCode from 'qrcode'
import type { TranscriberStatus } from '../../../shared/types'

type Phase = 'source-select' | 'phone' | 'desktop' | 'transcribing' | 'done' | 'error'

interface TranscriberViewProps {
  onBack: () => void
}

export default function TranscriberView({ onBack }: TranscriberViewProps): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>('source-select')
  const [errorMsg, setErrorMsg] = useState('')
  const [transcript, setTranscript] = useState('')
  const [copied, setCopied] = useState(false)

  // Phone flow state
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [phoneStatus, setPhoneStatus] = useState<TranscriberStatus>({ state: 'idle' })

  // Desktop flow state
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [desktopRecording, setDesktopRecording] = useState(false)
  const [desktopPaused, setDesktopPaused] = useState(false)

  // Shared timer state
  const [elapsed, setElapsed] = useState(0)

  // Model loading state
  const [modelLoading, setModelLoading] = useState(false)
  const [modelProgress, setModelProgress] = useState(0)

  // Refs
  const workerRef = useRef<Worker | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const pausedDurationRef = useRef(0)
  const pauseStartRef = useRef(0)

  // Cleanup function for all resources
  const cleanup = useCallback(() => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Stop desktop recording
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    recorderRef.current = null

    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    // Terminate worker
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }

    // Stop transcriber server (phone flow)
    window.electronAPI.stopTranscriberServer().catch(() => {})
    window.electronAPI.removeTranscriberStateListener()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  // ── Timer helpers ──────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now()
    pausedDurationRef.current = 0
    pauseStartRef.current = 0
    setElapsed(0)
    timerRef.current = setInterval(() => {
      const now = Date.now()
      const totalPaused = pausedDurationRef.current + (pauseStartRef.current > 0 ? now - pauseStartRef.current : 0)
      setElapsed(Math.floor((now - startTimeRef.current - totalPaused) / 1000))
    }, 1000)
  }, [])

  const pauseTimer = useCallback(() => {
    pauseStartRef.current = Date.now()
  }, [])

  const resumeTimer = useCallback(() => {
    if (pauseStartRef.current > 0) {
      pausedDurationRef.current += Date.now() - pauseStartRef.current
      pauseStartRef.current = 0
    }
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // ── Whisper transcription (shared) ─────────────────────────────────
  const startTranscription = useCallback(async (pcmAudio: Float32Array) => {
    setPhase('transcribing')
    setModelLoading(true)
    setModelProgress(0)

    try {
      const worker = new Worker(
        new URL('../workers/whisper-worker.ts', import.meta.url),
        { type: 'module' }
      )
      workerRef.current = worker

      const settings = await window.electronAPI.getSettings()
      const modelId = settings.whisperModel || 'onnx-community/whisper-base.en'

      worker.onmessage = (event: MessageEvent) => {
        const { type } = event.data

        if (type === 'loading') {
          const { progress } = event.data
          if (progress && typeof progress.progress === 'number') {
            setModelProgress(Math.round(progress.progress))
          }
        }

        if (type === 'ready') {
          setModelLoading(false)
          // Send audio for transcription with transferable
          worker.postMessage(
            { type: 'transcribe', audio: pcmAudio },
            [pcmAudio.buffer]
          )
        }

        if (type === 'result') {
          setTranscript(event.data.text.trim())
          setPhase('done')
          worker.terminate()
          workerRef.current = null
        }

        if (type === 'error') {
          setErrorMsg(event.data.error || 'Transcription failed')
          setPhase('error')
          worker.terminate()
          workerRef.current = null
        }
      }

      worker.onerror = (err) => {
        setErrorMsg(err.message || 'Worker error')
        setPhase('error')
        worker.terminate()
        workerRef.current = null
      }

      // Load model
      worker.postMessage({ type: 'load', model: modelId })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setPhase('error')
    }
  }, [])

  // ── Phone flow ─────────────────────────────────────────────────────
  const startPhoneFlow = useCallback(async () => {
    setPhase('phone')
    setQrDataUrl(null)
    setPhoneStatus({ state: 'idle' })

    try {
      const result = await window.electronAPI.startTranscriberServer()
      if (!result.success || !result.url) {
        setErrorMsg(result.error || 'Failed to start server')
        setPhase('error')
        return
      }

      // Generate QR code
      const dataUrl = await QRCode.toDataURL(result.url, {
        width: 200,
        margin: 2,
        color: { dark: '#ededee', light: '#0d0d0e' }
      })
      setQrDataUrl(dataUrl)

      // Subscribe to state updates
      window.electronAPI.onTranscriberState((status: TranscriberStatus) => {
        setPhoneStatus(status)

        // Track elapsed from server state
        if (status.elapsed !== undefined) {
          setElapsed(status.elapsed)
        }

        // When server indicates transcription ready, get audio and transcribe
        if (status.state === 'transcribing') {
          window.electronAPI.getTranscriberAudio().then((audio) => {
            if (audio) {
              startTranscription(audio)
            } else {
              setErrorMsg('No audio received from phone')
              setPhase('error')
            }
          })
        }
      })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setPhase('error')
    }
  }, [startTranscription])

  const stopPhoneFlow = useCallback(() => {
    window.electronAPI.stopTranscriberServer().catch(() => {})
    window.electronAPI.removeTranscriberStateListener()
    setPhase('source-select')
    setQrDataUrl(null)
    setPhoneStatus({ state: 'idle' })
    stopTimer()
    setElapsed(0)
  }, [stopTimer])

  // ── Desktop flow ───────────────────────────────────────────────────
  const startDesktopFlow = useCallback(async () => {
    setPhase('desktop')
    setDesktopRecording(false)
    setDesktopPaused(false)

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter((d) => d.kind === 'audioinput')
      setAudioDevices(audioInputs)

      if (audioInputs.length > 0) {
        // Select default device
        const defaultDevice = audioInputs.find((d) => d.deviceId === 'default') || audioInputs[0]
        setSelectedDeviceId(defaultDevice.deviceId)
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setPhase('error')
    }
  }, [])

  const startDesktopRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: selectedDeviceId } }
      })
      streamRef.current = stream

      // Determine MIME type
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/webm'
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/mp4'
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stopTimer()

        // Stop stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }

        // Convert to 16kHz mono Float32Array
        try {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || 'audio/webm'
          })
          chunksRef.current = []
          const arrayBuffer = await blob.arrayBuffer()
          const audioCtx = new AudioContext()
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
          audioCtx.close()

          const targetRate = 16000
          const numSamples = Math.ceil(audioBuffer.duration * targetRate)
          const offlineCtx = new OfflineAudioContext(1, numSamples, targetRate)
          const source = offlineCtx.createBufferSource()
          source.buffer = audioBuffer
          source.connect(offlineCtx.destination)
          source.start(0)
          const rendered = await offlineCtx.startRendering()
          const pcmAudio = rendered.getChannelData(0)

          startTranscription(pcmAudio)
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : String(err))
          setPhase('error')
        }
      }

      recorder.start(1000)
      recorderRef.current = recorder
      setDesktopRecording(true)
      setDesktopPaused(false)
      startTimer()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setPhase('error')
    }
  }, [selectedDeviceId, startTimer, stopTimer, startTranscription])

  const pauseDesktopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.pause()
      setDesktopPaused(true)
      pauseTimer()
    }
  }, [pauseTimer])

  const resumeDesktopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'paused') {
      recorderRef.current.resume()
      setDesktopPaused(false)
      resumeTimer()
    }
  }, [resumeTimer])

  const stopDesktopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
      setDesktopRecording(false)
      setDesktopPaused(false)
    }
  }, [])

  const backToSourceSelect = useCallback(() => {
    // Stop any active recording
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    stopTimer()
    setElapsed(0)
    setDesktopRecording(false)
    setDesktopPaused(false)
    setPhase('source-select')
  }, [stopTimer])

  // ── Copy handler ───────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(transcript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [transcript])

  // ── Reset to source select ────────────────────────────────────────
  const handleNewRecording = useCallback(() => {
    cleanup()
    setPhase('source-select')
    setTranscript('')
    setErrorMsg('')
    setElapsed(0)
    setCopied(false)
    setModelLoading(false)
    setModelProgress(0)
    setDesktopRecording(false)
    setDesktopPaused(false)
    setQrDataUrl(null)
    setPhoneStatus({ state: 'idle' })
  }, [cleanup])

  // ── RENDER ─────────────────────────────────────────────────────────

  // A) Source Selection
  if (phase === 'source-select') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs text-[#a1a1aa] text-center mb-1">Choose recording source</p>

        {/* Phone Mic card */}
        <button
          onClick={startPhoneFlow}
          className="w-full text-left bg-[#161617] border border-white/[0.07] rounded-lg p-4 hover:border-[#818cf8]/40 hover:bg-[rgba(99,102,241,0.06)] transition-colors"
        >
          <div className="flex items-start gap-3">
            <Smartphone size={24} className="text-[#818cf8] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-[#ededee]">Phone Mic</span>
              <span className="text-xs text-[#a1a1aa]">Record via your phone browser over WiFi</span>
              <span className="text-[11px] text-[#5a5a60]">Best for meetings — place phone near speakers</span>
            </div>
          </div>
        </button>

        {/* Desktop Mic card */}
        <button
          onClick={startDesktopFlow}
          className="w-full text-left bg-[#161617] border border-white/[0.07] rounded-lg p-4 hover:border-[#818cf8]/40 hover:bg-[rgba(99,102,241,0.06)] transition-colors"
        >
          <div className="flex items-start gap-3">
            <Monitor size={24} className="text-[#818cf8] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-[#ededee]">Desktop Mic</span>
              <span className="text-xs text-[#a1a1aa]">Record from laptop mic, USB mic, or headset</span>
              <span className="text-[11px] text-[#5a5a60]">Works offline — no WiFi needed</span>
            </div>
          </div>
        </button>
      </div>
    )
  }

  // B) Phone Flow
  if (phase === 'phone') {
    const { state, phoneConnected } = phoneStatus

    // B1: Waiting for phone
    if (!phoneConnected && state !== 'recording' && state !== 'paused') {
      return (
        <div className="flex flex-col items-center gap-4">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR Code" className="w-[200px] h-[200px] rounded-lg" />
              <p className="text-sm text-[#ededee]">Scan this QR code on your phone</p>
              <div className="flex items-center gap-2 text-[11px] text-[#5a5a60]">
                <Wifi size={12} />
                <span>Make sure your phone and computer are on the same WiFi</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 py-8">
              <Loader2 size={16} className="animate-spin text-[#818cf8]" />
              <span className="text-xs text-[#a1a1aa]">Starting server...</span>
            </div>
          )}
          <button
            onClick={stopPhoneFlow}
            className="flex items-center gap-1.5 text-xs text-[#a1a1aa] hover:text-[#ededee] transition-colors"
          >
            <ChevronLeft size={12} />
            Back
          </button>
        </div>
      )
    }

    // B2: Phone connected, idle/waiting
    if (phoneConnected && (state === 'waiting' || state === 'idle')) {
      return (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-[#ededee]">Phone connected</span>
          </div>
          <p className="text-xs text-[#a1a1aa]">Tap Start on your phone to begin recording</p>
          <button
            onClick={stopPhoneFlow}
            className="text-xs text-[#a1a1aa] hover:text-[#ededee] transition-colors mt-2"
          >
            Disconnect
          </button>
        </div>
      )
    }

    // B3: Recording
    if (state === 'recording') {
      return (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-[#ededee]">Recording...</span>
          </div>
          <span className="text-2xl font-mono text-[#ededee] tabular-nums">{formatTime(elapsed)}</span>
          <p className="text-xs text-[#a1a1aa] text-center">Recording on phone... Tap Stop on your phone when done.</p>
        </div>
      )
    }

    // B4: Paused
    if (state === 'paused') {
      return (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-sm text-[#ededee]">Paused</span>
          </div>
          <span className="text-2xl font-mono text-[#ededee] tabular-nums">{formatTime(elapsed)}</span>
          <p className="text-xs text-[#a1a1aa]">Tap Resume on your phone to continue</p>
        </div>
      )
    }

    // Fallback waiting state
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <Loader2 size={16} className="animate-spin text-[#818cf8]" />
        <span className="text-xs text-[#a1a1aa]">Connecting...</span>
      </div>
    )
  }

  // C) Desktop Flow
  if (phase === 'desktop') {
    // C1: Not recording yet - device selection
    if (!desktopRecording) {
      return (
        <div className="flex flex-col gap-4">
          {audioDevices.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <AlertCircle size={24} className="text-red-400" />
              <p className="text-sm text-[#ededee]">No audio input devices found</p>
              <p className="text-xs text-[#a1a1aa]">Please connect a microphone and try again</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#a1a1aa]">Audio Input Device</label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="bg-[#161617] text-[#ededee] border border-white/[0.07] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#818cf8]/40"
                >
                  {audioDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={startDesktopRecording}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm bg-[rgba(99,102,241,0.14)] text-[#818cf8] border border-[rgba(99,102,241,0.25)] rounded-lg hover:bg-[rgba(99,102,241,0.22)] transition-colors"
              >
                <Mic size={16} />
                Start Recording
              </button>
            </>
          )}

          <button
            onClick={backToSourceSelect}
            className="flex items-center gap-1.5 text-xs text-[#a1a1aa] hover:text-[#ededee] transition-colors mx-auto"
          >
            <ChevronLeft size={12} />
            Back
          </button>
        </div>
      )
    }

    // C2: Recording
    if (desktopRecording && !desktopPaused) {
      return (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-[#ededee]">Recording...</span>
          </div>
          <span className="text-2xl font-mono text-[#ededee] tabular-nums">{formatTime(elapsed)}</span>
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={pauseDesktopRecording}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm bg-[rgba(245,158,11,0.14)] text-[#f59e0b] border border-[rgba(245,158,11,0.25)] rounded-lg hover:bg-[rgba(245,158,11,0.22)] transition-colors"
            >
              <Pause size={14} />
              Pause
            </button>
            <button
              onClick={stopDesktopRecording}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm bg-[rgba(239,68,68,0.14)] text-[#ef4444] border border-[rgba(239,68,68,0.25)] rounded-lg hover:bg-[rgba(239,68,68,0.22)] transition-colors"
            >
              <Square size={14} />
              Stop
            </button>
          </div>
        </div>
      )
    }

    // C3: Paused
    if (desktopRecording && desktopPaused) {
      return (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-sm text-[#ededee]">Paused</span>
          </div>
          <span className="text-2xl font-mono text-[#ededee] tabular-nums">{formatTime(elapsed)}</span>
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={resumeDesktopRecording}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm bg-[rgba(99,102,241,0.14)] text-[#818cf8] border border-[rgba(99,102,241,0.25)] rounded-lg hover:bg-[rgba(99,102,241,0.22)] transition-colors"
            >
              <Play size={14} />
              Resume
            </button>
            <button
              onClick={stopDesktopRecording}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm bg-[rgba(239,68,68,0.14)] text-[#ef4444] border border-[rgba(239,68,68,0.25)] rounded-lg hover:bg-[rgba(239,68,68,0.22)] transition-colors"
            >
              <Square size={14} />
              Stop
            </button>
          </div>
        </div>
      )
    }
  }

  // D) Transcribing
  if (phase === 'transcribing') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 size={24} className="animate-spin text-[#818cf8]" />
        {modelLoading ? (
          <>
            <p className="text-sm text-[#ededee]">Downloading model ({modelProgress}%)...</p>
            <div className="w-full bg-[#161617] rounded-full h-1.5">
              <div
                className="bg-[#818cf8] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${modelProgress}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-[#ededee]">Transcribing...</p>
        )}
      </div>
    )
  }

  // E) Done
  if (phase === 'done') {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#ededee]">Transcript</h3>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[rgba(99,102,241,0.14)] text-[#818cf8] border border-[rgba(99,102,241,0.25)] rounded-md hover:bg-[rgba(99,102,241,0.22)] transition-colors"
          >
            {copied ? (
              <>
                <Check size={12} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={12} />
                Copy All
              </>
            )}
          </button>
        </div>

        <div className="bg-[#161617] border border-white/[0.07] rounded-lg p-3 max-h-[400px] overflow-y-auto select-text" style={{ userSelect: 'text' }}>
          <p className="text-sm text-[#d4d4d8] leading-relaxed whitespace-pre-wrap">{transcript}</p>
        </div>

        <button
          onClick={handleNewRecording}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm bg-[rgba(99,102,241,0.14)] text-[#818cf8] border border-[rgba(99,102,241,0.25)] rounded-lg hover:bg-[rgba(99,102,241,0.22)] transition-colors"
        >
          <Mic size={14} />
          New Recording
        </button>
      </div>
    )
  }

  // F) Error
  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <AlertCircle size={24} className="text-red-400" />
        <p className="text-sm text-[#ededee]">Something went wrong</p>
        <p className="text-xs text-[#a1a1aa] text-center">{errorMsg}</p>
        <button
          onClick={handleNewRecording}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-[rgba(99,102,241,0.14)] text-[#818cf8] border border-[rgba(99,102,241,0.25)] rounded-lg hover:bg-[rgba(99,102,241,0.22)] transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Fallback (should not reach)
  return <div />
}
