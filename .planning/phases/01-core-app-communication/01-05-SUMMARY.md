---
phase: 01-core-app-communication
plan: 05
subsystem: infra
tags: [electron-builder, nsis, dmg, code-signing, notarization, installer]

requires:
  - phase: 01-01
    provides: package.json with electron-builder dependency
provides:
  - electron-builder config for NSIS per-user installer (Windows) and DMG (macOS)
  - macOS entitlements plist for hardened runtime
  - Notarize afterSign script using notarytool
  - Placeholder app icon
affects: []

tech-stack:
  added: []
  patterns: [electron-builder config.js, afterSign notarization hook, macOS entitlements plist]

key-files:
  created:
    - electron-builder.config.js
    - build/entitlements.mac.plist
    - build/icons/icon.png
    - scripts/notarize.js
  modified: []

key-decisions:
  - "GitHub Releases as publish provider for auto-update (simplest for MVP)"
  - "Notarize script skips gracefully when credentials not set (dev-friendly)"
  - "Placeholder PNG icon — to be replaced with designed icon before distribution"

patterns-established:
  - "Build config in electron-builder.config.js (not package.json build field)"
  - "macOS entitlements in build/entitlements.mac.plist"
  - "afterSign hook pattern for notarization"

requirements-completed: [APP-05]

duration: 2min
completed: 2026-03-02
---

# Phase 01 Plan 05: Build Configuration Summary

**electron-builder config for NSIS per-user Windows installer and macOS DMG with hardened runtime, entitlements, and notarize script**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T00:51:20Z
- **Completed:** 2026-03-02T00:53:20Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Configured NSIS per-user installer (no admin rights, no UAC prompt) for Windows
- Configured DMG with hardened runtime for macOS
- Created macOS entitlements plist with JIT and unsigned-memory permissions for Electron V8
- Created notarize.js afterSign hook using @electron/notarize with notarytool backend

## Task Commits

Each task was committed atomically:

1. **Task 1: electron-builder configuration for Windows NSIS and macOS DMG** - `a76c068` (feat)
2. **Task 2: macOS entitlements and notarize script** - `1a9196c` (feat)

## Files Created/Modified
- `electron-builder.config.js` - Full packaging config: NSIS per-user + DMG + GitHub publish
- `build/entitlements.mac.plist` - macOS hardened runtime entitlements (JIT, unsigned-memory, disable-lib-validation)
- `build/icons/icon.png` - Placeholder 16x16 PNG icon
- `scripts/notarize.js` - afterSign hook using @electron/notarize with notarytool

## Decisions Made
- Used GitHub Releases as the publish provider (simplest for MVP)
- Notarize script fails gracefully when Apple credentials not set

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - code signing certificates must be procured separately (already flagged in STATE.md).

## Next Phase Readiness
- Build configuration complete for both platforms
- Actual signing/notarization requires user-provided certificates
- EV code-signing certificate procurement should start now (1-3 week lead time)

---
*Phase: 01-core-app-communication*
*Completed: 2026-03-02*
