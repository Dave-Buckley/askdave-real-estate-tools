---
phase: 02-notes-calendar
plan: 03
subsystem: ui
tags: [electron, powershell, winrt, phone-link, react, ipc, windows]

# Dependency graph
requires:
  - phase: 02-01
    provides: openContactPage via onenote:open IPC
  - phase: 02-02
    provides: createFollowUp via calendar:follow-up IPC

provides:
  - Phone Link notification polling via PowerShell WinRT UserNotificationListener
  - phone-link.ts: startPhoneLinkWatcher, stopPhoneLinkWatcher
  - IncomingCallBar.tsx: incoming call bar with Open OneNote + follow-up prompt
  - phone-link:incoming-call and phone-link:call-ended IPC events to popup window
  - phoneLinkEnabled toggle starts/stops watcher dynamically

affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PowerShell WinRT bridge via execFile for accessing Windows notification APIs
    - Phone Link package name partial match for Microsoft rebranding resilience
    - Auto-dismiss timers with useRef for cleanup on unmount

key-files:
  created:
    - src/main/phone-link.ts
    - src/renderer/popup/components/IncomingCallBar.tsx
  modified:
    - src/main/index.ts
    - src/preload/popup.ts
    - src/preload/index.ts
    - src/renderer/popup/App.tsx
    - src/renderer/env.d.ts

key-decisions:
  - "Phone Link polling uses PowerShell WinRT UserNotificationListener at 2s intervals per RESEARCH.md recommendation"
  - "Partial package name match (*YourPhone*, *PhoneLink*, *Phone Link*) handles Microsoft rebranding across OS versions"
  - "Call-ended events fall back to lastCall state vars when notification lacks phone number"
  - "lastSeenNotificationIds trimmed to 50 entries to prevent memory leak"
  - "IncomingCallBar renders above ActionBar so visible without active phone number"
  - "oneNoteEnabled loaded from settings on mount to gate Open OneNote button visibility"

patterns-established:
  - "Pattern: WinRT polling via PowerShell execFile with 5s timeout for Windows-only features"
  - "Pattern: Auto-dismiss timers stored in useRef for stable cleanup across re-renders"

requirements-completed:
  - APP-03

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 2 Plan 3: Phone Link Incoming Call Detection Summary

**PowerShell WinRT polling for Phone Link notifications, IncomingCallBar with Open OneNote + 7/15/30-day follow-up prompt wired to popup window**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T18:42:52Z
- **Completed:** 2026-03-02T18:45:49Z
- **Tasks:** 2 of 3 (Task 3 is checkpoint:human-verify — awaiting user verification)
- **Files modified:** 7

## Accomplishments
- Created phone-link.ts with PowerShell WinRT polling: detects incoming calls and call-ended events from Phone Link notifications every 2 seconds
- IncomingCallBar component: incoming state shows caller name/number + Open OneNote button; ended state shows 7/15/30-day follow-up prompt with auto-dismiss
- Full IPC wiring: popup window receives phone-link events, preloads expose them to renderer, env.d.ts types updated
- Watcher starts/stops dynamically via phoneLinkEnabled store change listener; Windows-only

## Task Commits

Each task was committed atomically:

1. **Task 1: Create phone-link.ts with PowerShell notification polling** - `1f37a02` (feat)
2. **Task 2: Create IncomingCallBar UI with OneNote + follow-up prompt** - `1c7596d` (feat)
3. **Task 3: Verify Phone Link detection end-to-end** - CHECKPOINT — awaiting human verification

## Files Created/Modified
- `src/main/phone-link.ts` - PowerShell WinRT polling, startPhoneLinkWatcher / stopPhoneLinkWatcher exports
- `src/main/index.ts` - Added phone-link import, startup watcher call, phoneLinkEnabled store listener, stopPhoneLinkWatcher on quit
- `src/renderer/popup/components/IncomingCallBar.tsx` - Incoming call and call-ended notification bar
- `src/renderer/popup/App.tsx` - callEvent state, onIncomingCall/onCallEnded listeners, auto-dismiss timers, IncomingCallBar rendering
- `src/preload/popup.ts` - onIncomingCall, onCallEnded, onPhoneLinkAccessDenied event listeners
- `src/preload/index.ts` - onIncomingCall, onCallEnded event listeners for panel
- `src/renderer/env.d.ts` - PopupAPI and ElectronAPI interfaces updated with phone-link event methods

## Decisions Made
- PowerShell WinRT polling at 2s intervals per RESEARCH.md recommendation for v1 (no native WinRT bindings)
- Partial package name match (*YourPhone*, *PhoneLink*, *Phone Link*) handles Microsoft rebranding across Windows versions
- Call-ended events fall back to lastCall state variables when the notification itself lacks a phone number
- lastSeenNotificationIds trimmed to last 50 entries to prevent unbounded memory growth
- IncomingCallBar renders above ActionBar (in a padded container) so it's visible even when no phone number is active
- oneNoteEnabled loaded from getSettings() on mount to gate Open OneNote button visibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] normalizePhone returns string|null, not {e164, display} object**
- **Found during:** Task 1 (phone-link.ts creation)
- **Issue:** Plan's interface diagram showed `normalizePhone` returning `{ e164: string; display: string }` but actual phone.ts returns `string | null`
- **Fix:** Adapted pollPhoneLinkNotifications to use the actual return type; used raw notification text directly as displayNumber
- **Files modified:** src/main/phone-link.ts
- **Verification:** TypeScript compiles without errors
- **Committed in:** 1f37a02 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — interface mismatch)
**Impact on plan:** Minor adaptation required. No scope change; behavior unchanged.

## Issues Encountered
- Plan's interface diagram for normalizePhone was outdated (returns string|null, not an object). Adapted inline per Rule 1.

## User Setup Required
None — Phone Link detection runs automatically on Windows when phoneLinkEnabled is true.

## Next Phase Readiness
- Tasks 1 and 2 complete: phone-link.ts and IncomingCallBar fully implemented
- Task 3 (human-verify) remains — user must test with a real Phone Link-connected device
- After verification, Phase 2 (notes-calendar) will be complete

## Self-Check: PASSED

- `src/main/phone-link.ts` — FOUND
- `src/renderer/popup/components/IncomingCallBar.tsx` — FOUND
- Commit `1f37a02` — FOUND
- Commit `1c7596d` — FOUND
- `.planning/phases/02-notes-calendar/02-03-SUMMARY.md` — FOUND

---
*Phase: 02-notes-calendar*
*Completed: 2026-03-02*
