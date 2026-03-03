# Phase 3: Secondary Features and Website - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

The toolkit becomes feature-complete for v1 and distributable. Three deliverables:
1. **Document checklists** per client by transaction type (ORG-03) — agents tick off received documents during a deal
2. **UAE real estate news feed** from RSS sources (NEWS-01) — passive industry awareness inside the app
3. **Public website polish + download links** (WEB-01) — existing 4-page landing site needs working download buttons and minor tweaks

</domain>

<decisions>
## Implementation Decisions

### Document Checklists
- Transaction types: Claude researches standard UAE real estate transaction document sets and defines the list (tenancy, sale, renewal at minimum — add others like off-plan if standard practice)
- UI placement: Claude's discretion — integrate where it fits best given existing ContactCard and panel layout
- Tick behavior: **Tick + timestamp** — record when each document was received (ISO timestamp), not just boolean
- Customizability: Claude's discretion — pick based on typical UAE agent workflow (fixed list is simpler; editable per-contact adds flexibility)

### News Feed
- Sources: Claude researches and selects the best available UAE real estate RSS feeds (property portals, government, industry)
- UI placement: Claude's discretion — fit into existing app layout (panel tab, tray menu item, or separate view)
- Click behavior: Claude's discretion — consider panel size constraints when deciding between in-app preview vs open-in-browser
- Refresh interval: Claude's discretion — pick a reasonable background refresh interval
- Notifications: Claude's discretion — decide whether unread indicators are worth the complexity

### Website
- Scope: **Polish + download links only** — existing 4 HTML pages (index, overview, how-it-works, setup-guide) are fine
- Download links: Need working buttons pointing to actual installer files (.exe for Windows, .dmg for macOS)
- Hosting (site): Claude's discretion — pick simplest free hosting that works
- Hosting (installers): Claude's discretion — pick simplest approach for hosting installer files
- Custom domain: **Deferred** — set up hosting now, custom domain added later when ready

### Claude's Discretion
- UAE transaction document lists (research standard sets)
- RSS feed source selection
- News feed UI location and interaction pattern
- Checklist UI placement (ContactCard section vs separate panel)
- Checklist customizability (fixed vs editable)
- News refresh interval and notification approach
- Hosting platform selection (site + installers)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — user trusts Claude to research UAE real estate standards and make implementation decisions. Key constraint: existing landing site design (navy/teal theme, DM Serif Display + DM Sans fonts) should be preserved, not redesigned.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ContactCard.tsx`: Role system with color coding — checklist could be an expandable section here
- `Contact` interface (`types.ts`): Has `roles[]`, `notes`, timestamps — extend with checklist data
- `AppSettings`: Feature toggle pattern (`oneNoteEnabled`, `calendarEnabled`) — add `newsEnabled`, `checklistEnabled`
- `landing/`: 4 HTML pages with complete navy/teal design system (CSS custom properties, DM Sans/Serif fonts, responsive)

### Established Patterns
- IPC handler pattern: `ipcMain.handle('namespace:action', ...)` with preload bridge
- Feature toggles: Boolean in AppSettings, exposed in Settings UI, gated in renderer
- electron-store: All persistent state in flat key-value store with typed defaults
- Tailwind CSS: Used in all renderer components (panel, popup, settings)

### Integration Points
- `src/main/ipc.ts`: Add checklist + news IPC handlers
- `src/renderer/panel/`: Add checklist UI to ContactCard or new component, add news view
- `src/shared/types.ts`: Extend Contact/AppSettings with checklist + news types
- `src/main/store.ts`: Add defaults for new settings
- `landing/index.html`: Add/fix download buttons with real URLs

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-secondary-features-and-website*
*Context gathered: 2026-03-03*
