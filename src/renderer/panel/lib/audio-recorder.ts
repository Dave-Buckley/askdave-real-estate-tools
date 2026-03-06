/**
 * AudioRecorder -- captures microphone audio as 16kHz mono Float32Array in memory.
 *
 * All audio data stays in memory (no disk I/O). After stop(), the merged
 * Float32Array is returned and internal buffers are released.
 *
 * Max recording cap: 60 minutes. When reached, onMaxReached callback fires
 * and recording auto-stops.
 */

const SAMPLE_RATE = 16000
const BUFFER_SIZE = 4096
const MAX_DURATION_SECONDS = 3600 // 60 minutes

class AudioRecorder {
  private stream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private processor: ScriptProcessorNode | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private chunks: Float32Array[] = []
  private _isPaused = false
  private _isRecording = false
  private totalSamples = 0

  /**
   * Called when the 60-minute recording cap is reached.
   * The recording will auto-stop; the consumer should call stop() to retrieve audio.
   */
  onMaxReached: (() => void) | null = null

  async start(): Promise<void> {
    if (this._isRecording) return

    this.chunks = []
    this.totalSamples = 0
    this._isPaused = false

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: SAMPLE_RATE,
        echoCancellation: true,
        noiseSuppression: true
      }
    })

    this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE })
    this.source = this.audioContext.createMediaStreamSource(this.stream)
    this.processor = this.audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1)

    this.processor.onaudioprocess = (e: AudioProcessingEvent): void => {
      if (this._isPaused) return

      // Check max duration before capturing
      const elapsedSeconds = this.totalSamples / SAMPLE_RATE
      if (elapsedSeconds >= MAX_DURATION_SECONDS) {
        this._autoStop()
        return
      }

      const pcm = e.inputBuffer.getChannelData(0)
      const copy = new Float32Array(pcm)
      this.chunks.push(copy)
      this.totalSamples += copy.length
    }

    this.source.connect(this.processor)
    this.processor.connect(this.audioContext.destination)
    this._isRecording = true
  }

  pause(): void {
    if (!this._isRecording) return
    this._isPaused = true
  }

  resume(): void {
    if (!this._isRecording) return
    this._isPaused = false
  }

  stop(): Float32Array {
    // Stop all media tracks
    this.stream?.getTracks().forEach((t) => t.stop())

    // Disconnect audio nodes
    this.processor?.disconnect()
    this.source?.disconnect()

    // Close audio context (fire and forget -- no need to await)
    this.audioContext?.close()

    // Merge all chunks into a single Float32Array
    const totalLength = this.chunks.reduce((sum, c) => sum + c.length, 0)
    const merged = new Float32Array(totalLength)
    let offset = 0
    for (const chunk of this.chunks) {
      merged.set(chunk, offset)
      offset += chunk.length
    }

    // Release memory
    this.chunks = []
    this.totalSamples = 0
    this._isRecording = false
    this._isPaused = false
    this.stream = null
    this.audioContext = null
    this.processor = null
    this.source = null

    return merged
  }

  /** Returns total seconds of audio recorded (sum of chunk lengths / 16000) */
  getElapsed(): number {
    return this.totalSamples / SAMPLE_RATE
  }

  get isRecording(): boolean {
    return this._isRecording
  }

  get isPaused(): boolean {
    return this._isPaused
  }

  /** Internal: auto-stop when max duration reached */
  private _autoStop(): void {
    this._isRecording = false
    this._isPaused = false

    this.stream?.getTracks().forEach((t) => t.stop())
    this.processor?.disconnect()
    this.source?.disconnect()
    this.audioContext?.close()

    if (this.onMaxReached) {
      this.onMaxReached()
    }
  }
}

export default AudioRecorder
