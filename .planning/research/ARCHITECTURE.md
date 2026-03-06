# Architecture Patterns -- v1.2 Feature Integration

**Domain:** 5 new features in existing Electron desktop app (Real Estate Agent Toolkit)
**Researched:** 2026-03-06
**Confidence:** HIGH (all integration points verified against source code)

## Current Architecture Summary

The app uses Electron's three-process model with a single-window design (frameless panel + settings window). All state management is in React useState at the App.tsx level, with no external state library. Views are toggled via a `View` union type.

```
Main Process (Node.js)
  |-- index.ts          (app lifecycle, clipboard watcher, hotkeys, Phone Link)
  |-- ipc.ts            (all IPC handler registrations)
  |-- clipboard.ts      (polling watcher: phone + email detection)
  |-- selection.ts      (Ctrl+C simulation, multi-field contact extraction)
  |-- onenote.ts        (COM API via PowerShell scripts)
  |-- contacts.ts       (CRUD on electron-store contacts map)
  |-- store.ts          (electron-store with typed AppSettings)
  |-- actions.ts        (dial, WhatsApp URL building)
  |-- transcriber-server.ts (HTTP + WebSocket server for phone mic)

Preload (index.ts)
  |-- contextBridge     (exposes window.electronAPI)

Renderer (React, single window)
  |-- App.tsx            (view router via View union type, all contact state)
  |-- ContactCard.tsx    (714 LOC, 10 accordion sections)
  |-- FlashcardView.tsx  (573 LOC, deck select -> study phases)
  |-- TranscriberView.tsx (736 LOC, source select -> record -> transcribe)
  |-- GeneralNotes.tsx   (128 LOC, textarea + push to OneNote)
  |-- workers/whisper-worker.ts (Whisper ONNX model, Web Worker)
```

### View Switching Pattern

App.tsx uses a `View` union type to render different screens:

```typescript
type View = 'main' | 'template-editor' | 'template-preview' | 'hotkeys' |
            'role-template-editor' | 'form-editor' | 'education' | 'transcriber'
```

Title bar icons switch views: `Keyboard` -> hotkeys, `BookOpen` -> education, `Mic` -> transcriber, `Settings2` -> opens settings window. Each view gets a TitleBar with `onBack={() => setView('main')}`.

### Clipboard Detection Pattern

`clipboard.ts` polls every 500ms, extracts phone/email from short text (<80 chars), calls `onPhoneDetected` or `onEmailDetected` callbacks. Main process (`index.ts`) relays to renderer via `panelWindow.webContents.send()`. Suppression system prevents re-triggering after actions.

### Static Data Pattern

Large static datasets follow the flashcards pattern: data lives in `src/shared/` as typed arrays/objects, imported directly by renderer components. No IPC or main process involvement for read-only data.

```typescript
// shared/flashcards.ts - 1,517 cards in 10 decks
export const FLASHCARD_DECKS: FlashcardDeck[] = [...]

// FlashcardView.tsx imports directly
import { FLASHCARD_DECKS } from '../../../shared/flashcards'
```

### IPC Pattern

All IPC follows: `renderer -> window.electronAPI.method() -> contextBridge -> ipcMain.handle('namespace:action') -> main process function -> returns result`. One-way sends use `ipcMain.on`, two-way uses `ipcMain.handle`.

---

## Feature 1: Area Guides

### Integration Points

**View switching:** Add `'area-guides'` to the `View` union type. Add a new icon button (lucide `MapPin`) in the TitleBar, positioned between `BookOpen` (education) and `Mic` (transcriber).

**Static data:** Follow the flashcards pattern exactly. Create `src/shared/area-guides.ts` with typed area data. The renderer imports it directly -- no IPC needed for read-only reference data.

**No main process changes.** Area guides are purely renderer-side: static data + display component.

### New Components

| Component | LOC Est. | Purpose |
|-----------|----------|---------|
| `AreaGuidesView.tsx` | 400-500 | Main view: community list + detail panel + comparison mode |

### Data Structure

```typescript
// src/shared/area-guides.ts
export interface AreaGuide {
  id: string                    // e.g. 'downtown', 'marina'
  name: string                  // "Downtown Dubai"
  shortName: string             // "Downtown"
  tagline: string               // One-liner for cards
  overview: string              // 2-3 paragraph description
  priceRange: {
    studio: { rent: string; sale: string }
    oneBed: { rent: string; sale: string }
    twoBed: { rent: string; sale: string }
    threeBed: { rent: string; sale: string }
    villa?: { rent: string; sale: string }
  }
  yieldRange: string            // "5.5-7.2%"
  serviceCharges: string        // "AED 18-25/sqft"
  highlights: string[]          // ["Burj Khalifa views", "Dubai Mall walkable"]
  bestFor: string[]             // ["Investors", "End-users", "Families"]
  nearbyAmenities: string[]     // ["Metro", "Schools", "Hospitals"]
  developerMix: string[]        // ["Emaar", "DAMAC"]
  investmentOutlook: string     // Short paragraph
  lifestyleProfile: string      // Short paragraph
  pros: string[]
  cons: string[]
  effectiveDate: string         // "March 2026" -- when data was compiled
  dataSource: string            // Attribution
}

export const AREA_GUIDES: AreaGuide[] = [
  // 10 communities: Downtown, Marina, Palm Jumeirah, Business Bay,
  // Dubai Hills, JBR, Creek Harbour, JVC, MBR City, Dubai South
]
```

**Data source:** The 40,000-word `dubai-area-guides-research.md` already exists in `.planning/research/`. This research has been verified against DLD, Bayut, Property Finder, Knight Frank, and GuestReady sources.

### UI Architecture

AreaGuidesView.tsx should have three internal phases (following FlashcardView's `StudyPhase` pattern):

```
Phase 1: Community Grid
  - Card grid showing all 10 communities with name, tagline, yield range
  - Click card -> Phase 2 (detail)
  - "Compare" button to enter comparison mode (select 2-3 communities)

Phase 2a: Community Detail
  - Full profile view with all fields
  - Back button returns to grid

Phase 2b: Comparison Mode
  - Side-by-side table for 2-3 selected communities
  - Compare price ranges, yields, highlights
```

### Data Staleness Strategy

Area guide data includes `effectiveDate` and `dataSource` fields displayed at the bottom of each profile. This makes the compilation date transparent to the user rather than hiding it. Data updates require a code change and app update -- acceptable for a tool that already ships via auto-updater.

### Modified Files

| File | Change Type | What Changes |
|------|-------------|--------------|
| `src/shared/area-guides.ts` | NEW | Static area guide data (typed array) |
| `src/renderer/panel/components/AreaGuidesView.tsx` | NEW | Full view component |
| `src/renderer/panel/App.tsx` | MODIFY | Add `'area-guides'` to View type, add icon button in TitleBar, add view render block |

### No Changes Needed

- No main process changes (pure renderer feature)
- No IPC changes (static data imported directly)
- No preload changes
- No electron-store changes (no user-editable state)

---

## Feature 2: Quick Calculators

### Integration Decision: New View, Not In ContactCard

Calculators should be a **separate view** (like Education, Transcriber) accessible from the title bar, not embedded in ContactCard. Rationale:

1. ContactCard is already 714 lines -- adding calculator UI would push it past 800+ lines
2. Calculators are useful even without a contact loaded (e.g. researching before a call)
3. The title bar has room for one more icon between the Area Guides icon and Mic
4. Calculators are reference tools, not contact-specific actions

**Title bar icon:** lucide `Calculator`, positioned after Area Guides and before Mic.

### New Components

| Component | LOC Est. | Purpose |
|-----------|----------|---------|
| `CalculatorsView.tsx` | 350-450 | Calculator selection + individual calculator UIs |

### Calculator Types

```
1. Mortgage Calculator
   Inputs: property price, down payment %, interest rate, term (years)
   Outputs: monthly payment, total interest, total cost
   Default rate: display with "Effective: March 2026" label

2. Commission Split Calculator
   Inputs: sale/lease price, commission %, agent split %, VAT toggle
   Outputs: gross commission, agent share, VAT amount, net to agent

3. ROI/Yield Calculator
   Inputs: purchase price, annual rent, service charges, maintenance
   Outputs: gross yield %, net yield %, break-even years
```

### Rate Reference Strategy

Rates change. The calculators should NOT hardcode rates as defaults. Instead:

- All rate fields are empty inputs -- the agent types the current rate
- Below each rate input, show a small hint: "UAE avg: ~4.5% (Mar 2026)" as guidance
- These hints live in the component as constants with an `effectiveDate` label
- The hint is informational, not pre-filled -- prevents agents from accidentally using stale rates

### Integration Points

| File | Change Type | What Changes |
|------|-------------|--------------|
| `src/renderer/panel/components/CalculatorsView.tsx` | NEW | All calculator UIs |
| `src/renderer/panel/App.tsx` | MODIFY | Add `'calculators'` to View type, add Calculator icon in TitleBar, add view render block |

### No Changes Needed

- No main process, IPC, preload, or store changes
- Pure renderer feature with no persistence needs
- Results are read-and-forget (agent calculates, shares verbally with client)

---

## Feature 3: Activity Timeline

### This Is The Most Architecturally Complex Feature

Activity Timeline requires hooking into existing action flows to auto-log interactions. It touches the main process, IPC, store, preload, and renderer.

### Data Structure

```typescript
// src/shared/types.ts -- new types
export interface ActivityEntry {
  id: string              // `act-${Date.now()}`
  timestamp: string       // ISO string
  type: ActivityType
  summary: string         // Human-readable: "Called +971 50 123 4567"
  metadata?: Record<string, string>  // Optional extra data
}

export type ActivityType =
  | 'dial'
  | 'whatsapp'
  | 'whatsapp-template'
  | 'email'
  | 'onenote-open'
  | 'onenote-push-notes'
  | 'calendar-booking'
  | 'follow-up'
  | 'form-send'
  | 'voice-memo'        // for Feature 4 when it ships
```

### Storage: Per-Contact in electron-store

Extend the `Contact` type to include an activity log:

```typescript
export interface Contact {
  // ... existing fields ...
  activity?: ActivityEntry[]  // Newest first, capped at ~200 entries
}
```

Store in `contacts[e164].activity` via existing `upsertContact()` pattern. Cap at 200 entries per contact to prevent unbounded growth.

### Logging Strategy: Main Process Interceptors

The cleanest approach is to log in the **main process IPC handlers** where actions are already centralized. This avoids modifying every renderer component that triggers an action.

Create a new module `src/main/activity.ts`:

```typescript
// src/main/activity.ts
import { store } from './store'
import type { ActivityType, ActivityEntry } from '../shared/types'

export function logActivity(
  e164: string,
  type: ActivityType,
  summary: string,
  metadata?: Record<string, string>
): void {
  if (!e164) return
  const contacts = store.get('contacts')
  const contact = contacts[e164]
  if (!contact) return

  const entry: ActivityEntry = {
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type,
    summary,
    metadata
  }

  const activity = contact.activity ?? []
  activity.unshift(entry)
  if (activity.length > 200) activity.length = 200

  contacts[e164] = { ...contact, activity, updatedAt: new Date().toISOString() }
  store.set('contacts', contacts)
}
```

### Where to Insert Logging Calls

Add `logActivity()` calls to existing IPC handlers in `ipc.ts`:

| IPC Channel | Activity Type | Summary |
|-------------|---------------|---------|
| `action:dial` | `'dial'` | "Called {displayNumber}" |
| `action:whatsapp` | `'whatsapp'` | "Opened WhatsApp chat" |
| `action:whatsapp-with-message` | `'whatsapp-template'` | "Sent WhatsApp template" |
| `onenote:open` | `'onenote-open'` | "Opened OneNote page" |
| `onenote:push-notes` | `'onenote-push-notes'` | "Pushed notes to OneNote" |
| `calendar:book` | `'calendar-booking'` | "Booked {type}" |
| `calendar:follow-up` | `'follow-up'` | "Set {days}-day follow-up" |

**Problem:** The one-way `ipcMain.on` handlers for `action:dial` and `action:whatsapp` don't receive display-friendly data. The renderer sends only `e164`.

**Solution:** The logger only needs `e164` to find the contact in store. The `summary` can be constructed from stored contact data:

```typescript
ipcMain.on('action:dial', (_event, e164: string) => {
  openDialler(e164)
  const contact = store.get('contacts')[e164]
  logActivity(e164, 'dial', `Called ${contact?.name || e164}`)
})
```

### Display: New Accordion Section in ContactCard

Add an "Activity" accordion section to ContactCard, positioned **after KYC and before News** (bottom of the card, since it's a log rather than an action):

```
ContactCard sections (updated):
  1. Phone number
  2. Name/Email/Unit inputs
  3. Action buttons (Dial, WhatsApp, Notes, Gmail)
  4. General Notes
  5. Schedule (Viewing, Consultation)
  6. Follow-up reminder
  7. WhatsApp Templates
  8. Gmail Templates
  9. OneNote Templates
  10. Forms
  11. KYC Forms
  -- NEW: Activity Timeline --
  12. News feed
```

**Do NOT grow ContactCard further.** Extract the Activity section as a separate component:

```typescript
// src/renderer/panel/components/ActivityTimeline.tsx
interface ActivityTimelineProps {
  activity: ActivityEntry[]
}
```

This follows the GeneralNotes.tsx extraction pattern.

### IPC for Reading Activity

Add a new IPC channel to read activity for a contact:

```typescript
// preload/index.ts
getContactActivity: (e164: string) =>
  ipcRenderer.invoke('contacts:get-activity', e164) as Promise<ActivityEntry[]>

// ipc.ts
ipcMain.handle('contacts:get-activity', (_event, e164: string) => {
  const contact = store.get('contacts')[e164]
  return contact?.activity ?? []
})
```

### Modified Files

| File | Change Type | What Changes |
|------|-------------|--------------|
| `src/shared/types.ts` | MODIFY | Add `ActivityEntry`, `ActivityType` types, add `activity?` to `Contact` |
| `src/main/activity.ts` | NEW | `logActivity()` function |
| `src/main/ipc.ts` | MODIFY | Add logging calls to 7 existing handlers, add `contacts:get-activity` handler |
| `src/preload/index.ts` | MODIFY | Expose `getContactActivity()` |
| `src/renderer/panel/components/ActivityTimeline.tsx` | NEW | Timeline display component |
| `src/renderer/panel/components/ContactCard.tsx` | MODIFY | Import and render ActivityTimeline in accordion |

---

## Feature 4: Voice Memo to OneNote

### Reuse Pattern from TranscriberView

The existing TranscriberView has all the building blocks:
- Desktop mic recording: `navigator.mediaDevices.getUserMedia()` + `MediaRecorder`
- Audio conversion: `AudioContext` + `OfflineAudioContext` -> 16kHz mono Float32Array
- Whisper transcription: Web Worker with `@huggingface/transformers`
- Copy to clipboard functionality

Voice Memo differs from Meeting Transcriber in workflow:
- **Meeting Transcriber:** Long recording (10-60 min), source selection (phone/desktop), no contact context, copy result
- **Voice Memo:** Short recording (30s-5 min), always desktop mic, contact context, push result to OneNote

### Where In The UI: Inside GeneralNotes, NOT A Separate View

Voice Memo is a **contact-specific action** -- it records a note about the current contact and pushes it to their OneNote page. It belongs as an alternative input method within the General Notes section:

```
General Notes section (updated):
  [Text tab] [Voice tab]

  Text tab: existing textarea + push button (unchanged)
  Voice tab: Record button -> Stop -> Transcribe -> Review -> Push to OneNote
```

This avoids creating a new accordion section. The voice memo is just another way to write notes.

### Simplified Flow

```
1. User clicks "Voice" tab in General Notes section
2. Big "Record" button appears
3. User clicks Record -> MediaRecorder starts (default mic, no device picker)
4. Timer counts up. Stop button visible.
5. User clicks Stop -> audio converted to Float32Array
6. Whisper Worker loaded, transcribes audio
7. Transcript appears in the textarea (same textarea as text mode)
8. User can edit the transcript, then click "Push to OneNote" (same button)
```

Key insight: the transcript lands in the same textarea and uses the same push mechanism as typed notes. Voice Memo is essentially an audio-to-text input method for the existing General Notes flow.

### Whisper Worker: Do NOT Share with TranscriberView

VoiceMemo creates its own worker on demand, loads the model when recording starts, unloads when done. The model load takes 3-8 seconds (cached after first download). Since voice memos and meeting transcription are unlikely to happen simultaneously, the memory duplication risk is minimal. Sharing the worker would add complex state management for negligible benefit.

### Audio Conversion: Inline, Not Extracted

The audio conversion code (Blob to Float32Array) is ~30 lines. Rather than extracting a shared utility that requires refactoring TranscriberView, duplicate it in VoiceMemo.tsx. The duplication is trivially maintainable and avoids risking regressions in the working TranscriberView.

### New Components

| Component | LOC Est. | Purpose |
|-----------|----------|---------|
| `VoiceMemo.tsx` | 200-250 | Recording + transcription UI, wires transcript to parent |

### Modified Files

| File | Change Type | What Changes |
|------|-------------|--------------|
| `src/renderer/panel/components/VoiceMemo.tsx` | NEW | Recording + transcription UI |
| `src/renderer/panel/components/GeneralNotes.tsx` | MODIFY | Add text/voice tab toggle, render VoiceMemo in voice tab, accept transcript into textarea |

### No Changes Needed

- No main process changes (recording in renderer, push uses existing `onenote:push-notes` IPC)
- No new IPC channels (reuses `pushNotesToOneNote`)
- No preload changes
- No store schema changes (uses existing whisperModel setting)

---

## Feature 5: Property Quick-Share

### Extend Existing Clipboard Detection

This feature hooks directly into `clipboard.ts`, the same system that detects phone numbers and email addresses.

### URL Detection Logic

```typescript
// In clipboard.ts -- new detection
const PROPERTY_URL_PATTERNS = [
  // Major Dubai listing portals
  /propertyfinder\.ae/i,
  /bayut\.com/i,
  /dubizzle\.com/i,
  /houza\.com/i,
  // Developer sites
  /emaar\.com/i,
  /damacproperties\.com/i,
  /sobharealty\.com/i,
  /nakheel\.com/i,
  /meraas\.com/i,
  /aldar\.com/i,
]

export function detectPropertyUrl(text: string): string | null {
  const trimmed = text.trim()
  if (trimmed.length > 500) return null
  if (!trimmed.startsWith('http')) return null
  try {
    new URL(trimmed) // validate it's a real URL
    for (const pattern of PROPERTY_URL_PATTERNS) {
      if (pattern.test(trimmed)) return trimmed
    }
  } catch {
    return null
  }
  return null
}
```

### Detection Priority Order

Update the clipboard watcher's detection chain:

```
1. Phone detection (text <= 25 chars) -- existing, highest priority
2. Email detection (text <= 80 chars) -- existing
3. URL detection (text <= 500 chars, starts with http) -- NEW, lowest priority
```

Phone takes priority because copying a phone number is the most common workflow.

### Panel Behavior: Same UX as Phone Detection

When a property URL is detected:
1. Main process emits `'url:detected'` to renderer (new IPC event)
2. App.tsx receives event, stores URL in new state
3. Panel shows near cursor (same as phone detection via `showPanelNearCursor()`)
4. If a contact is loaded: show "Share via WhatsApp" button with the URL pre-filled
5. If no contact loaded: show the URL with a "Copy" button and prompt to load a contact

### WhatsApp Message Format

```typescript
function buildPropertyShareMessage(url: string, contactName?: string): string {
  const greeting = contactName ? `Hi ${contactName}, ` : 'Hi, '
  return `${greeting}I found this property that might interest you:\n\n${url}\n\nLet me know if you'd like to arrange a viewing.`
}
```

For v1.2, hardcoded format is sufficient. Template customization can come later.

### Modified Files

| File | Change Type | What Changes |
|------|-------------|--------------|
| `src/main/clipboard.ts` | MODIFY | Add `detectPropertyUrl()`, add URL detection to `startClipboardWatcher()`, raise length limit from 80 to 500 |
| `src/main/index.ts` | MODIFY | Add `onUrlDetected()` callback, wire to panel window |
| `src/preload/index.ts` | MODIFY | Expose `onUrlDetected()` listener + `removeUrlDetectedListener()` |
| `src/renderer/panel/App.tsx` | MODIFY | Add `detectedUrl` state, subscribe to `url:detected` event, show share UI |

### Settings Integration

Add a `propertyShareEnabled` boolean to AppSettings (default: true) so agents can disable URL detection if it's noisy. Gate the URL detection behind this setting in `startClipboardWatcher()`.

---

## Component Dependency Graph

```
Feature 1 (Area Guides):        RENDERER ONLY
  shared/area-guides.ts         (NEW - static data)
  renderer/AreaGuidesView.tsx   (NEW)
  renderer/App.tsx              (MODIFY - view type + TitleBar button + render block)

Feature 2 (Quick Calculators):  RENDERER ONLY
  renderer/CalculatorsView.tsx  (NEW)
  renderer/App.tsx              (MODIFY - view type + TitleBar button + render block)

Feature 3 (Activity Timeline):  FULL STACK
  shared/types.ts               (MODIFY - ActivityEntry, ActivityType, Contact.activity)
  main/activity.ts              (NEW - logging function)
  main/ipc.ts                   (MODIFY - add logging to 7 handlers + new read handler)
  preload/index.ts              (MODIFY - add getContactActivity)
  renderer/ActivityTimeline.tsx (NEW)
  renderer/ContactCard.tsx      (MODIFY - add accordion section)

Feature 4 (Voice Memo):         RENDERER ONLY
  renderer/VoiceMemo.tsx        (NEW)
  renderer/GeneralNotes.tsx     (MODIFY - add tab toggle)

Feature 5 (Property Quick-Share): MAIN + RENDERER
  main/clipboard.ts             (MODIFY - URL detection)
  main/index.ts                 (MODIFY - onUrlDetected callback)
  preload/index.ts              (MODIFY - onUrlDetected listener)
  renderer/App.tsx              (MODIFY - detectedUrl state + subscription)
  shared/types.ts               (MODIFY - propertyShareEnabled in AppSettings)
  main/store.ts                 (MODIFY - propertyShareEnabled default)
```

---

## Suggested Build Order

### Phase 8: Area Guides (INDEPENDENT -- no deps on other features)

1. Create `src/shared/area-guides.ts` (static data from existing research)
2. Create `src/renderer/panel/components/AreaGuidesView.tsx`
3. Modify App.tsx: add `'area-guides'` View, title bar button, view render block
4. Test: navigate, browse, compare

**Rationale:** Zero dependencies. Pure renderer. Static data + display. Research data already exists in `.planning/research/dubai-area-guides-research.md`.

### Phase 9: Quick Calculators (INDEPENDENT -- no deps on other features)

1. Create `src/renderer/panel/components/CalculatorsView.tsx`
2. Modify App.tsx: add `'calculators'` View, title bar button, view render block
3. Test: all three calculators with edge cases

**Rationale:** Pure renderer-side math. No IPC, no data model changes. Completely independent.

### Phase 10: Activity Timeline (CROSS-CUTTING -- modifies shared types + main process)

1. Add `ActivityEntry`, `ActivityType` to `src/shared/types.ts`, add `activity?` to `Contact`
2. Create `src/main/activity.ts` with `logActivity()` function
3. Add logging calls to 7 existing IPC handlers in `ipc.ts`
4. Add `contacts:get-activity` IPC handler
5. Expose in `preload/index.ts`
6. Create `ActivityTimeline.tsx` component
7. Add accordion section to `ContactCard.tsx`
8. Test: perform actions, verify timeline populates

**Rationale:** Most cross-cutting feature. Touches data model and multiple action paths. Build after simple renderer features are stable. Must come before Voice Memo so voice memo pushes get auto-logged.

### Phase 11: Voice Memo to OneNote (benefits from Phase 10 for auto-logging)

1. Create `src/renderer/panel/components/VoiceMemo.tsx`
2. Modify `GeneralNotes.tsx`: add text/voice tab toggle
3. Test: record, transcribe, edit, push to OneNote

**Rationale:** Reuses existing Whisper and OneNote infrastructure. Benefits from Activity Timeline being in place (auto-logs voice memo pushes via existing `onenote:push-notes` handler).

### Phase 12: Property Quick-Share (highest integration risk -- touches clipboard core)

1. Add URL detection to `src/main/clipboard.ts`
2. Add `onUrlDetected` callback in `src/main/index.ts`
3. Add `url:detected` IPC event + preload exposure
4. Add URL detection handler + share UI in `App.tsx`
5. Test: copy property portal URLs, verify detection and share flow
6. Regression test: verify phone and email detection still work

**Rationale:** Modifies clipboard.ts, the most sensitive module (runs every 500ms, drives core phone detection). Build last so all other features are stable. Isolated regression risk.

### Phase 13: Landing Page Update (depends on all features being complete)

Must reflect all shipped v1.2 features. Update after all 5 features are verified.

### Build Order Summary

```
Phase 8:  Area Guides         [INDEPENDENT]     ~2-3 plans
Phase 9:  Quick Calculators   [INDEPENDENT]     ~1-2 plans
Phase 10: Activity Timeline   [CROSS-CUTTING]   ~2-3 plans
Phase 11: Voice Memo          [BENEFITS FROM 10] ~1-2 plans
Phase 12: Property Quick-Share [INDEPENDENT*]    ~1-2 plans
Phase 13: Landing Page Update [DEPENDS ON ALL]   ~1 plan

* Independent in code, but benefits from Phase 10 for activity logging.
  Could be built in parallel with Phase 11 if needed.
```

---

## Title Bar Layout After v1.2

Current:
```
[Keyboard] [BookOpen] [Mic] [Settings] | [-] [_] [X]
```

After v1.2:
```
[Keyboard] [BookOpen] [MapPin] [Calculator] [Mic] [Settings] | [-] [_] [X]
```

6 icon buttons at 32px each = 192px. The panel is typically 400-500px wide. This leaves room for title text and window controls. If the panel is narrow, the icons still fit.

**Icon choices (all lucide-react):**
- Keyboard (existing) -- keyboard shortcuts
- BookOpen (existing) -- education/flashcards
- MapPin (new) -- area guides
- Calculator (new) -- calculators
- Mic (existing) -- meeting transcriber
- Settings2 (existing) -- settings window

---

## Patterns to Follow

### Pattern 1: New Full-Screen View (Area Guides, Calculators)

Every full-screen view follows this exact template in App.tsx:

```tsx
// Extend View union
type View = '...' | 'area-guides' | 'calculators'

// TitleBar button (right side, before Settings)
<button
  onClick={() => setView('area-guides')}
  className="w-8 h-8 flex items-center justify-center text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.08] transition-colors"
  title="Area Guides"
>
  <MapPin size={14} strokeWidth={1.5} />
</button>

// View render block (before main view return)
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

### Pattern 2: Extracted Sub-Component in ContactCard

Follow the GeneralNotes.tsx extraction pattern:

```tsx
// ActivityTimeline.tsx - standalone component file
interface ActivityTimelineProps {
  activity: ActivityEntry[]
}
export default function ActivityTimeline({ activity }: ActivityTimelineProps) { ... }

// ContactCard.tsx - import and render in accordion section
import ActivityTimeline from './ActivityTimeline'
```

### Pattern 3: Clipboard Detection Extension (Property Quick-Share)

Follow the existing phone/email detection pattern:

```typescript
export function startClipboardWatcher(
  onPhoneDetected: (e164: string, displayNumber: string) => void,
  onEmailDetected?: (email: string) => void,
  onUrlDetected?: (url: string) => void  // NEW parameter
): void {
  // ... existing logic ...
  // After email detection:
  if (onUrlDetected && trimmed.length <= 500) {
    const url = detectPropertyUrl(trimmed)
    if (url) { onUrlDetected(url); return }
  }
}
```

### Pattern 4: Tab Toggle in Existing Component (Voice Memo in GeneralNotes)

```tsx
const [inputMode, setInputMode] = useState<'text' | 'voice'>('text')

<div className="flex gap-1 mb-2">
  <button onClick={() => setInputMode('text')} className={...}>Text</button>
  <button onClick={() => setInputMode('voice')} className={...}>Voice</button>
</div>

{inputMode === 'text' ? (
  // existing textarea + push button
) : (
  <VoiceMemo onTranscript={(text) => { setNotes(text); setInputMode('text') }} />
)}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Global State Manager

**What:** Introducing Redux, Zustand, or Jotai for v1.2 features.
**Why bad:** The app works fine with useState + props. Five features don't justify a state management library. The cost of migration vastly exceeds the benefit.
**Instead:** Continue with useState in App.tsx.

### Anti-Pattern 2: Creating a Database for Activity Timeline

**What:** Adding SQLite, LevelDB, or IndexedDB for activity storage.
**Why bad:** electron-store handles the volume. 200 entries * 500 contacts = 100K entries, ~20MB total. A database adds native module build complexity and migration headaches.
**Instead:** Store activity in the Contact object in electron-store.

### Anti-Pattern 3: Separate Window for Calculators

**What:** Opening calculators in a new BrowserWindow.
**Why bad:** The app is a single-window panel. Every other view (Education, Transcriber) is a view switch, not a new window.
**Instead:** Add calculators as a view within the existing window.

### Anti-Pattern 4: Real-Time Activity Feed

**What:** Building a WebSocket/push system for activity updates.
**Why bad:** The timeline only needs to load when the accordion opens. The agent does one thing at a time.
**Instead:** Load activity from store when accordion opens.

### Anti-Pattern 5: Scraping Property URLs for Rich Previews

**What:** Fetching URL content to extract title, price, images.
**Why bad:** Scraping property portals violates the "no data scraping" constraint (PROJECT.md line 57). Also adds latency.
**Instead:** Share the URL as-is. WhatsApp generates its own link preview.

### Anti-Pattern 6: Refactoring TranscriberView to Share Code with Voice Memo

**What:** Extracting shared AudioRecorder class, refactoring TranscriberView.
**Why bad:** TranscriberView is 736 lines of working code. Refactoring risks breaking it. Voice Memo is simpler (no phone flow, no source selection). The shared code would be minimal.
**Instead:** Duplicate ~60 lines of recording code in VoiceMemo.tsx.

### Anti-Pattern 7: Detecting ALL Clipboard URLs

**What:** Treating any URL as a property listing.
**Why bad:** Users copy URLs constantly. Triggering the share bar for every URL would be extremely annoying.
**Instead:** Whitelist known Dubai property portal domains only.

---

## Edge Cases

| Feature | Edge Case | How to Handle |
|---------|-----------|---------------|
| Area Guides | Data becomes stale | Show `effectiveDate` prominently, update in next app release |
| Area Guides | Panel resized very narrow | Stack cards vertically, truncate comparison to 2 columns |
| Calculators | Agent enters 0% interest rate | Handle: if rate=0, monthly payment = principal/months |
| Calculators | Very large numbers (500M AED) | Use `Intl.NumberFormat('en-AE')` for display |
| Activity Timeline | Contact has no activity yet | Show "No activity recorded" placeholder |
| Activity Timeline | Existing contacts lack `activity` field | Handle in getContact(): default to empty array |
| Activity Timeline | 200+ entries per contact | Cap at 200, oldest pruned. Display 20, "Show more" button |
| Voice Memo | Mic permission denied | Show error with instructions to allow in Windows settings |
| Voice Memo | Very short recording (<2s) | Allow -- Whisper handles short audio fine |
| Voice Memo | Recording >5 min | Warn at 3 min, auto-stop at 5 min |
| Voice Memo | Whisper model not downloaded | Show download progress bar (same as TranscriberView) |
| Property Quick-Share | URL from unknown portal | Don't detect. Whitelist only. |
| Property Quick-Share | URL with tracking params | Share as-is. Stripping params risks breaking the link. |
| Property Quick-Share | Clipboard has URL + phone | Phone detection runs first (<=25 chars). If text is longer, URL detection runs. |
| Property Quick-Share | No contact loaded | Show URL with "Copy" button, prompt to load a contact for WhatsApp share |

---

## Scalability Considerations

| Concern | Current (v1.2) | At 1K contacts | At 5K contacts |
|---------|----------------|-----------------|-----------------|
| Activity storage | 200 entries/contact in JSON | ~40MB store file | ~200MB, may need pruning strategy |
| Clipboard polling | 500ms, 3 regex tests + 1 URL check | Same | Same -- no contact scaling |
| Area guide data | 10 communities, static | Same | Same -- static data |
| View switching | 10 views, if-chain in App.tsx | Same | Same -- O(1) switching |

---

## Sources

- All integration points verified by direct source code inspection of the repository
- View switching pattern verified from App.tsx (line 17: View type union, lines 641-663: view render blocks)
- Clipboard detection flow verified from clipboard.ts (lines 74-120)
- Static data pattern verified from shared/flashcards.ts (1,517 cards imported directly by FlashcardView)
- Whisper worker protocol verified from workers/whisper-worker.ts (lines 7-15: message types)
- OneNote push mechanism verified from onenote.ts (pushNotesToOneNote, lines 397-475)
- Contact data model verified from types.ts (Contact interface, lines 118-128)
- IPC handler registry verified from ipc.ts (30+ handlers)
- Area guide research data: `.planning/research/dubai-area-guides-research.md`
- No external research needed -- integration architecture based on existing codebase patterns
