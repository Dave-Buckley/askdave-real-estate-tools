# Technology Stack

**Project:** Real Estate Agent Toolkit v1.2 -- Agent Productivity Features
**Researched:** 2026-03-06
**Confidence:** HIGH

---

## Executive Assessment

**No new npm dependencies are needed for v1.2.** Every capability required by the five new features -- Area Guides, Quick Calculators, Activity Timeline, Voice Memo to OneNote, and Property Quick-Share -- is achievable with the existing stack plus built-in Node.js/browser APIs.

This is a deliberate recommendation, not laziness. The existing stack (Electron 34 + React 19 + TypeScript + Tailwind CSS v4 + electron-store + `@huggingface/transformers` + `ws`) already contains everything needed. Adding dependencies for the sake of it would increase bundle size, maintenance burden, and attack surface -- all for a zero-auth, privacy-first desktop app where simplicity is a core value.

---

## Current Stack (Shipped -- DO NOT change)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Electron | ^34.0.0 | Desktop app shell | Shipped v1.0 |
| electron-vite | ^5.0.0 | Build toolchain | Shipped v1.0 |
| React | ^19.0.0 | UI framework | Shipped v1.0 |
| TypeScript | ^5.7.0 | Type safety | Shipped v1.0 |
| Tailwind CSS | ^4.0.0 | Styling | Shipped v1.0 |
| electron-store | ^9.0.0 | Persistent settings, contacts, overrides | Shipped v1.0 |
| lucide-react | ^0.576.0 | Icon library | Shipped v1.0 |
| @huggingface/transformers | ^3.8.1 | Whisper AI (speech-to-text) | Shipped v1.0 |
| ws | ^8.19.0 | WebSocket server (phone transcriber) | Shipped v1.0 |
| libphonenumber-js | ^1.12.38 | Phone number parsing/validation | Shipped v1.0 |
| zod | ^3.24.2 | Schema validation | Shipped v1.0 |
| rss-parser | ^3.13.0 | News feed parsing | Shipped v1.0 |
| qrcode | ^1.5.4 | QR code generation | Shipped v1.0 |

**Runtime dependencies** (bundled in app.asar): `@huggingface/transformers`, `ws`
**Everything else** is in devDependencies -- bundled by electron-vite at build time.

---

## Feature-by-Feature Stack Analysis

### Feature 1: Area Guides (Static Community Data + Comparison UI)

**What it does:** Dedicated view (accessible from title bar) displaying 10+ Dubai community profiles with side-by-side comparison. Data is static, researched, and embedded in the build.

**Stack requirements:**

| Need | Solution | Already Available? |
|------|----------|-------------------|
| Community data storage | TypeScript data file (`src/shared/area-guides.ts`) | Yes -- same pattern as `flashcards.ts` (1,517 cards in a static TS file) |
| Profile rendering | React components with Tailwind | Yes |
| Comparison UI (side-by-side) | React state to track selected areas + grid layout | Yes |
| Data effective date display | Static string in data file | Yes |
| Disclaimer footer | Static text | Yes |
| Icons for categories | lucide-react (MapPin, DollarSign, TrendingUp, Train, etc.) | Yes |

**Why no new dependencies:**

The area guides data is static -- 10+ community profiles with ~15 fields each (price/sqft, yield, service charges, metro access, lifestyle, pros/cons). This is the exact same pattern as `src/shared/flashcards.ts`, which contains 1,517 cards in a single TypeScript file exported as typed arrays. The data has already been researched and verified in `.planning/research/dubai-area-guides-research.md` (741 lines, 45+ sources).

The comparison feature is React state management: the user selects 2-3 areas, and a grid renders their stats side-by-side. No charting library is needed -- the comparison is a data table, not a chart.

**Data structure:**

```typescript
export interface AreaGuide {
  id: string                    // 'downtown-dubai'
  name: string                  // 'Downtown Dubai'
  tagline: string               // 'The Centre of Now'
  pricePerSqft: [number, number] // [2800, 3500] AED range
  rentalYield: [number, number]  // [4.0, 6.5] gross %
  serviceCharges: [number, number] // [25, 40] AED/sqft/yr
  freehold: boolean
  beachfront: boolean
  completionEra: string
  priceTrend: string             // 'Up ~8-10% YoY'
  shortTermDemand: 'Very High' | 'High' | 'Moderate-High' | 'Moderate' | 'Low-Moderate' | 'Low'
  metroAccess: string
  highlights: string[]           // 5 key bullet points
  lifestyle: string              // paragraph
  investment: string             // paragraph
  transport: string[]            // bullet points
  pros: string[]
  cons: string[]
}

export const AREA_GUIDES: AreaGuide[] = [/* 10+ areas */]
```

**Integration point:** New view in `App.tsx` (same pattern as `education` and `transcriber` views). The current `View` type is `'main' | 'template-editor' | 'template-preview' | 'hotkeys' | 'role-template-editor' | 'form-editor' | 'education' | 'transcriber'` -- add `'area-guides'`. Accessible from a new title bar button (MapPin icon from lucide-react, positioned after BookOpen). The title bar nav order is currently: Keyboard, BookOpen, Mic, Settings, divider, window controls.

---

### Feature 2: Quick Calculators (Mortgage / Commission / ROI)

**What it does:** In-app calculators for three common real estate calculations, each displaying an effective date and source reference for the regulatory figures used.

**Stack requirements:**

| Need | Solution | Already Available? |
|------|----------|-------------------|
| Mortgage EMI formula | Standard amortization: `P * r * (1+r)^n / ((1+r)^n - 1)` | Yes -- pure math, no library needed |
| Commission calculation | Percentage of sale price: `price * commissionRate` with agent split | Yes -- pure math |
| ROI/yield calculation | `(annualRent - expenses) / totalCost * 100` | Yes -- pure math |
| Input components | React controlled inputs with Tailwind | Yes |
| Currency formatting | `Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' })` | Yes -- built into every browser |
| Date references | Static effective dates embedded in calculator config | Yes |

**Why no new dependencies:**

All three calculators are pure arithmetic:

1. **Mortgage:** Standard PMT formula. Inputs: property price (AED), down payment (%), interest rate (%, default ~4.5%), loan term (years, default 25). Output: monthly EMI (AED), total interest, total repayment. The formula is one line: `EMI = P * r * (1+r)^n / ((1+r)^n - 1)`.

2. **Commission:** Input: sale price, commission rate (default 2%), agent share %. Output: total commission, agent share, agency share. All multiplication.

3. **ROI/Yield:** Input: purchase price, annual rent, service charges/sqft, total sqft, vacancy rate (default 5%). Output: gross yield %, net yield %, annual net income. All division.

No charting, no financial modeling library, no external API calls. The built-in `Intl.NumberFormat` handles AED currency formatting natively.

**Regulatory reference data (hardcoded with effective dates):**

```typescript
export const CALC_DEFAULTS = {
  mortgage: {
    downPaymentFirstHome: 20,  // % -- UAE Central Bank regulation
    downPaymentSubsequent: 25, // % -- UAE Central Bank regulation
    maxLoanTermYears: 25,
    typicalRateFixed: 4.5,     // % -- 3-year fixed rate range 3.85-4.10% + margin
    effectiveDate: '2026-03-06',
    source: 'UAE Central Bank Regulations'
  },
  commission: {
    standardRate: 2,           // % -- RERA standard
    vatRate: 5,                // % -- UAE VAT
    effectiveDate: '2026-03-06',
    source: 'RERA Dubai'
  },
  transfer: {
    dldFee: 4,                 // % of sale price
    trusteeFeeUnder500k: 2100, // AED (2000 + 5% VAT)
    trusteeFeeOver500k: 4200,  // AED (4000 + 5% VAT)
    titleDeedFee: 580,         // AED
    mortgageRegistration: 0.25, // % of mortgage amount
    mortgageRegAdmin: 290,     // AED
    effectiveDate: '2026-03-06',
    source: 'Dubai Land Department (DLD)'
  },
  roi: {
    defaultVacancyRate: 5,     // %
    effectiveDate: '2026-03-06',
    source: 'Market average estimates'
  }
} as const
```

**Integration point:** New view in `App.tsx`, add `'calculators'` to `View` type. Accessible from title bar (Calculator icon from lucide-react). The calculators share a single view with tab navigation between Mortgage / Commission / ROI, matching the existing tab pattern in Forms (sales / rentals / offplan tabs in ContactCard).

---

### Feature 3: Activity Timeline (Per-Contact Interaction Logging)

**What it does:** Automatically logs calls, WhatsApp sends, form sends, notes pushes, and other interactions per contact. Displayed as a chronological list in the ContactCard.

**Stack requirements:**

| Need | Solution | Already Available? |
|------|----------|-------------------|
| Per-contact event storage | Add `activityLog?: ActivityEntry[]` to `Contact` type in electron-store | Yes -- electron-store handles nested objects/arrays natively |
| Event recording | New `appendActivity()` function alongside existing `upsertContact()` | Yes -- `contacts.ts` already provides the pattern |
| Timeline rendering | React list with timestamp + action icon + description | Yes |
| Timestamp formatting | `Date.toLocaleString()` or `Intl.DateTimeFormat` | Yes -- built-in |
| Icons per action type | lucide-react (Phone, MessageCircle, FileText, Send, etc.) | Yes |

**Why no new dependencies:**

The activity timeline is an append-only array of `ActivityEntry` objects stored per contact in electron-store. The existing `upsertContact()` function (in `contacts.ts`, 81 lines) already handles partial updates with merge semantics. The new `appendActivity()` function reads the contact, appends to the array, and writes back -- same pattern.

**Key detail from codebase review:** The `Contact` interface (in `src/shared/types.ts`, line 118-128) currently has: `e164`, `displayNumber`, `name`, `email`, `roles`, `notes`, `oneNotePageId`, `createdAt`, `updatedAt`. Adding `activityLog?: ActivityEntry[]` is non-breaking because the `?` optional marker means existing stored contacts (without the field) remain valid. electron-store's `store.get('contacts')` returns the raw JSON object -- no migration needed.

**Data structure:**

```typescript
export type ActivityType =
  | 'call'           // Click-to-dial
  | 'whatsapp'       // WhatsApp opened (with or without message)
  | 'email'          // Email sent via template
  | 'onenote'        // OneNote page opened or created
  | 'notes-pushed'   // General Notes pushed to OneNote
  | 'form-sent'      // Form sent via WhatsApp or email
  | 'follow-up'      // Follow-up reminder created
  | 'booking'        // Calendar booking created
  | 'role-added'     // Role assigned
  | 'voice-memo'     // Voice memo transcribed and pushed to OneNote
  | 'property-shared' // Property URL shared via WhatsApp

export interface ActivityEntry {
  type: ActivityType
  timestamp: string  // ISO 8601
  detail?: string    // e.g., "Form A -- Sales", "Follow-up: 7 days", "bayut.com listing"
}
```

**Performance consideration:** electron-store writes the entire JSON file on every `store.set()` call. For an activity timeline, this means the contacts object grows over time. At the expected scale (50-200 contacts, 10-50 activities each = 1,000-10,000 entries), the JSON file stays under 1-2 MB -- well within electron-store's comfort zone. No database is needed.

If an agent had 500+ contacts with 100+ activities each, the file could reach 5-10 MB and writes might introduce a noticeable pause. Mitigation: cap the timeline to the most recent 100 entries per contact (oldest entries are trimmed on append). This is a future concern, not a v1.2 blocker.

**Integration points:**

1. **Recording events:** Intercept at existing IPC handler callsites in `ipc.ts` (317 lines). The one-way handlers (`ipcMain.on`) at lines 32-87 handle `action:dial`, `action:whatsapp`, `action:whatsapp-with-message`, and `panel:action-done`. The two-way handlers (`ipcMain.handle`) at lines 91+ handle `onenote:open`, `onenote:push-notes`, `calendar:book`, `calendar:follow-up`. Each of these is an instrumentation point for activity logging. The challenge: one-way handlers (`ipcMain.on`) don't have a return value, so the e164 must be passed as a parameter. Currently `action:dial` receives just `e164` (line 32), which is sufficient for logging.

2. **Displaying events:** New collapsible section in ContactCard (after General Notes at line 471, before WhatsApp Templates at line 486). The ContactCard component is already 714 lines with many collapsible sections (templates, forms, KYC, news). The ActivityTimeline should follow the same pattern: `ChevronRight/ChevronDown` toggle, icon, section title, collapsible content.

---

### Feature 4: Voice Memo to OneNote

**What it does:** Record a short voice memo (desktop mic only -- no phone flow needed for post-call notes), transcribe with Whisper, then push the transcript to the contact's OneNote page. This reuses the existing transcription pipeline.

**Stack requirements:**

| Need | Solution | Already Available? |
|------|----------|-------------------|
| Audio recording | `navigator.mediaDevices.getUserMedia()` + `MediaRecorder` | Yes -- already in TranscriberView.tsx desktop flow |
| Audio resampling to 16kHz mono | `OfflineAudioContext` + `getChannelData()` | Yes -- already in TranscriberView.tsx |
| Speech-to-text transcription | `@huggingface/transformers` Whisper worker | Yes -- `whisper-worker.ts` (99 lines), already built and working |
| OneNote push | `pushNotesToOneNote()` in `onenote.ts` | Yes -- shipped in v1.1, handles page creation + append |
| UI (record button, progress, result) | React + Tailwind + lucide-react | Yes |

**Why no new dependencies:**

This feature is a simplified, contact-scoped version of the Meeting Transcriber. The existing `whisper-worker.ts` Web Worker (99 lines) has a clean message protocol: `{type:'load', model}` to initialize, `{type:'transcribe', audio: Float32Array}` to transcribe, `{type:'unload'}` to release. The worker detects WebGPU availability automatically and falls back to WASM -- no configuration needed.

The TranscriberView.tsx (729 lines) desktop flow already implements:
1. Device enumeration via `navigator.mediaDevices.enumerateDevices()`
2. Audio capture via `MediaRecorder` with `getUserMedia()`
3. Audio conversion: `Blob` chunks -> `ArrayBuffer` -> `AudioContext.decodeAudioData()` -> `OfflineAudioContext` resample to 16kHz mono -> `Float32Array`
4. Whisper transcription via the Web Worker
5. Model loading with progress UI

Voice Memo extracts and reuses steps 2-4, then adds a final step: calling `window.electronAPI.pushNotesToOneNote()` (already exposed in `preload/index.ts` at line 61-62, handling page creation + append with stale-pageId recovery).

**Key architectural decision:** Build a new `VoiceMemo.tsx` component, not extend GeneralNotes or TranscriberView. Rationale:

- GeneralNotes (128 lines) is a text-only scratchpad with push. Adding audio recording would double its complexity and conflate two different UX flows (typing vs. speaking).
- TranscriberView (729 lines) is a standalone full-screen view for meetings. Voice memos are inline, contact-scoped, and short.
- VoiceMemo sits inside ContactCard near General Notes but is its own component with its own record/transcribe/push lifecycle.

**Shared code extraction:** The audio recording + resampling + Whisper transcription logic should be extracted into a `useWhisperTranscription()` hook or utility module that both TranscriberView and VoiceMemo can import. This avoids duplicating ~150 lines of audio pipeline code.

---

### Feature 5: Property Quick-Share (Clipboard URL Detection)

**What it does:** When the agent copies a Dubai property listing URL (from Bayut, Property Finder, or Dubizzle), the app detects it and shows a "Share via WhatsApp" action -- the same UX as the existing phone number clipboard detection.

**Stack requirements:**

| Need | Solution | Already Available? |
|------|----------|-------------------|
| Clipboard polling | `clipboard.readText()` in 500ms interval | Yes -- `src/main/clipboard.ts` (131 lines) already does this |
| URL pattern matching | `new URL()` constructor + hostname check | Yes -- built into Node.js |
| WhatsApp share action | `buildWhatsAppURL()` in `actions.ts` | Yes -- already shipped |
| UI popup for detected URL | Same popup mechanism as phone detection | Yes -- `onPhoneDetected` pattern in App.tsx |

**Why no new dependencies:**

The existing clipboard watcher (`src/main/clipboard.ts`, 131 lines) already polls the clipboard every 500ms, extracts phone numbers, and detects email addresses. Property URL detection is adding a third detection type to the same watcher.

**URL detection approach:**

Use Node.js `URL` constructor for robust parsing. Match against a whitelist of Dubai property portal hostnames.

```typescript
const PROPERTY_DOMAINS = new Set([
  'www.bayut.com',
  'bayut.com',
  'www.propertyfinder.ae',
  'propertyfinder.ae',
  'www.dubizzle.com',
  'dubizzle.com',
  'dubai.dubizzle.com',
])

// URL path patterns that indicate a property listing (not search/homepage)
const PROPERTY_PATH_PATTERNS = [
  /^\/property\/details-\d+/,       // bayut.com/property/details-11065329.html
  /^\/en\/plp\/(rent|buy)\//,       // propertyfinder.ae/en/plp/rent/villa-for-rent-...-12345.html
  /^\/property-for-(sale|rent)\//,  // dubizzle.com/property-for-sale/residential/...
  /^\/for-(sale|rent)\/property\//, // bayut.com/for-sale/property/dubai/...
]

export function extractPropertyUrl(text: string): string | null {
  const trimmed = text.trim()
  if (trimmed.length < 15 || trimmed.length > 500 || !trimmed.includes('.')) return null
  if (trimmed.includes('\n')) return null

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    if (PROPERTY_DOMAINS.has(url.hostname)) {
      if (PROPERTY_PATH_PATTERNS.some(p => p.test(url.pathname))) {
        return url.href
      }
    }
  } catch {
    // Not a valid URL
  }
  return null
}
```

**Critical integration detail from codebase review:** The current `startClipboardWatcher()` (line 74-119 of clipboard.ts) has a hard length gate at line 103: `if (trimmed.length > 80) return`. Property listing URLs from Property Finder regularly exceed 80 characters (the slug includes the full property description, location hierarchy, and numeric ID). The URL detection MUST be inserted before this length gate, or the gate must be restructured. Recommended approach:

```typescript
// Current flow (lines 99-118 of clipboard.ts):
const trimmed = text.trim()
if (!trimmed) return

// NEW: Check for property URL FIRST (URLs can be 100-300+ chars)
if (trimmed.length >= 15 && trimmed.length <= 500 && (trimmed.includes('://') || trimmed.startsWith('www.'))) {
  const propertyUrl = extractPropertyUrl(trimmed)
  if (propertyUrl) {
    onPropertyUrlDetected?.(propertyUrl)
    return
  }
}

// Then existing gates
if (trimmed.length > 80) return
// ... existing phone and email detection
```

**Integration into App.tsx:**

Add `window.electronAPI.onPropertyUrlDetected((url) => { ... })` following the exact pattern of `onPhoneDetected` (lines 119-137 of App.tsx) and `onEmailDetected` (lines 153-170). The handler should:
1. Set `view` to `'main'`
2. Store the detected URL in state
3. Show a simplified action bar with portal name + "Share via WhatsApp" button
4. The WhatsApp message: "Check out this property: {url}" (or agent-customizable template)

**Known portal URL patterns (verified via web research):**

| Portal | Listing URL Pattern | Example |
|--------|-------------------|---------|
| Bayut | `bayut.com/property/details-{id}.html` | `bayut.com/property/details-11065329.html` |
| Bayut | `bayut.com/for-sale/property/{city}/{area}/` | `bayut.com/for-sale/property/dubai/downtown-dubai/` |
| Property Finder | `propertyfinder.ae/en/plp/{type}/{slug}-{id}.html` | `propertyfinder.ae/en/plp/rent/villa-for-rent-dubai-...-12997300.html` |
| Dubizzle | `dubizzle.com/property-for-{type}/...` | `dubai.dubizzle.com/property-for-rent/commercial/office/...` |
| Dubizzle | `dubizzle.com/property/details-{id}` | `dubizzle.com/property/details-12008171` |

---

## Alternatives Considered (and Rejected)

| What Was Considered | Why NOT |
|-------------------|---------|
| Chart.js / Recharts for area comparison | Overkill. The comparison is a data table, not a chart. Adding a charting library for static data tables wastes 200+ KB of bundle for zero visual improvement over a well-styled Tailwind table. |
| Financial calculator library (financejs, financial) | Unnecessary. The mortgage PMT formula is a single line of math. Commission and ROI are multiplication and division. Adding a library for three arithmetic expressions is unjustifiable. |
| SQLite / better-sqlite3 for activity timeline | Massive overkill. electron-store handles 1,000-10,000 activity entries without issue. SQLite would add a native binary dependency, complicating the build for both Windows and macOS, require electron-rebuild, and introduce a migration layer -- all for data that fits comfortably in a 1-2 MB JSON file. |
| IndexedDB for activity timeline | Better than SQLite but still unnecessary. The activity data needs to be accessible from the main process (for recording events in IPC handlers), and IndexedDB is renderer-only. electron-store is accessible from both main and renderer via IPC. |
| New state management (Redux, Zustand) | The app manages state with React component state + electron-store successfully across 15+ components. Adding a state library for timeline entries is unnecessary complexity. |
| Separate Whisper integration for voice memos | The existing `whisper-worker.ts` Web Worker already handles the full Whisper pipeline. Building a second integration would be code duplication. Extract shared logic into a hook instead. |
| URL shortener API for property links | Privacy violation. The app's core promise is "no data leaves device." Sending clipboard URLs to a third-party shortener breaks this promise. Share the raw URL. |
| Metadata scraping for property URLs (title, price, image) | Privacy and complexity risk. Fetching metadata from property portals requires HTTP requests from the user's IP, may trigger anti-bot measures (all three portals have 2026 anti-bot defenses), and adds network dependency to a feature that should work instantly. A URL is sufficient -- the agent knows what they copied. |
| Map integration (Leaflet, Google Maps) for area guides | Adds significant bundle size (Leaflet: ~200KB, Google Maps: API key + network dependency). For 10 static Dubai communities, a map adds visual polish but no functional value. The agent needs stats (yield, price, service charges), not a pin on a map. Consider for v2.0 if user feedback demands it. |
| Date picker library (react-datepicker) for calculator date references | The effective dates are static -- set by the developer when regulatory figures are updated. The agent doesn't pick a date. A static string is correct. |

---

## What NOT to Add

| Do NOT Add | Reason |
|-----------|--------|
| Any new npm packages | Everything needed is built into the platform or already installed |
| Charting library | Area comparison is a table, calculators show numbers -- no charts needed |
| Financial math library | Three formulas, each one line of code |
| Database (SQLite, IndexedDB) | electron-store handles expected data volume comfortably |
| State management library | React state + electron-store is proven across 15+ components |
| Map library | Static community data doesn't benefit from interactive maps |
| URL metadata scraper | Privacy violation; unnecessary -- agent knows what they copied |
| Additional ML model | Whisper (already installed) handles both meeting transcription and voice memos |
| HTTP client library (axios, got) | No HTTP calls needed for any v1.2 feature |
| Audio processing library | OfflineAudioContext (built-in) handles 16kHz resampling |

---

## Files to Create

### Area Guides
| File | Purpose | Estimated Size |
|------|---------|---------------|
| `src/shared/area-guides.ts` | Static area guide data (10+ communities, typed) | ~400 lines |
| `src/renderer/panel/components/AreaGuidesView.tsx` | Main area guides view with list + detail | ~300 lines |
| `src/renderer/panel/components/AreaComparison.tsx` | Side-by-side comparison view | ~200 lines |

### Quick Calculators
| File | Purpose | Estimated Size |
|------|---------|---------------|
| `src/shared/calculator-defaults.ts` | Regulatory reference data with effective dates | ~50 lines |
| `src/renderer/panel/components/CalculatorView.tsx` | Calculator view with tabs (Mortgage/Commission/ROI) | ~400 lines |

### Activity Timeline
| File | Purpose | Estimated Size |
|------|---------|---------------|
| `src/renderer/panel/components/ActivityTimeline.tsx` | Timeline UI component for ContactCard | ~150 lines |

### Voice Memo
| File | Purpose | Estimated Size |
|------|---------|---------------|
| `src/renderer/panel/components/VoiceMemo.tsx` | Inline voice recorder + transcribe + push to OneNote | ~250 lines |
| `src/renderer/panel/hooks/useWhisperTranscription.ts` | Shared audio recording + Whisper transcription hook | ~150 lines |

## Files to Modify

### Activity Timeline (Recording Events)
| File | Change | Description |
|------|--------|-------------|
| `src/shared/types.ts` | Add types | `ActivityType`, `ActivityEntry`, add `activityLog?: ActivityEntry[]` to `Contact` interface (line 118) |
| `src/main/contacts.ts` | Add function | `appendActivity(e164, entry)` -- reads contact, appends to activityLog array, writes back |
| `src/main/ipc.ts` | Add event recording | At `action:dial` (line 32), `action:whatsapp` (line 36), `action:whatsapp-with-message` (line 40), `onenote:open` (line 172), `onenote:push-notes` (line 181), `calendar:book` (line 190), `calendar:follow-up` (line 194) -- call `appendActivity()` |
| `src/main/ipc.ts` | Add IPC handler | `contact:get-activity` to fetch timeline for renderer |
| `src/preload/index.ts` | Add method | `getActivityLog(e164)` exposed to renderer |
| `src/renderer/panel/components/ContactCard.tsx` | Add section | Render ActivityTimeline component (after GeneralNotes at line 471, before WhatsApp Templates at line 486) |

### Property Quick-Share
| File | Change | Description |
|------|--------|-------------|
| `src/main/clipboard.ts` | Add URL detection | `extractPropertyUrl()` function + property URL detection BEFORE the 80-char length gate (line 103) |
| `src/main/clipboard.ts` | Extend callback | Add `onPropertyUrlDetected` parameter to `startClipboardWatcher()` (line 74) |
| `src/main/index.ts` | Wire callback | Pass `onPropertyUrlDetected` handler to `startClipboardWatcher()` that sends to renderer |
| `src/preload/index.ts` | Add listener | `onPropertyUrlDetected` event handler |
| `src/renderer/panel/App.tsx` | Add handler | Subscribe to `onPropertyUrlDetected`, show share action bar (following `onPhoneDetected` pattern at line 119) |

### Voice Memo
| File | Change | Description |
|------|--------|-------------|
| `src/renderer/panel/components/ContactCard.tsx` | Add section | Render VoiceMemo component (near General Notes section) |
| `src/renderer/panel/components/TranscriberView.tsx` | Refactor | Extract audio pipeline into `useWhisperTranscription` hook, import hook instead of inline code |
| `src/preload/index.ts` | No change needed | `pushNotesToOneNote` already exposed (line 61-62) |

### Area Guides + Calculators (View Routing)
| File | Change | Description |
|------|--------|-------------|
| `src/renderer/panel/App.tsx` | Add views + nav | Add `'area-guides' \| 'calculators'` to `View` type (line 17), add title bar buttons in TitleBar children (lines 686-714), add view rendering blocks |

---

## Integration Notes

### Area Guides -- Data Architecture

The area guide data comes from `.planning/research/dubai-area-guides-research.md` (741 lines, researched 6 March 2026). The data file should include:

1. **Effective date:** A single `AREA_DATA_DATE = '2026-03-06'` constant displayed as "Data as of 6 March 2026" in the UI.
2. **Source disclaimer:** A static string rendered as a footer: "Market data from public sources. Verify before use in client-facing or contractual contexts."
3. **All 10+ areas** with the full data set from the research document.

The comparison UI should allow selecting 2-3 areas and display them in a responsive grid with the key metrics (price/sqft, yield, service charges, metro, beachfront, trend, short-term demand).

### Quick Calculators -- Regulatory References

Each calculator should display:
- The effective date of the regulatory figures used (e.g., "DLD fees as of March 2026")
- The source (e.g., "Dubai Land Department", "UAE Central Bank", "RERA Dubai")
- A note that figures should be verified for current accuracy

This ensures agents don't present stale regulatory figures to clients. When rates change (e.g., DLD adjusts transfer fees), the developer updates the constants and the effective date -- no user action needed.

### Activity Timeline -- Recording Strategy

Events are recorded at the IPC handler level in `src/main/ipc.ts`, not in the renderer. This is correct because:

1. The main process is the single source of truth for actions (dial, WhatsApp, OneNote).
2. Recording in main process catches all actions regardless of which renderer view is active.
3. The contacts module (`contacts.ts`) already handles all read/write operations safely.

**Important nuance:** The one-way IPC handlers (`ipcMain.on` for `action:dial`, `action:whatsapp`) receive e164 as a parameter. However, the contact may not be saved yet (the agent may not have entered a name). `appendActivity()` should auto-create a minimal contact record if one doesn't exist (e164 + displayNumber only), matching how the existing app lazily creates contacts when roles are added.

The renderer reads the timeline via a new `contact:get-activity` IPC handler. The timeline is read-only in the renderer -- no editing or deleting entries.

### Voice Memo -- Relationship to Meeting Transcriber

| Aspect | Meeting Transcriber | Voice Memo |
|--------|-------------------|------------|
| Location | Standalone view (title bar) | Inline in ContactCard |
| Purpose | Record full meetings | Quick post-call notes |
| Source | Phone mic OR desktop mic | Desktop mic only |
| Output | Transcript (copy to clipboard) | Transcript pushed to OneNote |
| Duration | 10-60+ minutes | 30 seconds to 5 minutes |
| Contact scope | None (standalone) | Tied to active contact |
| Model config | User selects model in settings | Uses same `whisperModel` setting |

The Whisper worker is shared -- both use the same `whisper-worker.ts`. The model is cached by the browser's Cache API after first download, so there is no re-download penalty. The current model setting (`whisperModel` in AppSettings) controls which model is used; voice memos should respect this same setting.

### Property Quick-Share -- URL Detection Priority

The clipboard watcher currently rejects text longer than 80 characters (line 103 of clipboard.ts). Property URLs from Property Finder regularly exceed 80 characters. The URL detection MUST be inserted BEFORE the length rejection gate.

Detection priority order should be:
1. Property URL (text contains `://` or starts with `www.`, length 15-500) -- NEW (checked first because URLs can contain digits that look like phone numbers)
2. Phone number (text <= 25 chars) -- existing
3. Email (text matches email regex) -- existing

This prevents a URL containing digits from being misinterpreted as a phone number, and prevents long URLs from being silently discarded by the 80-char gate.

---

## Installation

```bash
# No new packages to install for v1.2
# Verify existing setup works:
cd "C:/Users/David/AI Projects/GSD Sessions/Real Estate Ecosystem"
npm run dev
```

---

## Sources

### Codebase Analysis (HIGH confidence -- all verified via fresh file reads)
- `src/main/clipboard.ts` (131 lines) -- clipboard watcher with phone/email detection, 500ms polling, 80-char length gate at line 103, suppression mechanism
- `src/main/contacts.ts` (81 lines) -- contact CRUD with `upsertContact()` merge semantics, `getContact()`, `listContacts()`
- `src/main/store.ts` (270 lines) -- electron-store with `AppSettings` type, `contacts: Record<string, Contact>`, default templates
- `src/shared/types.ts` (129 lines) -- `Contact` interface (lines 118-128), `AppSettings`, `TranscriberStatus`, `WhisperModelId`
- `src/shared/flashcards.ts` -- pattern for large static data files in TypeScript (1,517 cards)
- `src/renderer/panel/components/TranscriberView.tsx` (729 lines) -- full audio recording + Whisper pipeline, desktop mic flow, phone flow
- `src/renderer/panel/workers/whisper-worker.ts` (99 lines) -- Whisper ONNX model loading/transcription, WebGPU detection with WASM fallback
- `src/renderer/panel/components/GeneralNotes.tsx` (128 lines) -- OneNote push pattern via `pushNotesToOneNote()`
- `src/main/onenote.ts` (475 lines) -- COM API integration, `pushNotesToOneNote()` with stale-pageId recovery, `runPowerShell()`, `buildNotesAppendScript()`
- `src/renderer/panel/App.tsx` (797 lines) -- view routing (8 views), title bar nav, event subscriptions
- `src/renderer/panel/components/ContactCard.tsx` (714 lines) -- contact actions, collapsible sections, forms, news
- `src/main/ipc.ts` (317 lines) -- all IPC handlers, one-way and two-way
- `src/preload/index.ts` (134 lines) -- all exposed APIs, 40+ methods
- `package.json` -- 2 runtime deps (`@huggingface/transformers`, `ws`), 20 dev deps

### Web Research (MEDIUM confidence)
- [Bayut API docs](https://docs.bayutapi.com/) -- Bayut URL pattern: `/property/details-{id}.html`
- [PropertyFinder scraper docs](https://apify.com/dhrumil/propertyfinder-scraper) -- PropertyFinder URL pattern: `/en/plp/{type}/{slug}-{id}.html`
- [Dubizzle feed documentation](https://dubai.dubizzle.com/feed/doc/) -- Dubizzle URL patterns
- [Best Property Portals in Dubai 2026 (K&S Properties)](https://knsproperty.com/best-property-portals-in-dubai/) -- Portal landscape confirmation
- [electron-store GitHub](https://github.com/sindresorhus/electron-store) -- JSON persistence, dot-notation access, nested object support
- [UAE Central Bank mortgage regulations](https://www.capitalzone.ae/the-2026-uae-mortgage-blueprint-navigating-interest-rates-rental-shifts-and-market-maturity/) -- Base rate, LTV ratios, DBR cap 50%
- [DLD fees guide (Property Finder)](https://www.propertyfinder.ae/blog/dld-fees-dubai/) -- 4% transfer fee, trustee fees, title deed fees
- [RERA commission standard (Engel & Volkers)](https://www.engelvoelkers.com/ae/en/resources/dld-fees) -- 2% standard broker commission
