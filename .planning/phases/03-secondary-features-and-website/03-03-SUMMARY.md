---
phase: 03-secondary-features-and-website
plan: 03
subsystem: infra
tags: [electron-builder, github-releases, landing-page, html, deployment]

# Dependency graph
requires:
  - phase: 03-secondary-features-and-website
    provides: Landing page HTML files (landing/index.html, landing/AgentKit-Setup-Guide.html)
provides:
  - electron-builder GitHub Releases publish configuration with OWNER/REPO placeholders
  - Landing page download buttons with version-independent /releases/latest/download/ URLs
  - Consistent artifact filename (AgentKit-Setup.exe) for stable download URLs across versions
  - macOS download button activated (was disabled Coming Soon placeholder)
affects: [first-release, github-pages-deployment, auto-update]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GitHub Releases as download distribution: /releases/latest/download/{artifactName} pattern resolves to newest release automatically"
    - "electron-builder publish.releaseType: 'draft' during development, change to 'release' for production"
    - "NSIS artifactName: 'AgentKit-Setup.${ext}' ensures stable filename across version bumps"

key-files:
  created: []
  modified:
    - electron-builder.config.js
    - landing/index.html

key-decisions:
  - "GitHub Releases as download host: /releases/latest/download/ URLs are version-independent, no URL update needed on each release"
  - "OWNER/REPO left as placeholder in both config and HTML — user fills in before first publish"
  - "macOS dmg button activated (was Coming Soon) — points to AgentKit.dmg which will be valid once Mac build is published"
  - "releaseType: 'draft' chosen for development safety — prevents accidental live release; change to 'release' for production"
  - "artifactName: 'AgentKit-Setup.${ext}' in nsis block ensures consistent installer filename regardless of version number"

patterns-established:
  - "Pattern: GitHub Releases for desktop app distribution — no S3/CDN needed, integrated with electron-updater"

requirements-completed: [WEB-01]

# Metrics
duration: 3min
completed: 2026-03-03
---

# Phase 03 Plan 03: GitHub Releases and Landing Page Download URLs Summary

**electron-builder configured for GitHub Releases publishing and landing page download buttons wired to /releases/latest/download/ URLs with consistent artifact naming**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-03T09:04:32Z
- **Completed:** 2026-03-03T09:07:00Z
- **Tasks:** 1 of 2 executed (Task 2 is checkpoint:human-verify — awaiting user verification)
- **Files modified:** 2

## Accomplishments
- electron-builder publish block set to GitHub provider with OWNER/REPO placeholders and draft release type
- NSIS artifactName set to `AgentKit-Setup.${ext}` for stable, version-independent installer filename
- All 3 landing page download buttons updated from local `../release/` paths to `https://github.com/OWNER/REPO/releases/latest/download/` URLs
- macOS download button activated — no longer grayed-out "Coming Soon" placeholder
- `download` attribute removed from external URL anchor tags (browser handles external downloads natively)
- TODO comments added near download URL blocks for easy OWNER/REPO substitution

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure electron-builder publish and update landing page download URLs** - `083f85b` (feat)

## Files Created/Modified
- `electron-builder.config.js` - Added GitHub Releases publish config block; added NSIS artifactName for stable filenames
- `landing/index.html` - Updated 3 download buttons (Getting Started section + Download section Windows/macOS) from local paths to GitHub Releases URLs

## Decisions Made
- GitHub Releases as download host with `/releases/latest/download/` URL pattern — version-independent, auto-resolves to newest release
- OWNER/REPO left as explicit placeholders with TODO comments so user fills in before first publish
- `releaseType: 'draft'` chosen for safe development workflow — drafts don't go live until manually published
- macOS button activated (was Coming Soon) — pointing to `AgentKit.dmg` which will be valid once Mac build is published to GitHub Releases
- `artifactName: 'AgentKit-Setup.${ext}'` in nsis block ensures the installer filename doesn't change when the version number bumps

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Before the download links work, the user must:

1. **Fill in OWNER/REPO placeholders:**
   - In `electron-builder.config.js`: replace `owner: 'OWNER'` and `repo: 'REPO'` with actual GitHub username and repo name
   - In `landing/index.html`: replace all `OWNER/REPO` in GitHub URLs (search for "OWNER/REPO" — 4 occurrences)

2. **Set GH_TOKEN environment variable** before running publish:
   - GitHub -> Settings -> Developer Settings -> Personal Access Tokens -> Generate new token (repo scope)
   - `export GH_TOKEN=ghp_your_token_here`
   - Then run: `npx electron-builder publish`

3. **Enable GitHub Pages for the website:**
   - Push `landing/` folder contents to a `gh-pages` branch
   - GitHub Repo -> Settings -> Pages -> Source: Deploy from branch (gh-pages, root)
   - Repo must be public for free GitHub Pages

4. **Change `releaseType` from `'draft'` to `'release'`** in `electron-builder.config.js` when ready for production releases

## Next Phase Readiness

- Phase 3 plan 3 of 3 is the final plan in the project
- After user verifies the download button links and config look correct, this plan is fully complete
- The app is ready for first GitHub Release publish once user fills in OWNER/REPO and sets GH_TOKEN

---
*Phase: 03-secondary-features-and-website*
*Completed: 2026-03-03*
