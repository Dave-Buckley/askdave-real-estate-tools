---
phase: 03-secondary-features-and-website
plan: 02
subsystem: news-feed
tags: [rss, news, ipc, renderer, panel]
dependency_graph:
  requires: []
  provides: [NEWS-01]
  affects: [src/main/news.ts, src/main/ipc.ts, src/main/index.ts, src/renderer/panel/App.tsx]
tech_stack:
  added: [rss-parser@3.13.0]
  patterns: [rss-in-main-process, background-timer, ipc-bridge, panel-view-state]
key_files:
  created:
    - src/main/news.ts
    - src/renderer/panel/components/NewsFeed.tsx
  modified:
    - src/shared/types.ts
    - src/main/ipc.ts
    - src/main/index.ts
    - src/main/store.ts
    - src/preload/index.ts
    - src/renderer/panel/App.tsx
    - src/renderer/settings/components/FeatureToggles.tsx
    - src/renderer/settings/App.tsx
decisions:
  - "RSS fetching in main process via rss-parser with try/catch per feed — partial failures do not break feature"
  - "News view replaces panel main view (same pattern as hotkeys view) — no layout overflow risk"
  - "shell:open-external IPC handler added alongside news:get — reusable for any external URL"
  - "newsEnabled default true — feature on by default, can be toggled off in settings"
metrics:
  duration: 4 min
  completed_date: "2026-03-03"
  tasks_completed: 2
  files_modified: 10
---

# Phase 3 Plan 2: UAE Real Estate News Feed Summary

**One-liner:** RSS news feed aggregated from 3 UAE real estate sources, fetched in main process via rss-parser with 30-minute background refresh, displayed in a dedicated panel view.

## What Was Built

A full news feed feature for the Agent Kit panel:

- **`src/main/news.ts`** — RSS fetch module using rss-parser with 3 UAE feeds (PropertyNews.ae, Arabian Business, Zawya). Each feed wrapped in try/catch for partial failure tolerance. Items sorted by pubDate descending, cached in memory.
- **`src/main/ipc.ts`** — `news:get` handler returns cached items if fresh (<30 min), otherwise fetches fresh. Also added `shell:open-external` handler for opening URLs in system browser.
- **`src/main/index.ts`** — Background refresh timer: initial fetch on startup + setInterval every 30 minutes, gated by `store.get('newsEnabled')`.
- **`src/main/store.ts`** — Added `newsEnabled: true` to defaults.
- **`src/shared/types.ts`** — Added `NewsItem` interface and `newsEnabled: boolean` to `AppSettings`.
- **`src/preload/index.ts`** — Exposed `getNews()` and `openExternal(url)` to renderer.
- **`src/renderer/panel/components/NewsFeed.tsx`** — Scrollable article list: title (2-line clamp), source badge with color coding, relative date ("2h ago" / "Mar 3"). Back button navigates to main view.
- **`src/renderer/panel/App.tsx`** — Extended View type to include `'news'`, added news view render block, added newspaper icon button to header (gated by `settings?.newsEnabled`).
- **`src/renderer/settings/components/FeatureToggles.tsx`** + **`settings/App.tsx`** — Added `newsEnabled` prop and toggle row.

## Verification Results

1. TypeScript: `npx tsc --noEmit` — zero errors
2. Build: `npm run build` — succeeded, all chunks generated
3. rss-parser in package.json: `^3.13.0`
4. `news.ts` exports: `fetchNews`, `getCachedNews`, `getLastFetched`
5. IPC handler `news:get` registered in ipc.ts
6. NewsFeed component imported and rendered in App.tsx when `view === 'news'`
7. News button visible in panel header when `newsEnabled` is true
8. Settings toggle for `newsEnabled` exists in FeatureToggles

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Additional Work

**[Rule 2 - Missing handler] Added `shell:open-external` IPC handler**
- The plan mentioned adding it as an alternative to existing preload methods
- Checked preload — `openExternal` did not exist yet
- Added both the IPC handler in `ipc.ts` and the preload binding in `preload/index.ts`
- This is a critical dependency for NewsFeed articles to open in the browser

**Added `newsEnabled` prop wiring in `settings/App.tsx`**
- Plan covered FeatureToggles component but the parent App.tsx also needed `newsEnabled` passed as a prop
- Added `newsEnabled={settings.newsEnabled}` to the FeatureToggles usage

## Commits

| Hash | Message |
|------|---------|
| `07f3034` | feat(03-02): install rss-parser and wire news fetch module |
| `2880f56` | feat(03-02): build NewsFeed panel view and wire into App.tsx navigation |

## Self-Check: PASSED

All created files verified on disk. Both task commits confirmed in git log. NewsFeed.tsx is 143 lines (min_lines requirement: 40). TypeScript compiles clean. Build succeeds.
