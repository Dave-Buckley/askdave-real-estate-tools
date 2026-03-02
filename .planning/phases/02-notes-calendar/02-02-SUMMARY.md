---
phase: 02-notes-calendar
plan: "02"
subsystem: ui
tags: [google-calendar, googleapis, electron, react, ipc, typescript]

# Dependency graph
requires:
  - phase: 02-01
    provides: OneNote Graph API integration, openContactPage(), auth/google.ts getGoogleAuth()

provides:
  - createFollowUp() function in calendar.ts using googleapis Calendar API events.insert
  - IPC handler calendar:follow-up wired to main process
  - Follow-up reminder UI (7d/15d/30d buttons) on ContactCard
  - Dial button now auto-opens OneNote page alongside dialling
  - followUpPromptEnabled setting with toggle in FeatureToggles

affects: [03-distribution, settings-ui, contact-card-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "googleapis calendar.events.insert with requestBody (not deprecated resource)"
    - "Asia/Dubai timezone on calendar event start/end to avoid UTC offset issues"
    - "Non-blocking secondary action: dial is primary, OneNote open is silent-failure secondary"
    - "IPC returns typed { success, error?, eventDate? } union for renderer error handling"

key-files:
  created: []
  modified:
    - src/main/calendar.ts
    - src/main/ipc.ts
    - src/main/store.ts
    - src/shared/types.ts
    - src/preload/index.ts
    - src/preload/popup.ts
    - src/renderer/env.d.ts
    - src/renderer/panel/components/ContactCard.tsx
    - src/renderer/panel/App.tsx
    - src/renderer/settings/components/FeatureToggles.tsx
    - src/renderer/settings/App.tsx

key-decisions:
  - "Follow-up presets are 7, 15, 30 days per CONTEXT.md locked decision (not 3, 15, 30 from REQUIREMENTS.md)"
  - "Dial-triggers-OneNote is non-blocking: openInOneNote called with .catch(() => {}) — dial is primary action"
  - "createFollowUp uses requestBody parameter (not deprecated resource) per googleapis v4 API"
  - "Events use Asia/Dubai timezone to ensure 9 AM local time regardless of server UTC offset"
  - "Fixed openInOneNote return type in env.d.ts from Promise<void> to typed union — deviation Rule 1"

patterns-established:
  - "Calendar API: Always use requestBody, never resource"
  - "Secondary side-effects from UI actions use .catch(() => {}) silent failure pattern"

requirements-completed: [ORG-01]

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 2 Plan 02: Google Calendar Follow-Up and Dial-to-OneNote Summary

**Google Calendar API follow-up event creation (7/15/30 day presets at 9 AM Dubai time) with dial-triggers-OneNote auto-open via googleapis events.insert**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T18:35:39Z
- **Completed:** 2026-03-02T18:38:45Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- createFollowUp() added to calendar.ts using googleapis Calendar API events.insert with requestBody and Asia/Dubai timezone
- ContactCard now shows 7d/15d/30d follow-up buttons when calendarEnabled and followUpPromptEnabled, with success/error feedback
- Dial button silently triggers openInOneNote alongside dialling (non-blocking, secondary action)
- followUpPromptEnabled toggle added to FeatureToggles in Settings, wired end-to-end through AppSettings

## Task Commits

Each task was committed atomically:

1. **Task 1: Add createFollowUp to calendar.ts and wire IPC** - `10d6bfb` (feat)
2. **Task 2: Add follow-up UI to ContactCard and dial-triggers-OneNote** - `862a5a3` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/main/calendar.ts` - Added createFollowUp() using googleapis calendar.events.insert; kept openCalendarBooking untouched
- `src/main/ipc.ts` - Added calendar:follow-up IPC handler; added createFollowUp import
- `src/main/store.ts` - Added followUpPromptEnabled: true default
- `src/shared/types.ts` - Added followUpPromptEnabled: boolean to AppSettings interface
- `src/preload/index.ts` - Exposed createFollowUp method on electronAPI
- `src/preload/popup.ts` - Exposed createFollowUp method on popupAPI
- `src/renderer/env.d.ts` - Added createFollowUp to ElectronAPI and PopupAPI; fixed openInOneNote return type
- `src/renderer/panel/components/ContactCard.tsx` - Follow-up buttons section; dial-triggers-OneNote; followUpPromptEnabled prop
- `src/renderer/panel/App.tsx` - Pass followUpPromptEnabled={settings.followUpPromptEnabled} to ContactCard
- `src/renderer/settings/components/FeatureToggles.tsx` - New Follow-up Reminders feature entry and prop
- `src/renderer/settings/App.tsx` - Pass followUpPromptEnabled to FeatureToggles

## Decisions Made

- Follow-up presets are 7, 15, 30 days — honored CONTEXT.md as locked decision over REQUIREMENTS.md (which said 3, 15, 30)
- Dial-triggers-OneNote implemented as non-blocking: `.catch(() => {})` pattern ensures dial always works even if OneNote API fails
- Used `requestBody` parameter in googleapis events.insert (not deprecated `resource`) per plan's pitfall guidance

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed openInOneNote return type in env.d.ts**
- **Found during:** Task 1 (wiring IPC and preloads)
- **Issue:** env.d.ts declared `openInOneNote` as returning `Promise<void>` in both ElectronAPI and PopupAPI interfaces, but the actual preload returns `Promise<{ success: boolean; error?: string; pageId?: string }>`. ContactCard already used the typed return value (checking `result.success`), causing an implicit type mismatch.
- **Fix:** Updated env.d.ts to declare the correct typed return for both ElectronAPI and PopupAPI
- **Files modified:** src/renderer/env.d.ts
- **Verification:** `npx tsc --noEmit` passes with no errors
- **Committed in:** 10d6bfb (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Essential correctness fix — pre-existing type mismatch in env.d.ts. No scope creep.

## Issues Encountered

None - TypeScript compiled cleanly after each task. Build succeeded on first attempt.

## User Setup Required

None — existing Google OAuth credentials from Phase 1 auth setup cover the `calendar` scope already added in auth/constants.ts. No new external service configuration required.

## Next Phase Readiness

- Google Calendar follow-up and OneNote auto-open fully wired end-to-end
- Phase 2 complete — all OneNote and Calendar integration delivered
- Ready for Phase 3: distribution (installer, auto-update, code signing)
- EV code-signing certificate procurement should be underway (noted as blocker in STATE.md)

---
*Phase: 02-notes-calendar*
*Completed: 2026-03-02*
