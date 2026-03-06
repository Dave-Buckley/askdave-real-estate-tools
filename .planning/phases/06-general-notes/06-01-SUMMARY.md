---
phase: 06-general-notes
plan: 01
subsystem: api
tags: [onenote, com-api, powershell, electron-ipc, preload-bridge]

# Dependency graph
requires:
  - phase: 04-onenote
    provides: "COM API integration, runPowerShell(), psEscape(), buildAppendScript() patterns"
provides:
  - "pushNotesToOneNote() exported function for renderer to push freeform notes"
  - "onenote:push-notes IPC channel with create-or-append flow"
  - "buildNotesAppendScript() for timestamped note append to OneNote pages"
  - "Single-outline template rendering (no separate bordered boxes)"
affects: [06-02-general-notes-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: ["CDATA injection prevention via ]]> splitting", "stale pageId recovery with automatic fallback to page creation"]

key-files:
  created: []
  modified:
    - src/main/onenote.ts
    - src/main/ipc.ts
    - src/preload/index.ts
    - src/renderer/env.d.ts

key-decisions:
  - "Merged all OneNote template sections into single Outline block to eliminate separate bordered boxes"
  - "Multiline notes split into separate OE elements for reliable OneNote rendering"
  - "Stale pageId cleared and falls back to create-page flow automatically"

patterns-established:
  - "Notes append pattern: separator line + timestamp + multiline OE elements in single Outline"
  - "Create-or-append flow: check stored pageId, append if exists, create + append if not"

requirements-completed: [NOTE-06, NOTE-08]

# Metrics
duration: 3min
completed: 2026-03-06
---

# Phase 6 Plan 1: OneNote Push-Notes Backend Summary

**OneNote push-notes backend with timestamped freeform note append, CDATA injection prevention, stale pageId recovery, and single-outline template rendering**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-06T16:19:15Z
- **Completed:** 2026-03-06T16:22:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Fixed OneNote template rendering so all content (contact info + qualifying questions + rapport + documents) appears as a single continuous block instead of separate bordered boxes
- Built `buildNotesAppendScript()` that generates PowerShell to append timestamped notes with horizontal rule separator and multiline support
- Built `pushNotesToOneNote()` with full create-or-append flow, stale pageId recovery, and COM API error handling
- Wired `onenote:push-notes` IPC channel through handler, preload bridge, and TypeScript declarations

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix template outline boxing in onenote.ts** - `781576e` (feat)
2. **Task 2: Add buildNotesAppendScript and pushNotesToOneNote to onenote.ts** - `e5fbb15` (feat)
3. **Task 3: Wire IPC handler and preload bridge for push-notes channel** - `b65fd90` (feat)

## Files Created/Modified
- `src/main/onenote.ts` - Added buildNotesAppendScript() and pushNotesToOneNote() functions; fixed buildRolePsOutlines(), buildOneNoteScript(), buildAppendScript() to use single-outline rendering
- `src/main/ipc.ts` - Added onenote:push-notes IPC handler, updated import to include pushNotesToOneNote
- `src/preload/index.ts` - Added pushNotesToOneNote preload bridge method
- `src/renderer/env.d.ts` - Added pushNotesToOneNote TypeScript declaration to ElectronAPI interface

## Decisions Made
- Merged all OneNote template sections (qualifying questions, rapport notes, document checklist) into a single `<one:Outline>` block with spacer OE elements between sections. This eliminates the separate bordered/draggable content boxes that OneNote creates for each `<one:Outline>`.
- Split multiline notes into separate `<one:OE>` elements rather than embedding newlines in a single CDATA block, following the existing `buildRolePsOutlines()` pattern for reliable rendering.
- Stale pageId (0x80042014 error) is automatically detected, the stored pageId is cleared, and the function falls back to the create-page flow rather than failing.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `onenote:push-notes` IPC channel is fully wired and ready for the GeneralNotes.tsx component (Plan 02)
- Renderer can call `window.electronAPI.pushNotesToOneNote(data)` and receive `{ success, error?, pageId?, created? }`
- Both "page exists" and "no page" flows are implemented and tested via TypeScript compilation

---
*Phase: 06-general-notes*
*Completed: 2026-03-06*
