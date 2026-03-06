# Phase 8: Area Guides - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Dedicated Area Guides screen accessible from the title bar. Agent can browse 10-15 Dubai community profiles, view detailed stats with charts, compare up to 3 areas in a table, and share a formatted area summary via WhatsApp. All data must be publicly sourced, referenceable, and display its source + effective date at all times.

</domain>

<decisions>
## Implementation Decisions

### Profile content & depth
- Two-tier layout: quick-scan card in the list, expandable full guide when opened
- Data must show **ranges** (e.g., AED 1,800-2,400/sqft), not single averages
- Charts/graphs included for visual data presentation (price trends, yield)
- Every data point must display its **source reference** and **effective date** — no orphaned numbers anywhere
- Community selection: premium/mid-premium tier matching Downtown Dubai's price range (David sells Downtown at Paragon Properties)
- Public market data CAN be stored locally — it's general information, not client PII
- "Refresh data" button to update all communities at once from source

### Browse & navigation
- Scrollable vertical list layout (not grid cards)
- Each row shows area name + key stats (price/sqft range, yield %)
- Sort toggle: agent can sort by name, price/sqft, or yield
- Search box at top for type-ahead filtering by community name
- Tapping a row opens the full profile (replaces list view, back arrow in title bar — matches Education/Transcriber pattern)

### Comparison experience
- Initiated from inside a profile: agent opens a community, taps "Compare with..." button
- On Compare tap, agent sees suggested similar areas (matched by price tier + property type — apartments with apartments, villas with villas) alongside the full list to pick from
- Table format: rows = metrics, columns = selected communities (up to 3)
- Differences highlighted per row (best/worst values)
- **No sharing comparison data via WhatsApp** unless every number comes from a reputable, verifiable source with live reference

### WhatsApp share
- Formatted area summary with stats + source link
- Format: community name, key stats (price range, yield, freehold status), data effective date, source name + URL
- Agent can verify and review the message before it reaches WhatsApp

### Data integrity (hard requirement)
- EVERY piece of data displayed — on cards, profiles, comparison tables, and WhatsApp shares — must show its source and date
- Data must be from publicly available, referenceable sources (DLD reports, RERA index, published market reports)
- No data without attribution — this is non-negotiable

### Claude's Discretion
- Card stats selection (core metrics, service charges, lifestyle tags — pick what's most useful)
- Expanded profile content depth (amenities, transport, developer info — pick what helps during client conversations)
- Chart types and interactivity (price trends, yield bars — pick what fits the dark theme and panel width)
- Rental vs sales data presentation (separate sections vs combined with labels)
- Data sourcing approach (DLD open data API vs hand-curated from public reports — pick most practical given no-scraping constraint)
- Detail view navigation style (full screen with back recommended — matches existing patterns)
- Visual indicators on list rows (color coding, property type icons — pick what adds value without clutter)
- Comparison difference highlighting style (color accents vs arrows/icons)
- WhatsApp message preview/edit flow (recommend matching existing template preview pattern)
- Community count and selection (10-15 areas in Downtown's price tier — Dubai Marina, Business Bay, DIFC, Palm Jumeirah, Dubai Hills, JBR, City Walk, MBR City, Jumeirah, Creek Harbour as starting candidates)

</decisions>

<specifics>
## Specific Ideas

- "Compare with similar areas" suggestions should match on both price tier AND property type — apartments with apartments, villas with villas
- Data should use ranges not averages — agents need to give clients realistic brackets, not misleading single numbers
- An update/refresh button that re-fetches latest publicly available data for all communities at once
- David sells Downtown — the community list should center on areas clients cross-shop with Downtown (similar price points, competing neighborhoods)
- WhatsApp share preview format: community name, key stats as bullet points, data date, source name + clickable URL

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TitleBar` component (App.tsx): frameless window title bar with back button, nav icons, window controls — Area Guides gets a new nav icon here
- `FlashcardView` pattern: deck selection -> detail view with themed cards, stats, back navigation — similar browse/detail flow
- `NewsFeed` pattern: data loading with loading states, list rendering, external link opening
- Lucide icons used throughout (ChevronLeft, BookOpen, Mic, etc.)
- Dark theme palette: `#0d0d0e` bg, `#161617` cards, `#818cf8` accent, `#ededee` text, `#a1a1aa` secondary text

### Established Patterns
- View-based routing via `view` state in App.tsx (union type, no router)
- Each view: TitleBar with title + onBack, content in `flex-1 p-3 overflow-y-auto min-h-0` div
- Data loaded via `window.electronAPI.*` IPC calls
- Tailwind CSS with inline custom colors (no design token file)
- Static data bundled in shared/ (flashcards pattern: `FLASHCARD_DECKS` in shared/flashcards.ts)

### Integration Points
- Add `'area-guides'` to `View` type union in App.tsx
- Add nav button in TitleBar (between BookOpen/Education and Mic/Transcriber per MEMORY.md)
- New component: `AreaGuidesView.tsx` in panel/components/
- Area data: new file in shared/ (e.g., `shared/area-guides.ts`) for static data, or IPC for fetched data
- WhatsApp share: reuse existing `window.electronAPI.openWhatsApp()` pattern with pre-filled text

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-area-guides*
*Context gathered: 2026-03-06*
