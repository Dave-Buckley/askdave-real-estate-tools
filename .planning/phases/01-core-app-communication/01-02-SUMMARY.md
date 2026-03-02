---
phase: 01-core-app-communication
plan: 02
subsystem: backend
tags: [electron, ipc, clipboard, hotkeys, phone-normalization, libphonenumber-js, tray, auto-update]

requires:
  - phase: 01-01
    provides: shared types (Template, AppSettings, HotkeyConfig), electron-store instance
provides:
  - Complete main process with all services (tray, clipboard, phone, actions, hotkeys, updater)
  - Full IPC handler layer for renderer communication
  - Three preload scripts exposing typed APIs via contextBridge
  - TypeScript declarations for window.electronAPI, popupAPI, settingsAPI
affects: [01-03, 01-04]

tech-stack:
  added: []
  patterns: [IPC handler registration, contextBridge typed API, clipboard self-poll, globalShortcut with conflict detection]

key-files:
  created:
    - src/main/phone.ts
    - src/main/clipboard.ts
    - src/main/tray.ts
    - src/main/actions.ts
    - src/main/hotkeys.ts
    - src/main/updater.ts
    - src/main/ipc.ts
    - src/renderer/env.d.ts
  modified:
    - src/main/index.ts
    - src/preload/index.ts
    - src/preload/popup.ts
    - src/preload/settings.ts

key-decisions:
  - "Popup auto-dismisses after dial/whatsapp action from popup:dial and popup:whatsapp IPC handlers"
  - "Active number tracked in main process closure — hotkeys read it via getActiveNumber callback"
  - "Store change listeners re-register hotkeys on any hotkey or enabled change — no restart needed"

patterns-established:
  - "IPC channel naming: action:X for fire-and-forget, store:X for request-response, popup:X for popup control"
  - "Preload exposes only named functions via contextBridge — never raw ipcRenderer"
  - "Dev mode URL loading: ELECTRON_RENDERER_URL env var for Vite dev server, file path for production"

requirements-completed: [APP-01, APP-02, APP-04, APP-05, COMM-01, COMM-02]

duration: 5min
completed: 2026-03-02
---

# Phase 01 Plan 02: Main Process Services Summary

**Complete Electron main process with tray/clipboard/phone/hotkeys/IPC/auto-update and three preload bridges exposing typed APIs**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-02T00:46:18Z
- **Completed:** 2026-03-02T00:51:20Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Built all 7 main process service modules (phone, clipboard, tray, actions, hotkeys, updater, ipc)
- Wired complete IPC layer with 13 handlers (7 one-way, 6 two-way)
- Created 3 preload scripts with typed contextBridge APIs for panel, popup, and settings
- App bootstrap in index.ts connects everything: tray, windows, clipboard, hotkeys, login item, auto-update

## Task Commits

Each task was committed atomically:

1. **Task 1: Phone normalization, clipboard polling, tray + window management** - `46d5fbd` (feat)
2. **Task 2: Phone actions, hotkeys, updater, IPC handlers, preload bridges, and app bootstrap** - `9340a6b` (feat)

## Files Created/Modified
- `src/main/phone.ts` - normalizeToUAE() and formatForDisplay() via libphonenumber-js
- `src/main/clipboard.ts` - 500ms clipboard polling with UAE regex detection
- `src/main/tray.ts` - Tray icon, panel window, popup window, settings window, positioning
- `src/main/actions.ts` - openDialler (tel:), openWhatsApp (web/desktop), buildWhatsAppURL
- `src/main/hotkeys.ts` - Global shortcut registration with conflict warning
- `src/main/updater.ts` - Auto-update check on launch, silent install on quit
- `src/main/ipc.ts` - All IPC handlers for actions, store CRUD, popup control
- `src/main/index.ts` - App bootstrap wiring all services together
- `src/preload/index.ts` - Panel contextBridge API (actions + store + events)
- `src/preload/popup.ts` - Popup contextBridge API (dial + whatsapp + dismiss + onShow)
- `src/preload/settings.ts` - Settings contextBridge API (getSettings + saveSettings)
- `src/renderer/env.d.ts` - TypeScript declarations for window.electronAPI/popupAPI/settingsAPI

## Decisions Made
- Used store change listeners for dynamic hotkey re-registration instead of requiring app restart
- Popup auto-dismisses after action buttons (consistent with quick-action UX pattern)
- Active number tracked as module-level variable in main process

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All main process services functional
- Renderer UIs can now call window.electronAPI, popupAPI, settingsAPI
- Ready for Plan 03 (panel UI) and Plan 04 (popup + settings UI)

---
*Phase: 01-core-app-communication*
*Completed: 2026-03-02*
