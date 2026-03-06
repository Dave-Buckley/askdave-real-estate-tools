# Phase 8: Area Guides - Research

**Researched:** 2026-03-06
**Domain:** Dubai real estate community data, React data views, comparison UX
**Confidence:** HIGH

## Summary

Phase 8 adds a dedicated Area Guides screen to the Electron app's title bar navigation. The agent browses 10-15 Dubai community profiles (scrollable vertical list), opens full profile details, compares up to 3 communities side-by-side, and shares formatted summaries via WhatsApp. All data must display source attribution and effective dates.

The implementation is **renderer-only** (confirmed in STATE.md) -- no IPC handlers, no main process changes, no data model changes. This follows the exact same pattern as the FlashcardView: static data bundled in `shared/area-guides.ts`, a new `AreaGuidesView.tsx` component in `panel/components/`, and a new entry in the `View` type union in `App.tsx`. The only main-process touch point is the existing `sendWhatsAppMessage` IPC for WhatsApp sharing, which already handles pre-filled text via `wa.me` URLs.

**Primary recommendation:** Bundle curated area data as a typed TypeScript module in `shared/area-guides.ts`, build all UI as pure React components with Tailwind styling (hand-drawn SVG bar charts -- no charting library), and use the existing `sendWhatsAppMessage` IPC for WhatsApp share. No new dependencies required.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Two-tier layout: quick-scan card in the list, expandable full guide when opened
- Data must show **ranges** (e.g., AED 1,800-2,400/sqft), not single averages
- Charts/graphs included for visual data presentation (price trends, yield)
- Every data point must display its **source reference** and **effective date** -- no orphaned numbers anywhere
- Community selection: premium/mid-premium tier matching Downtown Dubai's price range
- Public market data CAN be stored locally -- it's general information, not client PII
- "Refresh data" button to update all communities at once from source
- Scrollable vertical list layout (not grid cards)
- Each row shows area name + key stats (price/sqft range, yield %)
- Sort toggle: agent can sort by name, price/sqft, or yield
- Search box at top for type-ahead filtering by community name
- Tapping a row opens the full profile (replaces list view, back arrow in title bar -- matches Education/Transcriber pattern)
- Comparison initiated from inside a profile: agent opens a community, taps "Compare with..." button
- On Compare tap, agent sees suggested similar areas (matched by price tier + property type) alongside full list to pick from
- Table format for comparison: rows = metrics, columns = selected communities (up to 3)
- Differences highlighted per row (best/worst values)
- No sharing comparison data via WhatsApp unless every number comes from a verifiable source
- WhatsApp share: formatted area summary with stats + source link
- Agent can verify and review the message before it reaches WhatsApp
- EVERY piece of data must show its source and date -- non-negotiable

### Claude's Discretion
- Card stats selection (core metrics, service charges, lifestyle tags)
- Expanded profile content depth (amenities, transport, developer info)
- Chart types and interactivity (price trends, yield bars)
- Rental vs sales data presentation (separate sections vs combined with labels)
- Data sourcing approach (DLD open data API vs hand-curated from public reports)
- Detail view navigation style (full screen with back recommended)
- Visual indicators on list rows (color coding, property type icons)
- Comparison difference highlighting style (color accents vs arrows/icons)
- WhatsApp message preview/edit flow (recommend matching existing template preview pattern)
- Community count and selection (10-15 areas)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AREA-01 | Agent can view Dubai community profiles (10+ areas) from a dedicated screen in the title bar | Static data in `shared/area-guides.ts`, new `AreaGuidesView.tsx`, new nav icon in TitleBar, FlashcardView pattern for list -> detail navigation |
| AREA-02 | Agent can compare two or more communities side-by-side (price/sqft, yield, growth, property types) | Comparison table component within AreaGuidesView, max 3 columns, row-based metrics with highlight logic for best/worst |
| AREA-03 | Each area guide displays a "data effective as of" date and source attribution | Every data field in the TypeScript data model includes `source` and `effectiveDate` properties, rendered inline throughout all views |

</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.0.0 | UI components | Already in project |
| Tailwind CSS | ^4.0.0 | Styling | Already in project, all existing views use inline Tailwind |
| Lucide React | ^0.576.0 | Icons | Already in project, consistent icon set |
| TypeScript | ^5.7.0 | Type safety | Already in project |

### New Dependencies
**None required.** Charts will be hand-drawn SVG within React components (see Architecture Patterns). This avoids Recharts React 19 compatibility issues (reported rendering bugs with React 19.2.3 in Jan 2026) and keeps the bundle small.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-drawn SVG charts | Recharts 3.7 | Recharts has known React 19 rendering bugs; adds ~200KB to bundle; overkill for 2-3 simple bar/horizontal charts |
| Static bundled data | DLD/Dubai Pulse API | API requires registration + API key + auth token management; adds main process complexity; the "refresh" button can be a future enhancement that fetches from a hosted JSON endpoint |
| Static bundled data | Web scraping | Explicitly out of scope per REQUIREMENTS.md ("Data scraping from CRM or property portals -- Security and compliance risk -- hard boundary") |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  shared/
    area-guides.ts          # Static area data (typed, ~500-800 lines)
  renderer/panel/
    components/
      AreaGuidesView.tsx    # Main view (list, detail, comparison)
    App.tsx                  # Add 'area-guides' to View type, add nav button
  renderer/
    env.d.ts                # No changes needed (existing IPC sufficient)
```

### Pattern 1: Static Data Module (like flashcards.ts)
**What:** All area data lives in a single TypeScript file as typed constants
**When to use:** When data is curated, changes infrequently, and doesn't need a backend
**Example:**
```typescript
// Source: Follows existing shared/flashcards.ts pattern
export interface AreaDataPoint {
  value: number | [number, number]  // single value or range [min, max]
  source: string                     // e.g., "DLD Transaction Data"
  sourceUrl: string                  // e.g., "https://dubailand.gov.ae/en/open-data/"
  effectiveDate: string              // e.g., "2025-Q4"
}

export interface CommunityProfile {
  id: string                         // e.g., "downtown-dubai"
  name: string                       // e.g., "Downtown Dubai"
  shortName: string                  // e.g., "Downtown" (for compact display)
  propertyTypes: ('apartment' | 'villa' | 'townhouse')[]
  freeholdStatus: 'freehold' | 'leasehold' | 'mixed'

  // Core metrics (all with source + date)
  pricePerSqft: AreaDataPoint        // AED range [min, max]
  rentalYield: AreaDataPoint          // gross % range
  serviceCharges: AreaDataPoint       // AED/sqft range

  // Additional stats
  avgTransactionPrice: AreaDataPoint  // AED range
  priceGrowthYoY: AreaDataPoint       // % change

  // Lifestyle / qualitative
  metroAccess: boolean
  nearestMetro?: string
  keyDevelopers: string[]
  highlights: string[]                // e.g., "Burj Khalifa views", "Dubai Mall walkable"

  // For comparison matching
  priceTier: 'ultra-premium' | 'premium' | 'mid-premium' | 'mid-market'
}

export const AREA_GUIDES: CommunityProfile[] = [
  // 10-15 communities populated with curated public data
]
```

### Pattern 2: View-Based Navigation (matches Education/Transcriber)
**What:** AreaGuidesView manages its own internal sub-views (list, detail, compare) via local state
**When to use:** Standard pattern for all full-screen views in this app
**Example:**
```typescript
// Source: Matches FlashcardView pattern (deck-select -> studying)
type AreaGuidePhase = 'list' | 'detail' | 'compare'

export default function AreaGuidesView({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<AreaGuidePhase>('list')
  const [selectedArea, setSelectedArea] = useState<CommunityProfile | null>(null)
  const [compareAreas, setCompareAreas] = useState<CommunityProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'yield'>('name')

  // Phase rendering...
}
```

### Pattern 3: Hand-Drawn SVG Bar Charts
**What:** Simple horizontal bar charts using SVG elements styled with Tailwind colors
**When to use:** For price range visualization, yield comparison, service charge bars
**Why:** No external dependency, perfect dark theme integration, full control over sizing in narrow panel
**Example:**
```typescript
// Simple horizontal bar for showing a value within a range
function MetricBar({ value, max, color, label }: {
  value: number; max: number; color: string; label: string
}) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-[#a1a1aa]">{label}</span>
        <span className="text-[#ededee]">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
```

### Pattern 4: WhatsApp Share with Preview (matches TemplatePreview)
**What:** Generate formatted text, show in editable textarea, let agent review before sending
**When to use:** For the WhatsApp share feature from area detail view
**Example:**
```typescript
// Source: Matches existing TemplatePreview.tsx pattern
function buildAreaSummary(area: CommunityProfile): string {
  const lines = [
    `*${area.name} - Area Guide*`,
    '',
    `Price/sqft: AED ${formatRange(area.pricePerSqft.value)}`,
    `Gross Yield: ${formatRange(area.rentalYield.value)}%`,
    `Service Charges: AED ${formatRange(area.serviceCharges.value)}/sqft`,
    `Freehold: ${area.freeholdStatus === 'freehold' ? 'Yes' : 'No'}`,
    `Metro: ${area.metroAccess ? area.nearestMetro || 'Yes' : 'No'}`,
    '',
    `Data effective: ${area.pricePerSqft.effectiveDate}`,
    `Source: ${area.pricePerSqft.source}`,
    area.pricePerSqft.sourceUrl
  ]
  return lines.join('\n')
}

// Use existing IPC: window.electronAPI.sendWhatsAppMessage(e164, message, mode)
// OR for no-recipient share: window.electronAPI.openExternal(`https://wa.me/?text=${encodeURIComponent(message)}`)
```

### Pattern 5: Comparison Table with Highlights
**What:** Metrics as rows, communities as columns, best/worst values highlighted
**When to use:** Compare view (up to 3 communities)
**Example:**
```typescript
// Row highlighting: find best value per metric and apply accent color
function highlightBest(values: (number | [number, number])[]): number {
  // For yield: highest is best. For service charges: lowest is best.
  // Return index of best value
}
// Use green accent (#4ade80) for best, red (#f87171) for worst
```

### Anti-Patterns to Avoid
- **Monolithic component:** AreaGuidesView should NOT be a single 800+ line file. Break into sub-components: AreaList, AreaDetail, AreaCompare, AreaSharePreview, MetricBar
- **Fetching data at runtime in v1:** The "Refresh data" button is a future concern. For v1 of Area Guides, bundle static data. The refresh button can show a "Data is current as of [date]" notice
- **Losing source attribution:** Every component that renders a number must also render its source. Never pass raw numbers without their source metadata
- **Using Recharts or similar:** Adds bundle size and React 19 compatibility risk for what amounts to a few horizontal bars

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WhatsApp messaging | Custom URL builder | Existing `sendWhatsAppMessage` IPC + `openExternal` for no-recipient share | Already handles encoding, desktop/web modes |
| Icon system | Custom SVG icons | Lucide React `MapPin` or `Map` icon | Consistent with title bar nav (Keyboard, BookOpen, Mic) |
| Number formatting | Manual string concat | `Intl.NumberFormat('en-AE')` | Handles AED formatting, commas, decimals correctly |
| Search/filter | Complex search algo | Simple `String.includes()` on community name | Only 10-15 items, no fuzzy search needed |
| Sort | Custom sort algo | `Array.sort()` with comparator | Straightforward numeric/alpha sort on 10-15 items |

**Key insight:** This phase is almost entirely UI -- data structures + React components + Tailwind styling. No backend, no APIs, no complex state management. The flashcards module is the perfect template.

## Common Pitfalls

### Pitfall 1: Orphaned Numbers (No Source Attribution)
**What goes wrong:** Developer renders a number like "AED 2,100/sqft" without showing where it came from
**Why it happens:** Easy to forget source when destructuring data into UI components
**How to avoid:** The data model makes source/date required fields on every metric. Create a `<MetricValue>` component that always renders the value WITH its source
**Warning signs:** Any `area.pricePerSqft.value` rendered without `area.pricePerSqft.source` nearby

### Pitfall 2: Component Bloat
**What goes wrong:** AreaGuidesView.tsx grows to 1000+ lines like ContactCard.tsx (693 lines)
**Why it happens:** List view, detail view, compare view, and share preview all in one file
**How to avoid:** Extract sub-components early: AreaList, AreaDetail, AreaCompare, SharePreview. The main AreaGuidesView only manages phase transitions
**Warning signs:** File exceeds 400 lines; multiple `if (phase === ...)` blocks with 100+ lines each

### Pitfall 3: Comparison State Leaks
**What goes wrong:** Agent opens compare view, goes back, opens a different area -- compare state from previous session persists
**Why it happens:** compareAreas state not cleared on navigation
**How to avoid:** Clear compareAreas when navigating back to list or switching to a different area detail
**Warning signs:** Previous comparison areas appearing when entering compare mode from a new area

### Pitfall 4: WhatsApp Share Without Review
**What goes wrong:** Agent clicks share and message goes directly to WhatsApp without preview
**Why it happens:** Skipping the editable textarea step
**How to avoid:** Always show the formatted message in an editable textarea (matches TemplatePreview pattern). Agent must explicitly click "Send via WhatsApp" after reviewing
**Warning signs:** No textarea visible before WhatsApp action

### Pitfall 5: Panel Width Overflow
**What goes wrong:** Comparison table with 3 columns doesn't fit in the narrow panel
**Why it happens:** App runs in a side panel, not a full-width window
**How to avoid:** Use horizontal scrolling for the comparison table, or stack metrics vertically with community names as headers. Test at 350px width
**Warning signs:** Horizontal overflow, text truncation making data unreadable

### Pitfall 6: Stale Data Not Flagged
**What goes wrong:** Data shows "2024-Q3" effective date but agent doesn't notice it's outdated
**Why it happens:** Date shown in small text, easy to miss
**How to avoid:** Add a visual indicator when data is older than 6 months (yellow warning badge). Show effective date prominently on every card and detail view
**Warning signs:** Effective dates in tiny footer text

## Code Examples

Verified patterns from the existing codebase:

### Adding a New View to App.tsx
```typescript
// Source: App.tsx line 17 -- add 'area-guides' to union type
type View = 'main' | 'template-editor' | 'template-preview' | 'hotkeys'
  | 'role-template-editor' | 'form-editor' | 'education' | 'transcriber'
  | 'area-guides'  // NEW

// Source: App.tsx lines 642-651 -- view rendering pattern
if (view === 'area-guides') {
  return (
    <div className="h-screen bg-[#0d0d0e] flex flex-col overflow-hidden">
      <TitleBar title="Area Guides" onBack={() => setView('main')} />
      <div className="flex-1 p-3 overflow-y-auto min-h-0">
        <AreaGuidesView onBack={() => setView('main')} />
      </div>
    </div>
  )
}
```

### Adding a Nav Button to TitleBar
```typescript
// Source: App.tsx lines 686-706 -- nav button pattern
// Add between BookOpen (Education) and Mic (Transcriber)
<button
  onClick={() => setView('education')}
  className="w-8 h-8 flex items-center justify-center text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.08] transition-colors"
  title="Education"
>
  <BookOpen size={14} strokeWidth={1.5} />
</button>
{/* NEW: Area Guides -- use MapPin or Map icon */}
<button
  onClick={() => setView('area-guides')}
  className="w-8 h-8 flex items-center justify-center text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.08] transition-colors"
  title="Area Guides"
>
  <MapPin size={14} strokeWidth={1.5} />
</button>
<button
  onClick={() => setView('transcriber')}
  ...
```

### List Item Row Pattern (from NewsFeed)
```typescript
// Source: NewsFeed.tsx lines 106-127 -- scrollable list with rows
<button
  key={area.id}
  onClick={() => handleSelectArea(area)}
  className="w-full text-left px-0 py-2.5 border-b border-white/[0.07] last:border-b-0 hover:bg-white/[0.04] transition-colors rounded group"
>
  <p className="text-sm font-medium text-[#ededee] leading-tight">
    {area.name}
  </p>
  <div className="flex items-center gap-2 mt-1">
    <span className="text-[13px] text-[#a1a1aa]">
      AED {formatRange(area.pricePerSqft.value)}/sqft
    </span>
    <span className="text-[13px] text-[#4ade80]">
      {formatRange(area.rentalYield.value)}% yield
    </span>
  </div>
</button>
```

### WhatsApp Share (No Recipient -- Agent Picks in WhatsApp)
```typescript
// Source: actions.ts buildWhatsAppURL pattern, adapted for no-recipient share
// For area guides, the agent shares info WITHOUT a specific contact number
// Use openExternal with wa.me?text= (no phone number)
const handleShareViaWhatsApp = (message: string) => {
  window.electronAPI.openExternal(
    `https://wa.me/?text=${encodeURIComponent(message)}`
  )
}
```

### Dark Theme Color Palette (from existing components)
```typescript
// Source: App.tsx, FlashcardView.tsx, NewsFeed.tsx -- consistent colors
const COLORS = {
  bg: '#0d0d0e',
  card: '#161617',
  cardHover: '#1f1f21',
  accent: '#818cf8',        // indigo -- primary accent
  text: '#ededee',          // primary text
  textSecondary: '#a1a1aa', // secondary text
  textMuted: '#5a5a60',     // muted/hint text
  border: 'rgba(255,255,255,0.07)',
  green: '#4ade80',         // positive values (best yield)
  red: '#f87171',           // negative/worst values
  yellow: '#fbbf24',        // warning/neutral
}
```

## Data Sourcing Strategy

### Recommended Approach: Hand-Curated Static Data
**Confidence:** HIGH

Bundle 10-15 community profiles as a TypeScript constant array in `shared/area-guides.ts`. Data is curated from publicly available, referenceable sources:

| Data Point | Source | URL | Update Frequency |
|-----------|--------|-----|------------------|
| Price/sqft ranges | DLD Transaction Data via DXBInteract | https://dxbinteract.com/dubai-property-prices-per-sqft | Quarterly |
| Rental yield | DLD / Property Monitor reports | https://dubailand.gov.ae/en/open-data/ | Quarterly |
| Service charges | RERA Service Charge Index (Mollak) | https://dubailand.gov.ae/en/eservices/service-charge-index-overview/ | Annual |
| Freehold status | DLD designation (static) | https://dubailand.gov.ae/ | Rarely changes |
| Metro access | RTA data (static) | Public knowledge | Rarely changes |
| Price growth YoY | DLD/Property Monitor reports | https://dxbinteract.com/ | Quarterly |

### Community Selection (10-15 Areas)
Based on CONTEXT.md guidance ("premium/mid-premium tier matching Downtown Dubai's price range"):

| Community | Price Tier | Property Type | Why Included |
|-----------|-----------|---------------|--------------|
| Downtown Dubai | Premium | Apartments | David's primary area (Paragon Properties) |
| Business Bay | Mid-premium | Apartments | Adjacent to Downtown, direct competitor |
| Dubai Marina | Premium | Apartments | Top cross-shopping destination |
| Palm Jumeirah | Ultra-premium | Apartments/Villas | Luxury comparison point |
| DIFC | Premium | Apartments | Financial district, premium clientele |
| Dubai Hills Estate | Mid-premium | Apartments/Villas | Growing family-oriented community |
| JBR (Jumeirah Beach Residence) | Premium | Apartments | Beachfront competitor to Marina |
| City Walk | Premium | Apartments | Urban lifestyle alternative |
| MBR City (Mohammed Bin Rashid City) | Mid-premium | Apartments/Villas | Emerging premium area |
| Dubai Creek Harbour | Mid-premium | Apartments | Rising competitor with waterfront |
| Jumeirah Village Circle (JVC) | Mid-market | Apartments | Affordable comparison point |
| Jumeirah Lake Towers (JLT) | Mid-market | Apartments | Marina-adjacent value option |

### "Refresh Data" Button Strategy
For v1: The refresh button shows a status notice "Data current as of [bundled date]" and opens the DLD/DXBInteract website for manual verification. In a future update, this could fetch from a hosted JSON endpoint (simple static file on GitHub Pages or similar) that the developer updates periodically.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Scraping property portals | Using DLD open data + published reports | Always (scraping was never allowed) | All data must be hand-curated from public sources |
| Single average prices | Price ranges [min, max] | User decision | More accurate for agent conversations |
| Basic text lists | Charts + visual data presentation | User decision | Requires SVG chart components |

**Deprecated/outdated:**
- DLD had older data portals; current access is via Dubai Pulse (dubaipulse.gov.ae) and DXBInteract (dxbinteract.com)
- RERA Service Charge Index moved to Mollak system with online lookup

## Open Questions

1. **"Refresh Data" button scope for v1**
   - What we know: User wants a refresh button. Data is bundled statically.
   - What's unclear: Should v1 actually fetch live data, or just show "data as of [date]" with a link to check manually?
   - Recommendation: v1 shows current data date + link to source. Note in UI: "To update, install the latest app version." Future: hosted JSON endpoint.

2. **Exact data values for each community**
   - What we know: Sources identified, community list agreed
   - What's unclear: Exact price ranges, yield numbers, service charge ranges need to be looked up at implementation time
   - Recommendation: Planner creates a data curation task. Developer looks up current values from DXBInteract and DLD at implementation time, documents sources inline.

3. **Comparison suggestions algorithm**
   - What we know: Should match by price tier + property type
   - What's unclear: Exact matching logic (strict tier match vs. adjacent tiers?)
   - Recommendation: Simple filter -- same `priceTier` AND at least one overlapping `propertyType`. If fewer than 3 matches, expand to adjacent tiers.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `App.tsx`, `FlashcardView.tsx`, `NewsFeed.tsx`, `TemplatePreview.tsx`, `shared/flashcards.ts`, `shared/types.ts` -- all patterns verified by reading source
- Existing IPC: `preload/index.ts`, `main/ipc.ts`, `main/actions.ts` -- WhatsApp share mechanism verified

### Secondary (MEDIUM confidence)
- [DLD Open Data](https://dubailand.gov.ae/en/open-data/) -- Official Dubai Land Department data portal
- [DLD Service Charge Index](https://dubailand.gov.ae/en/eservices/service-charge-index-overview/) -- RERA-approved service charges
- [Dubai Pulse DLD Transactions API](https://www.dubaipulse.gov.ae/data/dld-transactions/dld_transactions-open-api) -- Free API with registration
- [DXBInteract](https://dxbinteract.com/dubai-property-prices-per-sqft) -- Price per sqft by community
- [Recharts React 19 issues](https://github.com/recharts/recharts/issues/6857) -- Rendering bugs reported Jan 2026

### Tertiary (LOW confidence)
- [Sands of Wealth rental yield data](https://sandsofwealth.com/blogs/news/dubai-rental-yields-apartment) -- Community yield figures (needs cross-verification with DLD)
- [Driven Properties service charge guide](https://www.drivenproperties.com/blog/property-service-charges-dubai) -- Service charge ranges by community

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing patterns
- Architecture: HIGH -- directly follows FlashcardView and Education patterns already in codebase
- Data sourcing: MEDIUM -- sources identified but exact values need curation at implementation time
- Pitfalls: HIGH -- derived from analysis of existing codebase patterns and constraints

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (30 days -- stable domain, data model unlikely to change)
