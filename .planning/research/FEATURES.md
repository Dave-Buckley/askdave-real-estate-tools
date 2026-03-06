# Feature Landscape

**Domain:** Real estate agent productivity toolkit (UAE/Dubai market) -- v1.2 milestone features
**Researched:** 2026-03-06
**Scope:** Area Guides, Quick Calculators, Activity Timeline, Voice Memo Transcription, Property URL Quick-Share
**Overall confidence:** HIGH -- All five features build on existing v1.0/v1.1 infrastructure with clear patterns to follow

---

## Research Context

v1.1 shipped with General Notes (OneNote push), Form I rewrites, and landing page updates. The app now has 10,000+ LOC across a frameless Electron window with ContactCard (693+ lines), TranscriberView (729 lines), FlashcardView, NewsFeed, and GeneralNotes components. The clipboard already detects phone numbers and email addresses. The Whisper AI transcriber already processes audio locally via ONNX Web Worker.

**Existing infrastructure these v1.2 features build on:**

| Infrastructure | Feature It Enables | Location |
|---|---|---|
| `clipboard.ts` -- polls clipboard every 500ms, extracts phone/email | Property URL Quick-Share | `src/main/clipboard.ts` |
| `selection.ts` -- grabs OS selection, extracts contact info | Property URL detection via selection hotkey | `src/main/selection.ts` |
| TranscriberView -- Whisper Web Worker, MediaRecorder, Float32Array audio pipeline | Voice Memo Transcription | `src/renderer/panel/components/TranscriberView.tsx` |
| GeneralNotes -- push-to-OneNote with timestamp | Voice Memo transcription output destination | `src/renderer/panel/components/GeneralNotes.tsx` |
| `onenote.ts` -- COM API via PowerShell, page create/find/append | Activity Timeline notes, Voice Memo output | `src/main/onenote.ts` |
| FlashcardView -- dedicated view with back navigation | Area Guides view pattern (new TitleBar nav item) | `src/renderer/panel/components/FlashcardView.tsx` |
| `flashcards.ts` -- 1,517 cards with Dubai market data | Area Guides data source (area content already researched) | `src/shared/flashcards.ts` |
| Contact model with `e164`, `oneNotePageId`, `roles` | Activity Timeline keyed per contact | `src/shared/types.ts` |
| electron-store -- JSON persistence for settings, contacts, templates | Activity Timeline local storage | `src/main/store.ts` |
| Area content researched for 10 communities | Area Guides content ready to structure | `.planning/research/dubai-area-guides-research.md` |

---

## Table Stakes

Features users expect once advertised. Missing any = feature feels incomplete.

### Feature 1: Area Guides

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|-------------|
| **Community profile cards with key stats** | Bayut area guides (the market standard in Dubai) show price/sqft, rental yield, service charges, transport, lifestyle for each community. Agents need quick reference during client calls -- "What's the yield in JVC?" -- without opening a browser. Every major portal offers this. | Med | Static data file (JSON/TS). Existing area research covers 10 Dubai communities with verified data from 45+ sources. |
| **Side-by-side comparison (2-3 areas)** | When clients say "I'm choosing between Dubai Hills and JVC," agents need to compare stats at a glance. Every property portal (Bayut, Property Finder) has a comparison tool showing a table with areas as columns. Without this, agents screenshot Bayut instead of using the app. | Med | Requires multi-select UI. Data must be structured identically across communities for column alignment. |
| **Price/sqft, rental yield, service charges per area** | These three numbers are what agents are asked most often. They drive every investment conversation. Missing any one = agents go back to Bayut. The cross-reference audit confirmed data for all 10 communities. | Low | Data already researched and cross-referenced in `area-data-cross-reference.md`. Use corrected Priority 1 values. |
| **Transport/metro connectivity per area** | "Is there a metro station?" is a top-5 question from tenants and investors. Answers affect rental yield assumptions and commute decisions. Dubai's Blue Line (2029) is a confirmed catalyst for Creek Harbour and JVC. | Low | Already in research data. Include current metro stations and confirmed future lines (Blue Line 2029, Purple Line TBC). |
| **Freehold status** | Non-residents can only buy in freehold areas. This is a binary qualifier that eliminates or includes areas from consideration instantly. Critical for Dubai's international buyer market. | Low | All 10 researched areas are freehold. Flag it clearly per area. |
| **"Effective as of" date displayed** | Market data changes quarterly. Agents need to know whether to trust the numbers or cross-check. Bayut area guides show "Updated [month] [year]." Without a date, the data looks unreliable and creates liability risk. | Low | Single date string per area or globally. |

### Feature 2: Quick Calculators

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|-------------|
| **Mortgage payment calculator** | Every property website in Dubai has one. Inputs: property price, down payment %, loan term (years), interest rate. Output: monthly payment. UAE Central Bank LTV rules are specific and differ by buyer nationality and property count. Must default to UAE rules, not generic formulas. | Med | Pure math, no external APIs. Must handle UAE-specific LTV table (see reference section below). |
| **Commission calculator** | "How much do I earn on this deal?" is asked daily. Standard: 2% of sale price for secondary market, 5% for rentals, split 50/50 with agency. Inputs: sale price, commission %, agent split %. Output: total commission, agent share, with 5% VAT. | Low | Pure math. Default to Dubai standard: 2% sale, 5% rental, 50/50 agent/agency split. All rates confirmed via RERA regulation. |
| **ROI/yield calculator** | Investors ask "what's my return?" multiple times per week. Inputs: purchase price, annual rent, service charges, vacancy rate. Output: gross yield, net yield, cash-on-cash return (if mortgage). Must clearly distinguish gross vs net yield -- the flashcard accuracy audit found agents confuse these. | Med | Pure math. Must surface the distinction between gross yield (rent/price) and net yield (rent minus costs / price). |
| **DLD cost breakdown** | "What are the total costs?" is asked on every sales transaction. Buyers want the full picture: 4% DLD transfer fee, 2% commission + VAT, mortgage registration 0.25%, trustee fee, admin fees. Inputs: purchase price, cash/mortgage. Output: itemized cost table with total. | Low | Pure math. All fee percentages are established by DLD regulation (verified against Property Finder 2026 guide). |

### Feature 3: Activity Timeline

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|-------------|
| **Auto-log actions per contact** | Every CRM has an activity log showing "Called on [date]", "Sent WhatsApp on [date]", "Booked viewing on [date]". Agents expect to see what they did and when. Without this, they rely on memory or scrolling through WhatsApp chat history. Modern CRMs like Close, Nimble, and Follow Up Boss all center on the interaction timeline. | Med-High | Must intercept existing IPC calls (dial, openWhatsApp, bookCalendar, pushNotesToOneNote, sendWhatsAppMessage) and log events to electron-store per e164. |
| **Chronological event list in ContactCard** | Events displayed newest-first in a scrollable list within the contact card. Each entry: timestamp, action type icon, brief description. This is where agents check "when did I last call this person?" -- the single most common CRM lookup. | Med | New collapsible section in ContactCard (pattern already exists: templates, forms, news all use collapsible sections). |
| **Event types covering all existing actions** | Call, WhatsApp open, WhatsApp template sent, viewing booked, consultation booked, follow-up set, notes pushed to OneNote, form sent via WhatsApp/Gmail, email composed. If the log misses an action type, agents lose trust in it. Completeness matters more than design. | Med | Each action type needs a hook point in existing code. Most actions flow through `window.electronAPI.*` methods already. |

### Feature 4: Voice Memo Transcription

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|-------------|
| **Record short voice memo (30s-5min)** | After a call, agents want to quickly dictate notes: "Client wants 2BR in Marina, budget 120K, move-in next month." Speaking is 3x faster than typing. Desktop mic is the expected input (phone call just ended, agent is at desk). Voice-to-CRM is a growing category (Close, Acto, snapAddy all offer it). | Low-Med | Reuse existing desktop mic recording path from TranscriberView. Strip out phone/QR flow -- this is desktop-only, short-form. |
| **Transcribe with Whisper and push to OneNote** | The transcription must end up in OneNote on the contact's page, just like General Notes. Workflow: record, transcribe, review, push. If it only transcribes but doesn't push, agents still have to copy-paste -- defeating the purpose. | Med | Reuse Whisper Web Worker from TranscriberView. Reuse pushNotesToOneNote from GeneralNotes/onenote.ts. Combine both flows into a new component. |
| **Review before push** | Whisper is not perfect -- especially with Arabic names, building names, and mixed-language speech common in Dubai. Agents must see the transcription and be able to edit before pushing. Auto-push without review will send garbled text to OneNote. | Low | Show transcription in an editable textarea before push, same pattern as GeneralNotes. |

### Feature 5: Property URL Quick-Share

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|-------------|
| **Detect property portal URLs in clipboard** | When an agent copies a Bayut/Property Finder/Dubizzle listing URL, the app should recognize it and offer to share via WhatsApp. Same UX pattern as phone number detection: copy triggers action. Agents currently copy a URL, switch to WhatsApp, paste, add a message -- 4 steps reduced to 1. | Low-Med | Extend `clipboard.ts` polling. Add URL regex for `bayut.com`, `propertyfinder.ae`, `dubizzle.com`. Raise the 80-char text length limit or add URL check before the gate. |
| **WhatsApp share button with pre-filled message** | "Hi {name}, check out this property: [URL]". One click opens WhatsApp with the link pre-filled using the active contact. Agents share listings via WhatsApp dozens of times daily -- this is the primary communication channel in Dubai real estate. | Low | Reuse `openWhatsApp` / `sendWhatsAppMessage` with the URL in the message body. Needs active contact with e164. |

---

## Differentiators

Features that elevate v1.2 beyond what agents get from Bayut or their CRM. Not expected, but genuinely valuable.

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|-------------|
| **Area comparison with highlight of best values** | When comparing 2-3 areas side-by-side, bold/highlight the best value in each row (highest yield, lowest service charge, nearest metro). Bayut does NOT do this -- their comparison is raw numbers only. This is the detail that makes agents say "this tool actually helps me sell." | Low | Conditional styling on comparison table cells. Simple min/max logic per row. |
| **Calculator with "show your client" copy button** | After calculating mortgage payments or ROI, a "Copy summary" button formats the output as a clean WhatsApp message the agent can send to a client. Transforms the calculator from a personal tool into a client-facing communication tool. No CRM calculator does this. | Low | Format calculation output as text, copy to clipboard or open WhatsApp with pre-filled message. |
| **Calculator effective date + source reference** | Display "Rates as of [date]. Source: UAE Central Bank / DLD" below each calculator. Protects agents from liability if rates change. No competitor calculator in the Dubai market displays its data source or effective date. | Low | Static text. Update when regulations change. |
| **Voice memo with auto-timestamp prefix** | When a voice memo transcription is pushed to OneNote, prefix with "[Voice memo - 2026-03-06 14:32]" to distinguish from typed notes. Agents reviewing OneNote can see at a glance which notes were typed vs dictated. | Low | String prefix before push. Same pattern as GeneralNotes timestamp in `buildNotesAppendScript()`. |
| **Activity timeline export/copy** | Copy the full activity log for a contact as formatted text. Useful when agents hand off a client to a colleague or write a deal summary for management. No lightweight tool offers this -- only full CRM exports. | Low | Format events array as text, copy to clipboard. |
| **Property URL detection includes listing title** | When a property URL is detected, fetch the og:title meta tag to display "2BR in Dubai Marina - AED 1.8M" instead of the raw URL. More useful, more professional. | Med | HTTP fetch of URL in main process, parse og:title. May fail for some URLs (CORS, auth). Mark as best-effort. |
| **Area guide "Share with client" button** | Format an area's key stats as a WhatsApp message and send to the active contact. Agent is on a call, client asks about JVC, agent opens area guide, clicks share -- client gets a formatted summary. No competitor offers in-context area sharing. | Low | Template string with area stats, send via existing WhatsApp flow. |
| **Calculator history (last 5)** | Save the last 5 calculations so agents can reference them during a call. "What was the monthly payment for that 2BR at 1.8M again?" Avoids re-entering values mid-conversation. | Low | Array in React state. No persistence needed across sessions. |

---

## Anti-Features

Features to explicitly NOT build for v1.2.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Live price feeds in area guides** | Requires API integration with Bayut/Property Finder, which is either expensive (paid API) or fragile (scraping). Violates project constraint: "no data scraping from property portals." Static data updated manually is accurate enough for agent reference during calls. | Use static data with "effective as of" date. Agent can reference Bayut for live prices. |
| **Full area guide articles** | Bayut area guides are 2,000+ word articles with photos, history, lifestyle content. Replicating this in-app is content marketing work, not productivity tooling. The app should show reference data, not editorial content. | Show a data card with key stats, not an article. Link to Bayut or Ask Dave Dubai website for full articles. |
| **Calculator API for live interest rates** | UAE Central Bank rate changes are infrequent (2-4 times per year). Fetching live rates adds API dependency for data that barely moves. Also creates a reliability risk if the API goes down during a client conversation. | Default to current rate (3.99-5.5% range). Let agent manually adjust. Display "Rate as of [date]" for transparency. |
| **Activity timeline sync to CRM** | Agents use different CRMs (Salesforce, PropSpace, Yardi, BrokerPad). Building integrations for each is a separate product. The app is CRM-adjacent, not CRM-replacement -- this is a core project constraint. | Local-only activity log. Agents can copy/export to paste into their CRM manually. |
| **Activity timeline for email-only contacts** | The app is phone-number-centric. Email-only contacts (rare in Dubai market where WhatsApp dominates) would need a separate keying mechanism. Not worth the complexity for v1.2. | Timeline is keyed on e164. Email-only contacts don't get activity tracking. |
| **Voice memo continuous recording** | The meeting transcriber already handles long recordings (10-60 min). Voice memos are post-call dictation: 30 seconds to 5 minutes. Adding continuous recording conflates two distinct use cases and confuses the UI. | Cap voice memo at 5 minutes. Direct agents to Meeting Transcriber for longer recordings. |
| **Voice memo on phone mic** | The meeting transcriber has the phone-mic-via-WiFi flow (QR code, WebSocket server). Voice memos are desk-side dictation -- agent just hung up and wants to dictate. Adding the phone flow to voice memo duplicates UI complexity. | Desktop mic only for voice memos. Phone mic flow stays in Meeting Transcriber. |
| **Property URL scraping for listing details** | Fetching and parsing full listing pages from Bayut/Property Finder for price, bedrooms, photos is scraping. Violates project constraints and portal Terms of Service. | Detect URL pattern only. Share the URL as-is. Best-effort og:title fetch is acceptable (single lightweight HEAD/GET request, not systematic scraping). |
| **Map view in area guides** | Embedding a map (Google Maps, Mapbox) adds API costs, bundle size, and complexity. Agents know where Dubai communities are -- they drive between them daily. | Link to Google Maps for each area. No embedded map component. |
| **Multi-currency calculator** | Some international investors think in USD/GBP/EUR. Adding currency conversion adds an API dependency and stale-data risk. Exchange rates fluctuate daily. | Show all values in AED (Dubai standard). Agent can convert manually or use their browser. |

---

## Feature Dependencies

```
Area Guides (new view, like Education/Flashcards)
  +-- New View type: 'area-guides' added to App.tsx View union
  +-- New TitleBar nav button (e.g., MapPin or Building2 icon from lucide-react)
  +-- New component: AreaGuidesView.tsx
  +-- New data file: src/shared/areas.ts (structured area data for 10 communities)
  +-- Comparison sub-view: AreaComparison.tsx (side-by-side table)
  +-- No new IPC needed (all static data, rendered in renderer process)

Quick Calculators (new view or section)
  +-- New View type: 'calculators' added to App.tsx View union
  +-- OR: Embed as tab within Area Guides view (calculators complement area data)
  +-- New component: CalculatorsView.tsx with tabs: Mortgage | Commission | ROI | Costs
  +-- No IPC needed (pure client-side math)
  +-- No external APIs (all formulas are standard financial math)

Activity Timeline (per-contact, inside ContactCard)
  +-- New type: ActivityEvent { id, timestamp, type, description, metadata? }
  +-- New store key: activityLog: Record<string, ActivityEvent[]> (keyed by e164)
  +-- New IPC handler: 'activity:log' (e164, event type, description)
  +-- Intercept existing action handlers to log events:
      +-- dial() -> log "Called"
      +-- openWhatsApp() -> log "Opened WhatsApp"
      +-- sendWhatsAppMessage() -> log "Sent WhatsApp [template/form name]"
      +-- bookCalendar() -> log "Booked [viewing/consultation]"
      +-- createFollowUp() -> log "Set follow-up [N days]"
      +-- pushNotesToOneNote() -> log "Pushed notes to OneNote"
      +-- handleFormWhatsApp/Gmail() -> log "Sent [form name] via [WhatsApp/Gmail]"
  +-- New collapsible section in ContactCard: "Activity" (between General Notes and Templates)
  +-- Depends on: Contact model (e164 as key, already exists)

Voice Memo Transcription (in ContactCard, adjacent to General Notes)
  +-- Reuse: Whisper Web Worker from TranscriberView
  +-- Reuse: desktop mic recording path (MediaRecorder + device picker)
  +-- Reuse: pushNotesToOneNote IPC from GeneralNotes
  +-- New component: VoiceMemo.tsx (record button, transcription preview, push button)
  +-- Placement: Below General Notes in ContactCard, OR as tab within General Notes section
  +-- Activity Timeline integration: log "Voice memo transcribed and pushed"
  +-- Depends on: oneNotePageId on contact (for push destination)
  +-- Does NOT reuse: phone mic flow, QR code, transcriber-server.ts

Property URL Quick-Share (extend clipboard detection)
  +-- Extend: clipboard.ts to detect property portal URLs
  +-- New regex patterns for: bayut.com, propertyfinder.ae, dubizzle.com
  +-- New IPC event: 'url:detected' (url, domain)
  +-- New UI: Similar to phone detection popup -- shows URL + "Share via WhatsApp" button
  +-- Depends on: Active contact with e164 (to send WhatsApp)
  +-- If no active contact: Show URL detected, offer to copy formatted message
  +-- Must raise or bypass the 80-char text length limit in clipboard.ts
```

---

## UAE-Specific Calculator Parameters

### Mortgage Calculator -- UAE Central Bank LTV Rules (as of early 2026)

| Buyer Type | Property Value | Max LTV | Min Down Payment |
|---|---|---|---|
| UAE National -- first home | Up to AED 5M | 85% | 15% |
| UAE National -- first home | Above AED 5M | 75% | 25% |
| UAE National -- 2nd+ / investment | Any | 65% | 35% |
| Expat -- first home | Up to AED 5M | 80% | 20% |
| Expat -- first home | Above AED 5M | 70% | 30% |
| Expat -- 2nd+ / investment | Any | 60% | 40% |
| Off-plan (any buyer) | Any | 50% | 50% |

- Max loan tenor: 25 years
- Max age at loan maturity: 65 (employed) / 70 (self-employed)
- Max DBR (debt burden ratio): 50% of monthly gross income
- Mortgage registration fee: 0.25% of loan amount + AED 290 admin
- Current rate range: 3.99% (fixed promo) to 5.5% (variable EIBOR+margin)
- 3-month EIBOR: trending toward 3.58% as of late Feb 2026
- Source: [UAE Central Bank Rulebook](https://rulebook.centralbank.ae/en/rulebook/regulations-regarding-mortgage-loans)

### Commission Calculator -- Dubai Standards

| Transaction | Standard Commission | VAT | Typical Split |
|---|---|---|---|
| Sales (secondary) | 2% of sale price | 5% on commission | 50/50 agent/agency |
| Rentals | 5% of annual rent | 5% on commission | 50/50 agent/agency |
| Off-plan (developer) | 3-7% of sale price (paid by developer) | 5% on commission | Varies by developer agreement |

- Source: [RERA regulation via Engel & Volkers](https://www.engelvoelkers.com/ae/en/resources/how-much-is-the-real-estate-agent-commission-in-dubai)

### DLD Cost Breakdown -- Standard Fees (as of 2026)

| Fee | Amount | Paid By |
|---|---|---|
| DLD Transfer Fee | 4% of purchase price | Buyer (typically) |
| Title Deed Issuance | AED 580 | Buyer |
| Trustee Fee | AED 2,000 + 5% VAT (property < AED 500K) | Buyer |
| Trustee Fee | AED 4,000 + 5% VAT (property >= AED 500K) | Buyer |
| Agent Commission | 2% + 5% VAT | Buyer (market norm) |
| Mortgage Registration | 0.25% of loan + AED 290 | Buyer (if mortgaged) |
| NOC from Developer | AED 500-5,000 (varies by developer) | Seller |
| Oqood (off-plan registration) | 4% of purchase price | Buyer |

- Total buyer closing costs: typically 5-9% of purchase price
- Source: [Property Finder DLD fees guide 2026](https://www.propertyfinder.ae/blog/dld-fees-dubai/), [Totality Estates fees breakdown 2026](https://totalityestates.com/blog/dubai-property-fees-charges-breakdown)

---

## Area Guides -- Content Scope

### Data fields per community (structured for comparison)

Based on Bayut area guide format and the existing cross-reference research:

| Field | Type | Example (JVC) | Comparison-relevant |
|---|---|---|---|
| Name | string | "Jumeirah Village Circle" | -- |
| Short name | string | "JVC" | Yes |
| Tagline | string | "Affordable Hub, Maximum Yield" | -- |
| Price/sqft (AED) | range | 950-1,450 | Yes |
| Rental yield (%) | range | 7.0-9.0 | Yes |
| Service charges (AED/sqft/yr) | range | 10-18 | Yes |
| Freehold | boolean | true | Yes |
| Beachfront | boolean | false | Yes |
| Metro station | string | "None (Blue Line expected)" | Yes |
| Key developers | string[] | ["Nakheel", "various"] | -- |
| Property types | string[] | ["Apartments", "Townhouses"] | -- |
| Best for | string[] | ["First-time buyers", "Investors", "Families"] | -- |
| Entry price (studio) | number | ~500K AED | Yes |
| YoY price trend | string | "+11%" | Yes |
| Short-term rental demand | string | "Moderate-High" | Yes |
| Highlights (5) | string[] | ["Highest yields in Dubai", ...] | -- |
| Considerations | string[] | ["No metro currently", ...] | -- |

### Communities to include (10, all researched and cross-referenced)

1. Downtown Dubai
2. Dubai Marina
3. Palm Jumeirah
4. Business Bay
5. Dubai Hills Estate
6. Jumeirah Beach Residence (JBR)
7. Dubai Creek Harbour
8. Jumeirah Village Circle (JVC)
9. Mohammed Bin Rashid City (MBR City)
10. Dubai South

**Data source:** Use the corrected values from `.planning/research/area-data-cross-reference.md` Priority 1-3 updates applied to `.planning/research/dubai-area-guides-research.md`, NOT the existing Ask Dave Dubai content (which has discrepancies in prices and service charges identified in the cross-reference audit).

---

## Activity Timeline -- Event Type Design

| Event Type | Icon | Description Format | Trigger Point |
|---|---|---|---|
| `call` | Phone | "Called" | `dial()` in `actions.ts` |
| `whatsapp_open` | MessageCircle | "Opened WhatsApp" | `openWhatsApp()` in `actions.ts` |
| `whatsapp_template` | MessageCircle | "Sent template: [name]" | `sendWhatsAppMessage()` via template preview |
| `whatsapp_form` | FileText | "Sent [form name] via WhatsApp" | form WhatsApp handler in ContactCard |
| `email` | Mail | "Composed email" | Gmail compose handler |
| `email_form` | Mail | "Sent [form name] via Gmail" | form Gmail handler in ContactCard |
| `viewing_booked` | Calendar | "Booked viewing" | `bookCalendar('viewing')` |
| `consultation_booked` | Calendar | "Booked consultation" | `bookCalendar('consultation')` |
| `follow_up` | Clock | "Set [N]-day follow-up" | `createFollowUp()` |
| `notes_pushed` | FileText | "Pushed notes to OneNote" | `pushNotesToOneNote()` |
| `voice_memo` | Mic | "Voice memo transcribed and pushed" | Voice memo push button |
| `onenote_opened` | FileText | "Opened OneNote page" | `openInOneNote()` |
| `url_shared` | Link | "Shared property listing" | Property URL WhatsApp share |

**Storage consideration:** Cap at 200 events per contact. Older events trimmed (FIFO). At typical agent usage (5-10 interactions per contact per week), this covers a contact's full history for 20-40 weeks before trimming begins. Most transactions close within 2-8 weeks, so 200 events is generous.

---

## Voice Memo -- Workflow Design

```
1. Agent finishes a phone call
2. Contact card is already showing (clipboard detected the phone number)
3. Agent clicks "Voice Memo" button (microphone icon, below General Notes)
4. Desktop mic starts recording immediately (no source picker -- use default device)
5. Agent dictates: "Client wants 2BR in Marina, budget 120K..."
6. Agent clicks "Stop" (or auto-stop at 5 min cap)
7. Whisper transcribes audio locally (reuse existing ONNX Web Worker)
8. Transcription appears in editable textarea
9. Agent reviews/edits (important: Arabic names, building names get garbled)
10. Agent clicks "Push to OneNote"
11. Text pushed with "[Voice memo - DD Mon YYYY, H:MM AM/PM]" prefix
12. Textarea clears, success feedback shown, activity event logged
```

**Key differences from Meeting Transcriber:**

| Aspect | Meeting Transcriber | Voice Memo |
|---|---|---|
| Duration | 10-60+ minutes | 30 sec - 5 min |
| Input source | Phone mic (WiFi) OR Desktop mic | Desktop mic only |
| Source picker | Yes (phone vs desktop selection) | No (always default desktop mic) |
| Output destination | Copy transcript to clipboard | Push to OneNote (like General Notes) |
| Location in UI | Separate view (TitleBar nav icon) | Inside ContactCard (next to General Notes) |
| Contact context | None (standalone tool) | Tied to active contact (e164) |
| QR code flow | Yes (for phone mic) | No |

---

## Property URL Quick-Share -- Detection Patterns

### URL regex patterns for Dubai property portals

```typescript
// Bayut listing URLs
// https://www.bayut.com/for-sale/property/dubai/dubai-marina/
// https://www.bayut.com/to-rent/3-bedroom-apartments/dubai/jvc/
// https://www.bayut.com/property/details-123456.html
const BAYUT_REGEX = /https?:\/\/(www\.)?bayut\.com\/(for-sale|to-rent|property)\//i

// Property Finder listing URLs
// https://www.propertyfinder.ae/en/buy/apartment-for-sale-dubai-marina-123456.html
// https://www.propertyfinder.ae/en/rent/villa-for-rent-dubai-hills-estate-123456.html
const PF_REGEX = /https?:\/\/(www\.)?propertyfinder\.ae\//i

// Dubizzle listing URLs
// https://www.dubizzle.com/dubai/property-for-sale/residential/apartmentflat/...
const DUBIZZLE_REGEX = /https?:\/\/(www\.)?dubizzle\.com\/(.*\/)?property-for-(sale|rent)\//i
```

**Integration with existing clipboard watcher:**

The current `startClipboardWatcher()` in `clipboard.ts` checks for phone numbers (text up to 25 chars) and email addresses (text up to 80 chars). Property URLs are longer (80-300 chars). The current flow rejects text > 80 chars at line 102.

Suggested integration:
1. Clipboard changes (existing poll at 500ms)
2. **Before** the 80-char length gate: check if text matches any property URL regex
3. If match: emit `url:detected` event, skip phone/email detection
4. Existing phone/email flow unchanged for shorter text
5. If active contact: show "Share via WhatsApp" popup with contact name
6. If no active contact: show "Property link copied" notification (no action without recipient)

---

## MVP Recommendation

**Priority order for implementation:**

1. **Area Guides** -- Highest standalone value. Agents can use this immediately during calls without any contact context. No dependencies on other v1.2 features. Data already fully researched. Start with 10 community profiles and comparison view.

2. **Quick Calculators** -- High standalone value, pairs naturally with Area Guides (agent looks up an area, then calculates ROI for a property there). No dependencies. Pure client-side math. All formulas and parameters documented in this file.

3. **Activity Timeline** -- Requires intercepting existing action handlers. Should be built early in the milestone so it captures events from day one of agent usage. More infrastructure than user-facing, but builds trust over time.

4. **Voice Memo Transcription** -- Builds on existing Whisper infrastructure but requires careful extraction of the Web Worker and recording logic from the 729-line TranscriberView monolith. More complex integration than it appears at first glance.

5. **Property URL Quick-Share** -- Lowest complexity but also lowest standalone impact. Only useful when an agent has both an active contact AND a property URL in their clipboard -- a narrow intersection. Build last.

**Defer to v1.3 or later:**
- Additional area profiles beyond the initial 10
- Calculator history persistence across sessions
- Activity timeline search/filter/date range
- Voice memo auto-language detection (Whisper small multilingual model for Arabic/English mix)
- Property URL listing detail fetch (og:title)

---

## Complexity Assessment

| Feature | Estimated Effort | Risk Level | Notes |
|---------|-----------------|------------|-------|
| Area Guides -- data file + view | 4-6 hours | Low | Static data, familiar component pattern (like FlashcardView) |
| Area Guides -- comparison view | 2-3 hours | Low | Table layout with multi-select, highlight best values |
| Quick Calculators -- all 4 | 4-6 hours | Low | Pure math, no external dependencies, well-documented formulas |
| Activity Timeline -- logging infra | 3-4 hours | Med | Intercepting existing handlers without breaking them; store schema |
| Activity Timeline -- UI | 2-3 hours | Low | Collapsible section in ContactCard, familiar pattern |
| Voice Memo -- extraction + component | 4-6 hours | Med | Extracting Whisper/recording logic from TranscriberView monolith |
| Voice Memo -- OneNote integration | 1-2 hours | Low | Reuse GeneralNotes push path directly |
| Property URL detection | 2-3 hours | Low | Extend clipboard.ts, add regex, adjust length gate |
| Property URL share UI | 1-2 hours | Low | Popup similar to phone detection, reuse WhatsApp send |
| **Total** | **~23-35 hours** | **Low-Med** | 5-7 sessions at typical pace |

---

## Sources

### HIGH Confidence (Codebase analysis)
- Direct reading of `clipboard.ts` (130 lines), `ContactCard.tsx` (693+ lines), `TranscriberView.tsx` (729 lines), `GeneralNotes.tsx` (128 lines), `App.tsx` (797 lines), `store.ts` (270 lines), `types.ts` (129 lines), `onenote.ts` (475 lines), `contacts.ts` (80 lines), `ipc.ts` (317 lines)
- `.planning/research/area-data-cross-reference.md` -- verified area data with priority-ranked corrections
- `.planning/research/dubai-area-guides-research.md` -- 741 lines of researched community data from 45+ sources
- `.planning/PROJECT.md` -- validated v1.2 requirements

### HIGH Confidence (Official sources)
- [UAE Central Bank LTV regulations](https://rulebook.centralbank.ae/en/rulebook/regulations-regarding-mortgage-loans) -- LTV rules, max tenor, DBR caps
- [DLD fees via Property Finder 2026](https://www.propertyfinder.ae/blog/dld-fees-dubai/) -- 4% transfer, trustee AED 2,000/4,000, AED 580 title deed
- [DLD fees via Totality Estates 2026](https://totalityestates.com/blog/dubai-property-fees-charges-breakdown) -- corroborating fee structure
- [Dubai commission standards via Engel & Volkers](https://www.engelvoelkers.com/ae/en/resources/how-much-is-the-real-estate-agent-commission-in-dubai) -- 2% sales, 5% rentals, 50/50 split
- [Dubai mortgage rules 2025-2026 via West Gate](https://westgatedubai.com/dubai-mortgage-for-expats-2025-rates-ltv-required-salary/) -- expat LTV, rates
- [2026 UAE Mortgage Blueprint via Capital Zone](https://www.capitalzone.ae/the-2026-uae-mortgage-blueprint-navigating-interest-rates-rental-shifts-and-market-maturity/) -- EIBOR trends, rate outlook

### MEDIUM Confidence (Verified web research)
- [Real estate CRM features 2026 via iHomeFinder](https://www.ihomefinder.com/blog/agent-and-broker-resources/real-estate-crm-features-2026/) -- activity timeline is table stakes for CRMs
- [Voice-to-CRM patterns via Acto](https://www.heyacto.com/en/blog/voice-to-crm) -- voice note to structured CRM data workflow
- [Voice notes CRM real estate via Lead2Done](https://lead2done.com/voice-notes-crm-real-estate-productivity/) -- voice memo productivity patterns for agents
- [Area guide authoring via AgentFire](https://agentfire.com/blog/how-to-research-and-write-real-estate-area-guides/) -- area guide structure and content patterns
- [WhatsApp for real estate via Floorfy](https://blog.floorfy.com/en/real-estate-marketing-software/how-to-use-whatsapp-as-real-estate-agents) -- WhatsApp property sharing workflows
- [HouseMath.app calculator suite](https://housemath.app/) -- professional real estate calculator UX patterns
- [RealCalc Pro calculator](https://realcalcpro.com/) -- commission split and DTI calculator patterns

### LOW Confidence (needs validation at implementation time)
- Property portal URL regex patterns -- based on observed URL structures from search results, not official API documentation. Should be tested against 20+ real URLs before shipping.
- Voice memo 5-minute cap -- arbitrary, may need adjustment based on agent feedback
- Activity timeline 200-event cap -- arbitrary, may need tuning based on storage impact
