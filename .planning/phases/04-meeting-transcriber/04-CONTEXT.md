# Phase 4: Meeting Transcriber - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Record client meetings via microphone, transcribe audio to text locally using Whisper, and present the transcript for copy-paste. Fully ephemeral — no audio or transcript data is saved to disk. Agent copies the text into ChatGPT (or similar) to extract relevant information. All processing stays on-device.

</domain>

<decisions>
## Implementation Decisions

### Recording Experience
- Mic icon in the title bar (alongside Hotkeys/Education/Settings buttons) — always accessible, no contact required
- Clicking the mic icon opens a separate always-on-top pop-out window for the recording session
- Pause/resume supported within a recording session
- Title bar mic icon pulses red while recording is active (visual confirmation in main window)
- After stopping: pop-out closes, main window navigates to transcript view

### Pop-out Window
- Claude's discretion on design — floating, always-on-top, minimal, shows recording state

### Transcription Approach
- Local Whisper — completely free, no API costs, no data leaves the device
- Default: English-only Whisper model (~75MB) — small, fast, ships or downloads quickly
- Optional: multilingual model (~1.5GB) downloadable from Settings for agents who need Arabic/Hindi/Russian support
- No audio saved to disk — audio held in memory during recording, discarded after transcription
- No transcript saved to disk — fully ephemeral
- Zero cost — hard requirement. Nothing in this feature incurs ongoing charges

### Transcript Display
- Transcript appears as a new view in the main window (like Education, Hotkeys views) — Claude's discretion on exact layout
- "Copy All" button to copy full transcript to clipboard for pasting into ChatGPT
- Text is selectable for partial copy too
- Once the agent navigates away or starts a new recording, the transcript is gone

### Contact Association
- No contact required to record — mic button works anytime
- No linking to contacts, no OneNote integration, no storage
- The transcript is standalone, ephemeral text

### Claude's Discretion
- Pop-out window design (layout, size, what it shows)
- Maximum recording length (reasonable cap with warning)
- Transcription timing (real-time streaming vs post-recording)
- Transcript view layout and styling
- Model download UX (first-use download flow)
- Audio format and in-memory handling
- Whisper model size selection (tiny/base/small/medium for English)

</decisions>

<specifics>
## Specific Ideas

- Agent's workflow: Record meeting -> Stop -> Copy transcript -> Paste into ChatGPT -> Extract relevant info (qualifying questions, action items, property preferences)
- "Data is sensitive" — no temp files, no disk writes, no logs of transcript content
- Multilingual model must be optional, not forced — keeps things lightweight for agents who only need English
- Feature must be completely free — no API keys, no subscriptions, no cloud services

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TitleBar` component (App.tsx): Nav buttons pattern — mic icon slots in next to Keyboard/BookOpen/Settings2
- `View` type union in App.tsx: Add 'transcriber' view alongside existing views
- `IncomingCallBar` component: Reference for notification-style UI patterns
- `FlashcardView` pattern: Standalone view with back button, no contact dependency

### Established Patterns
- Frameless window with custom title bar — pop-out window should match this style
- IPC via `ipcMain.handle`/`ipcMain.on` in `ipc.ts`, `window.electronAPI.*` in renderer
- electron-store for settings/preferences (e.g., which Whisper model to use)
- Dark theme: `bg-[#0d0d0e]`, `text-[#ededee]`, Tailwind utility classes
- Lucide icons for all UI icons

### Integration Points
- `src/main/index.ts`: New BrowserWindow creation for recording pop-out
- `src/main/ipc.ts`: New IPC handlers for recording start/stop/pause, transcription
- `src/renderer/panel/App.tsx`: New 'transcriber' view, mic icon in TitleBar
- `src/preload/index.ts`: Expose new electronAPI methods for recording/transcription
- `src/shared/types.ts`: Settings type may need whisper model preference
- Settings window: Toggle for multilingual model download

</code_context>

<deferred>
## Deferred Ideas

- Speaker diarization (who said what) — separate enhancement
- Meeting summaries / AI extraction within the app — agent uses ChatGPT externally for now
- Saved transcript history / searchable archive — explicitly out of scope (privacy)
- OneNote integration for transcripts — not needed since nothing is saved
- Cloud transcription fallback — conflicts with free/privacy requirements

</deferred>

---

*Phase: 04-meeting-transcriber*
*Context gathered: 2026-03-06*
