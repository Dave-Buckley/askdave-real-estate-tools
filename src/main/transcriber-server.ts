import http from 'http'
import os from 'os'
import { WebSocketServer, WebSocket } from 'ws'
import type { TranscriberStatus, TranscriberState } from '../shared/types'

// --- Module state ---
let server: http.Server | null = null
let wss: WebSocketServer | null = null
let phoneSocket: WebSocket | null = null
let stateCallback: ((status: TranscriberStatus) => void) | null = null
let receivedAudio: Float32Array | null = null

let currentState: TranscriberState = 'idle'
let currentElapsed = 0
let serverPort = 0
let serverUrl = ''

// --- Helpers ---

/**
 * Get the machine's local WiFi/LAN IPv4 address.
 * Returns the first non-internal IPv4 address found.
 */
function getLocalIP(): string {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    const addrs = interfaces[name]
    if (!addrs) continue
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        return addr.address
      }
    }
  }
  throw new Error(
    'No local network found. Make sure your computer and phone are on the same WiFi network.'
  )
}

function buildStatus(): TranscriberStatus {
  return {
    state: currentState,
    elapsed: currentElapsed,
    phoneConnected: phoneSocket !== null && phoneSocket.readyState === WebSocket.OPEN,
    serverPort: serverPort || undefined,
    serverUrl: serverUrl || undefined
  }
}

function emitState(): void {
  if (stateCallback) stateCallback(buildStatus())
}

// --- Phone recorder HTML page ---

function getRecorderHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>Ask Dave - Meeting Recorder</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0f172a;
    color: #e2e8f0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    -webkit-user-select: none;
    user-select: none;
  }
  h1 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #f8fafc;
  }
  .subtitle {
    font-size: 13px;
    color: #94a3b8;
    margin-bottom: 32px;
  }
  .status {
    font-size: 15px;
    color: #38bdf8;
    margin-bottom: 16px;
    min-height: 24px;
    text-align: center;
  }
  .timer {
    font-size: 48px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: #f1f5f9;
    margin-bottom: 40px;
    letter-spacing: 2px;
  }
  .btn-group {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }
  button {
    padding: 16px 32px;
    border: none;
    border-radius: 12px;
    font-size: 17px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
    min-width: 140px;
    touch-action: manipulation;
  }
  button:active { transform: scale(0.96); }
  button:disabled { opacity: 0.4; cursor: default; transform: none; }
  .btn-start { background: #22c55e; color: #052e16; }
  .btn-pause { background: #f59e0b; color: #451a03; }
  .btn-resume { background: #38bdf8; color: #082f49; }
  .btn-stop { background: #ef4444; color: #450a0a; }
  .error {
    background: #7f1d1d;
    color: #fca5a5;
    padding: 16px;
    border-radius: 8px;
    margin-top: 24px;
    max-width: 340px;
    text-align: center;
    font-size: 14px;
    line-height: 1.5;
  }
  .sending-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15,23,42,0.92);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  .spinner {
    width: 48px; height: 48px;
    border: 4px solid #334155;
    border-top-color: #38bdf8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .done-msg {
    font-size: 18px;
    color: #4ade80;
    text-align: center;
    margin-top: 24px;
  }
</style>
</head>
<body>
<h1>Meeting Recorder</h1>
<p class="subtitle">Ask Dave Real Estate Tools</p>
<div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);border-radius:8px;padding:10px 14px;margin-bottom:16px;max-width:340px;text-align:center">
  <p style="font-size:12px;color:#d4a34a;line-height:1.4;margin:0">Please ensure all participants have given their consent before recording.</p>
</div>
<div id="status" class="status">Connecting to desktop...</div>
<div id="timer" class="timer">00:00</div>
<div id="controls" class="btn-group">
  <button id="btnStart" class="btn-start" disabled>Start Recording</button>
</div>
<div id="error" class="error" style="display:none"></div>
<div id="sendingOverlay" class="sending-overlay" style="display:none">
  <div class="spinner"></div>
  <div style="color:#94a3b8;font-size:16px">Sending audio to desktop...</div>
</div>

<script>
(function() {
  // Elements
  var statusEl = document.getElementById('status');
  var timerEl = document.getElementById('timer');
  var controlsEl = document.getElementById('controls');
  var errorEl = document.getElementById('error');
  var sendingOverlay = document.getElementById('sendingOverlay');
  var btnStart = document.getElementById('btnStart');

  // State
  var ws = null;
  var mediaRecorder = null;
  var recordedChunks = [];
  var stream = null;
  var recording = false;
  var paused = false;
  var startTime = 0;
  var pausedDuration = 0;
  var pauseStart = 0;
  var timerInterval = null;

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }

  function hideError() {
    errorEl.style.display = 'none';
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function updateTimer() {
    if (!recording || paused) return;
    var now = Date.now();
    var elapsed = Math.floor((now - startTime - pausedDuration) / 1000);
    timerEl.textContent = formatTime(elapsed);
    sendJSON({ type: 'elapsed', seconds: elapsed });
  }

  function sendJSON(obj) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    }
  }

  function renderControls(state) {
    controlsEl.innerHTML = '';
    if (state === 'idle' || state === 'connected') {
      var btn = document.createElement('button');
      btn.className = 'btn-start';
      btn.textContent = 'Start Recording';
      btn.onclick = startRecording;
      controlsEl.appendChild(btn);
    } else if (state === 'recording') {
      var btnP = document.createElement('button');
      btnP.className = 'btn-pause';
      btnP.textContent = 'Pause';
      btnP.onclick = pauseRecording;
      controlsEl.appendChild(btnP);

      var btnS = document.createElement('button');
      btnS.className = 'btn-stop';
      btnS.textContent = 'Stop';
      btnS.onclick = stopRecording;
      controlsEl.appendChild(btnS);
    } else if (state === 'paused') {
      var btnR = document.createElement('button');
      btnR.className = 'btn-resume';
      btnR.textContent = 'Resume';
      btnR.onclick = resumeRecording;
      controlsEl.appendChild(btnR);

      var btnS2 = document.createElement('button');
      btnS2.className = 'btn-stop';
      btnS2.textContent = 'Stop';
      btnS2.onclick = stopRecording;
      controlsEl.appendChild(btnS2);
    }
  }

  // Check MediaRecorder support
  if (typeof MediaRecorder === 'undefined') {
    showError('Your browser does not support audio recording. Please use a modern browser (iOS 14.6+, Chrome, Firefox, or Safari).');
    statusEl.textContent = 'Not supported';
    return;
  }

  // Connect WebSocket
  var wsUrl = 'ws://' + location.host;
  ws = new WebSocket(wsUrl);

  ws.onopen = function() {
    statusEl.textContent = 'Connected to desktop';
    statusEl.style.color = '#4ade80';
    hideError();
    renderControls('connected');
  };

  ws.onclose = function() {
    statusEl.textContent = 'Disconnected from desktop';
    statusEl.style.color = '#f87171';
    if (recording) {
      stopTimerInterval();
      recording = false;
      paused = false;
    }
    renderControls('idle');
    btnStart && (btnStart.disabled = true);
  };

  ws.onerror = function() {
    showError('Connection error. Make sure your phone and computer are on the same WiFi network.');
  };

  async function startRecording() {
    hideError();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      showError('Microphone access denied. Please allow microphone access and try again.');
      return;
    }

    recordedChunks = [];

    // Determine best supported MIME type
    var mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'audio/webm';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'audio/mp4';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = ''; // Let browser pick default
    }

    try {
      var options = mimeType ? { mimeType: mimeType } : undefined;
      mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
      showError('Failed to initialize recorder: ' + e.message);
      return;
    }

    mediaRecorder.ondataavailable = function(e) {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.start(1000); // Collect data every 1 second
    recording = true;
    paused = false;
    startTime = Date.now();
    pausedDuration = 0;

    sendJSON({ type: 'state', state: 'recording' });
    statusEl.textContent = 'Recording...';
    statusEl.style.color = '#f87171';
    renderControls('recording');
    startTimerInterval();
  }

  function pauseRecording() {
    if (!mediaRecorder || mediaRecorder.state !== 'recording') return;
    mediaRecorder.pause();
    paused = true;
    pauseStart = Date.now();
    sendJSON({ type: 'state', state: 'paused' });
    statusEl.textContent = 'Paused';
    statusEl.style.color = '#f59e0b';
    renderControls('paused');
  }

  function resumeRecording() {
    if (!mediaRecorder || mediaRecorder.state !== 'paused') return;
    mediaRecorder.resume();
    pausedDuration += Date.now() - pauseStart;
    paused = false;
    sendJSON({ type: 'state', state: 'recording' });
    statusEl.textContent = 'Recording...';
    statusEl.style.color = '#f87171';
    renderControls('recording');
  }

  function stopRecording() {
    if (!mediaRecorder) return;
    stopTimerInterval();
    recording = false;
    paused = false;
    sendJSON({ type: 'state', state: 'stopped' });
    statusEl.textContent = 'Processing audio...';
    statusEl.style.color = '#38bdf8';
    renderControls('idle');

    mediaRecorder.onstop = async function() {
      // Release mic
      if (stream) {
        stream.getTracks().forEach(function(t) { t.stop(); });
        stream = null;
      }

      var blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      recordedChunks = [];

      if (blob.size === 0) {
        showError('No audio was captured.');
        sendJSON({ type: 'error', message: 'No audio captured' });
        return;
      }

      sendingOverlay.style.display = 'flex';

      try {
        var pcmData = await convertTo16kMono(blob);
        // Send as binary (Float32Array buffer)
        ws.send(pcmData.buffer);
        sendJSON({ type: 'audio-complete' });
        sendingOverlay.style.display = 'none';
        statusEl.textContent = 'Audio sent to desktop';
        statusEl.style.color = '#4ade80';
        timerEl.textContent = '00:00';
      } catch (e) {
        sendingOverlay.style.display = 'none';
        showError('Failed to process audio: ' + e.message);
        sendJSON({ type: 'error', message: 'Audio processing failed: ' + e.message });
      }
    };

    mediaRecorder.stop();
  }

  /**
   * Convert recorded audio blob to 16kHz mono Float32Array using OfflineAudioContext.
   */
  async function convertTo16kMono(blob) {
    var arrayBuffer = await blob.arrayBuffer();
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var audioBuffer;
    try {
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } finally {
      audioCtx.close();
    }

    var targetRate = 16000;
    var numSamples = Math.ceil(audioBuffer.duration * targetRate);
    var offlineCtx = new OfflineAudioContext(1, numSamples, targetRate);
    var source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    var rendered = await offlineCtx.startRendering();
    return rendered.getChannelData(0); // Float32Array, 16kHz mono
  }

  function startTimerInterval() {
    stopTimerInterval();
    timerInterval = setInterval(updateTimer, 1000);
  }

  function stopTimerInterval() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
})();
</script>
</body>
</html>`
}

// --- Server exports ---

/**
 * Start the local HTTP+WebSocket server on a free port.
 * Returns the port and full URL for QR code display.
 */
export function startServer(): Promise<{ port: number; url: string }> {
  return new Promise((resolve, reject) => {
    if (server) {
      // Already running
      resolve({ port: serverPort, url: serverUrl })
      return
    }

    let localIP: string
    try {
      localIP = getLocalIP()
    } catch (err) {
      reject(err)
      return
    }

    const httpServer = http.createServer((req, res) => {
      if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(getRecorderHTML())
      } else if (req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ connected: true }))
      } else {
        res.writeHead(404)
        res.end('Not found')
      }
    })

    const wsServer = new WebSocketServer({ server: httpServer })

    wsServer.on('connection', (socket) => {
      // Only allow one phone connection at a time
      if (phoneSocket && phoneSocket.readyState === WebSocket.OPEN) {
        socket.close(4001, 'Another phone is already connected')
        return
      }

      phoneSocket = socket
      currentState = 'waiting'
      currentElapsed = 0
      emitState()

      socket.on('message', (data, isBinary) => {
        if (isBinary) {
          // Binary frame = PCM audio data (Float32Array)
          const buffer = data as Buffer
          receivedAudio = new Float32Array(
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength / 4
          )
          return
        }

        // Text frame = JSON control message
        try {
          const msg = JSON.parse(data.toString())
          if (msg.type === 'state') {
            if (msg.state === 'recording') {
              currentState = 'recording'
            } else if (msg.state === 'paused') {
              currentState = 'paused'
            } else if (msg.state === 'stopped') {
              currentState = 'transcribing'
            }
            emitState()
          } else if (msg.type === 'elapsed') {
            currentElapsed = msg.seconds || 0
            emitState()
          } else if (msg.type === 'audio-complete') {
            // Audio fully received, state already set to 'transcribing' by 'stopped'
            emitState()
          } else if (msg.type === 'error') {
            currentState = 'error'
            emitState()
          }
        } catch {
          // Ignore malformed messages
        }
      })

      socket.on('close', () => {
        if (phoneSocket === socket) {
          phoneSocket = null
          // If server is still running, go back to waiting
          if (server) {
            currentState = 'waiting'
            currentElapsed = 0
            emitState()
          }
        }
      })

      socket.on('error', () => {
        if (phoneSocket === socket) {
          phoneSocket = null
          if (server) {
            currentState = 'waiting'
            currentElapsed = 0
            emitState()
          }
        }
      })
    })

    httpServer.listen(0, '0.0.0.0', () => {
      const addr = httpServer.address()
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to get server address'))
        return
      }

      server = httpServer
      wss = wsServer
      serverPort = addr.port
      serverUrl = `http://${localIP}:${addr.port}`
      currentState = 'waiting'
      currentElapsed = 0

      emitState()
      resolve({ port: serverPort, url: serverUrl })
    })

    httpServer.on('error', (err) => {
      reject(err)
    })
  })
}

/**
 * Stop the server and clean up all resources.
 */
export function stopServer(): void {
  currentState = 'idle'
  currentElapsed = 0

  if (phoneSocket) {
    try {
      phoneSocket.close(1000, 'Server shutting down')
    } catch {
      // Ignore close errors
    }
    phoneSocket = null
  }

  if (wss) {
    try {
      wss.close()
    } catch {
      // Ignore close errors
    }
    wss = null
  }

  if (server) {
    try {
      server.close()
    } catch {
      // Ignore close errors
    }
    server = null
  }

  receivedAudio = null
  serverPort = 0
  serverUrl = ''

  emitState()
}

/**
 * Get the current server/transcriber state.
 */
export function getServerState(): TranscriberStatus {
  return buildStatus()
}

/**
 * Register a callback for state changes.
 */
export function onStateChange(cb: (status: TranscriberStatus) => void): void {
  stateCallback = cb
}

/**
 * Get received audio data (consume-once pattern).
 * Returns the Float32Array and clears the reference for GC.
 */
export function getReceivedAudio(): Float32Array | null {
  const audio = receivedAudio
  receivedAudio = null
  return audio
}
