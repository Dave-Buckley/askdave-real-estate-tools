# Domain Pitfalls

**Domain:** Adding area guides, quick calculators, activity timeline, voice memo transcription, and property URL detection to existing Electron desktop app (v1.2)
**Researched:** 2026-03-06
**Confidence:** HIGH (direct codebase analysis of store.ts, clipboard.ts, onenote.ts, TranscriberView.tsx, whisper-worker.ts, ipc.ts, types.ts, App.tsx, ContactCard.tsx, GeneralNotes.tsx, flashcards.ts, contacts.ts, plus web research on DLD fees, RERA rates, EIBOR/mortgage rates, electron-store limits, Whisper ONNX memory issues, and Dubai property portal URL patterns)

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or make the app worse than not having the feature.

### Pitfall 1: Activity timeline stored in electron-store grows unbounded until the JSON file chokes

**What goes wrong:**
The current `electron-store` instance (`src/main/store.ts`) serializes the entire `AppSettings` object -- including all contacts, templates, flashcard progress, and form overrides -- to a single `config.json` file on every write. Adding an activity timeline that auto-logs every call, WhatsApp send, form send, and note push creates unbounded growth. An active agent might generate 30-50 activity entries per day. After 6 months, that is 5,000-9,000 entries -- each with timestamps, contact info, and action metadata. The entire JSON file is rewritten synchronously on every `store.set()`. At scale, this causes: (1) visible UI lag on every action that triggers a log entry, (2) increasing app startup time as the full JSON is parsed, and (3) potential data corruption if the app crashes mid-write on a multi-megabyte file.

**Why it happens:**
electron-store is designed for settings and preferences (kilobytes), not for append-heavy event logs (megabytes). The existing contacts and flashcard progress data grow slowly -- contacts are created occasionally, flashcard progress is updated one card at a time. An activity timeline is fundamentally different: it is append-only, high-frequency, and never shrinks.

**Consequences:**
- App startup slows from <1s to 2-5s after months of use
- Every dial/WhatsApp click gains 10-50ms lag from synchronous JSON rewrite
- Potential data corruption if Electron crashes mid-write on a multi-MB file
- If timeline is in the same store as settings, corrupted config.json loses ALL user data (templates, contacts, flashcard progress)

**Prevention:**
1. Store the activity timeline in a **separate electron-store instance** using the `name` option: `new Store({ name: 'timeline', defaults: { entries: {} } })`. This creates a separate `timeline.json` file in `app.getPath('userData')`, isolating timeline data from the main `config.json`.
2. Implement a **rolling window**: keep only the last 90 days (or 500 entries, whichever is less) per contact. Prune on app startup and periodically during runtime.
3. Key timeline entries by contact e164, with each contact having an array capped at a maximum length (e.g., 100 entries per contact).
4. Consider **lazy loading**: only load a contact's timeline when their card is opened, not on app startup.
5. Add a `timelineVersion` field to the store schema so future migrations can restructure the data.

**Detection:**
- `config.json` growing past 1MB (check `app.getPath('userData')`)
- Perceptible lag when clicking "Dial" or "WhatsApp" (because the log write blocks)
- App startup taking more than 2 seconds
- Timeline entries mixed into the main `AppSettings` type

**Phase to address:** Activity Timeline -- design the storage strategy before writing a single line of logging code

---

### Pitfall 2: Calculator formulas hardcoded without effective date create liability when rates change

**What goes wrong:**
Dubai real estate fees change. DLD transfer fees, mortgage registration fees, agency commission norms, and service charge ranges are set by regulation and market practice. If the calculators embed specific numbers (4% DLD transfer fee, 2% commission, AED 4,000 trustee fee) without displaying when those numbers were last verified and what authority published them, agents will use stale figures in client conversations. This is worse than no calculator -- it gives false confidence. A client who pays the wrong deposit amount or budgets incorrectly based on app-provided numbers creates legal and reputational risk.

**Why it happens:**
Calculators feel like a "build once, done forever" feature. The developer hardcodes current rates during development, tests them, ships them, and moves on. But Dubai's rates have changed historically (service charges dropped 10-15% in some communities, LTV rules differ for residents vs non-residents, trustee fee thresholds exist at AED 500,000, EIBOR moved from ~4.5% to ~3.58% across 2025-2026 with three Central Bank rate cuts), and the calculator silently becomes wrong over time.

**Consequences:**
- Agent quotes wrong deposit amount to a client, bank rejects the application
- Commission calculation is off, deal falls apart at signing
- Agent loses credibility when client's own research contradicts the app's numbers
- Potential regulatory issues if the app is seen as providing unlicensed financial advice

**Prevention:**
1. Every calculator must display: **"Rates effective as of [DATE]. Source: [AUTHORITY]."** This is a hard requirement from the user's specification.
2. Store rate constants in a single, well-documented constants file (e.g., `src/shared/calculator-rates.ts`) -- NOT scattered across calculator components. Each constant gets a `lastVerified` date and `source` string.
3. Include a `RATES_LAST_VERIFIED` date that is displayed prominently on the calculator screen. When this date is more than 6 months old, show a warning badge.
4. For the mortgage calculator specifically: do NOT hardcode interest rates. Let the agent input the rate (banks offer different rates -- as of early 2026: Emirates NBD ~3.99%, ADCB ~4.25%, Mashreq ~4.10%, FAB ~4.20%). Only hardcode structural rules like LTV maximums (which are Central Bank regulated).
5. Commission calculator should default to 2% but allow the agent to change it -- commission is negotiable in practice.

**Detection:**
- Rate constants scattered across multiple component files
- No date or source attribution visible in the calculator UI
- Interest rates hardcoded instead of being user-input fields
- Calculator results presented without any disclaimer
- Test data using rates from the development date with no mechanism to update them

**Phase to address:** Quick Calculators -- define the rates architecture first, build UI second

---

### Pitfall 3: Whisper shared worker memory leak causes gradual degradation and eventual OOM crash

**What goes wrong:**
The existing meeting transcriber (`TranscriberView.tsx`) creates a Whisper Web Worker, loads the model, processes audio, and terminates the worker on cleanup. The voice memo feature needs the same Whisper pipeline. The natural solution is a shared, long-lived worker that loads the model once. But the ONNX Runtime Web has **documented memory leak issues** (GitHub: microsoft/onnxruntime#22271, huggingface/transformers.js#860): memory consumption grows continuously when running ONNX models numerous times, and GPU memory (when WebGPU is used) is not properly released between inference calls. In a long-lived shared worker that stays active across an entire work session, memory accumulates with each transcription until the Electron renderer process crashes from OOM. This is especially severe with WebGPU, where the current codebase attempts to use it (whisper-worker.ts line 40-49).

**Why it happens:**
The recommendation to share a single worker (Pitfall 3 in previous analysis) is correct in principle but misses the ONNX memory leak reality. The model loads correctly once, but each call to `transcriber(audio, ...)` (whisper-worker.ts line 81) leaks a small amount of memory. Over a full work day (8+ hours) with 10-20 voice memos plus potential meeting transcriptions, this accumulates to hundreds of MB.

**Consequences:**
- Memory usage climbs from ~300MB to 1GB+ over a work session
- Electron renderer eventually crashes with OOM, losing any unsaved state
- WebGPU acceleration makes the leak worse (14GB+ reported in Safari edge cases)
- CPU usage may stay elevated after inference completes (reported at 400%+ in some WebKit environments)

**Prevention:**
1. Create a shared Whisper service with a **worker lifecycle manager**: load the model on first use, but **terminate and recreate the worker after every N transcriptions** (e.g., every 5-10 jobs) to release leaked memory. Track a job counter in the service.
2. Implement a **memory pressure check**: before starting a new transcription, check `performance.memory` (if available) and if heap usage exceeds a threshold (e.g., 800MB), terminate and recreate the worker first.
3. Prefer **WASM over WebGPU** for the Whisper backend until the WebGPU memory leak (transformers.js#860) is resolved. WASM is slower but does not exhibit the same GPU memory leak. The current code already falls back to WASM (whisper-worker.ts line 36).
4. Implement a **lock/queue mechanism**: if a meeting transcription is in progress, voice memo requests queue until it completes. Show "Transcription in progress -- please wait" in the voice memo UI.
5. Add an **idle timeout**: if no transcription request arrives for 10 minutes, terminate the worker to free memory. Reload on next request.

**Detection:**
- Memory usage climbing steadily during a session (check via Electron's `process.getProcessMemoryInfo()`)
- App becoming sluggish after multiple voice memos in one session
- Electron crash with "out of memory" in the renderer process logs
- Worker not terminated between view switches

**Phase to address:** Voice Memo -- design the worker lifecycle management before building the voice memo UI. This affects the meeting transcriber too (TranscriberView.tsx will need to be updated to use the shared service).

---

### Pitfall 4: Property URL detection regex matching non-property URLs from the same domains

**What goes wrong:**
The clipboard watcher (`src/main/clipboard.ts`) currently detects phone numbers and emails. Adding URL detection for property listings means matching URLs from bayut.com, propertyfinder.ae, dubizzle.com, and similar portals. But these domains have many non-listing pages (search results, blog posts, agent profiles, area guides). A naive regex like `/bayut\.com/` would trigger the WhatsApp share popup on every Bayut URL the agent copies, including search results pages or their own agent profile link. This creates "popup fatigue" -- the agent starts ignoring all clipboard popups, including the phone number ones that are actually useful.

**Why it happens:**
Property portal URL patterns are complex and change over time. Each portal has a different URL structure:
- **Bayut**: `bayut.com/property/details-[ID].html` (listing) vs `bayut.com/for-sale/apartments/dubai/` (search)
- **Property Finder**: `propertyfinder.ae/en/plp/buy/[slug]-[ID].html` (listing) vs `propertyfinder.ae/en/search?...` (search)
- **Dubizzle**: `dubai.dubizzle.com/property-for-sale/residential/apartmentflat/[date]/[slug]-[ID]/` (listing) vs `dubai.dubizzle.com/property-for-sale/` (search)

A developer might use a broad domain match and deal with false positives later. But false positives in a clipboard watcher are extremely disruptive because they interrupt the agent's workflow.

**Consequences:**
- Agent gets popup fatigue and disables clipboard detection entirely
- Disabling clipboard detection loses the phone number detection feature (the app's core value)
- Agent copies a search results URL, popup appears, they share it to a client via WhatsApp -- client gets a useless link
- Portal URL structures change, breaking the regex silently

**Prevention:**
1. Match **listing page URL patterns specifically**, not just domains. Each portal has a distinct pattern for individual listings vs. search/browse pages.
2. Use a whitelist approach with specific regex patterns per portal:
   - Bayut: `/bayut\.com\/property\/details-\d+\.html/`
   - Property Finder: `/propertyfinder\.ae\/en\/plp\/(buy|rent)\/[\w-]+-\w+\.html/`
   - Dubizzle: `/dubai\.dubizzle\.com\/property-for-(sale|rent)\/.*\/\d+\//`
3. Test each regex against 10+ real URLs from each portal (listing pages AND non-listing pages) before shipping.
4. Add the URL detection as a **separate, opt-in toggle** in settings (`propertyUrlDetectionEnabled`) -- some agents may find it annoying. Keep it independent of the existing `clipboardEnabled` toggle.
5. Extend the existing clipboard watcher's 80-character limit check -- URLs can be longer. Add a separate URL-specific length check (up to ~300 chars).
6. Strip query parameters (UTM tags, agent tracking codes) from detected URLs before displaying or sharing.

**Detection:**
- Regex matches search result pages or blog posts
- No specific test suite for URL pattern matching
- URL detection not behind a feature toggle
- Clipboard watcher's existing 80-char limit (line 103 in clipboard.ts) silently blocking valid URLs

**Phase to address:** Property Quick-Share -- build and test the regex patterns before integrating with the clipboard watcher

---

### Pitfall 5: Area guides with static market data that becomes stale and misleading

**What goes wrong:**
The in-app area guides contain community profiles with data like average rents, sale prices, service charge ranges, and investment outlook. This data has a shelf life. Dubai's property market moves fast -- a community that was "affordable" six months ago may have seen 20% price increases. If the guides present specific price ranges or yield percentages as facts without any freshness indicator, agents will quote stale numbers to clients. This is worse than not having area guides at all, because it creates false confidence in bad data.

Critically, this problem already exists in the codebase. The flashcards (`src/shared/flashcards.ts`) contain hardcoded 2025 market data:
- `dubai-105`: "Average price per sqft in JVC in 2025: AED 1,469"
- `dubai-106`: "Average price per sqft in Dubai Marina in 2025: AED 2,188"
- `dubai-107`: "Average price per sqft in Downtown Dubai in 2025: AED 3,168"
- `dubai-109`: "Overall Dubai market average price per sqft in Q2 2025: AED 1,582"
- `dubai-117`: "Dubai-wide average rental yield for apartments in 2025: 7.1-7.3%"

These flashcard figures will directly contradict whatever numbers go into the area guides if both are not updated simultaneously. An agent studying flashcards that say JVC is AED 1,469/sqft while the area guide says AED 1,600/sqft (or vice versa) loses trust in both features.

**Why it happens:**
Area guides and flashcards were built as separate features with separate data. Nobody planned for the two data sets to stay in sync. Market data appears in two places with no shared source of truth.

**Consequences:**
- Agent quotes stale numbers to a client, loses credibility
- Flashcards and area guides contradict each other, undermining trust in both features
- No mechanism to update market data without a code change and app release
- Agent uses the app as a reference in front of a client, client checks Property Finder and sees different numbers

**Prevention:**
1. Separate **structural data** (community description, lifestyle, nearby landmarks, developer info) from **market data** (price ranges, yields, service charges). Structural data is stable; market data is volatile.
2. Display a **"Last updated: [DATE]"** timestamp on every area guide page. This is non-negotiable.
3. For market data, include the **source** (DLD transaction data, RERA service charge index, CBRE/JLL reports).
4. Use **ranges rather than specific numbers** where possible. "1BR rent: AED 50,000-80,000/year" ages better than "1BR rent: AED 65,000/year."
5. Build a **shared market data constants file** (`src/shared/market-data.ts`) that both the area guides and the flashcards can reference. Single source of truth. When market data is updated, both features reflect the change.
6. Build the data structure to make updates easy: typed TypeScript interfaces with `lastUpdated` and `source` fields, so missing fields cause compile errors.
7. Consider a **data freshness warning**: if the `lastUpdated` date is more than 6 months old, show a subtle warning like "Market data may be outdated" on the guide.

**Detection:**
- Price data embedded directly in JSX/TSX component code rather than in a data file
- No `lastUpdated` field in the area guide data structure
- Area guide market data and flashcard market data are different values for the same community
- Specific price figures presented without ranges
- No source attribution for market statistics
- Structural data and market data mixed in the same object without clear separation

**Phase to address:** Area Guides -- design the data schema with freshness tracking before populating content. Consider updating the flashcard data to reference the shared market data file.

---

## Moderate Pitfalls

Mistakes that cause significant rework or UX degradation but are recoverable without a rewrite.

### Pitfall 6: Clipboard watcher conflicts between phone detection and URL detection

**What goes wrong:**
The current clipboard watcher (`clipboard.ts`) has a 500ms polling interval and specific ordering: check for phone number first (text under 25 chars), then check for email (text under 80 chars). Adding URL detection changes the flow. A property listing URL is 80-250+ characters long, well beyond the current 80-character cutoff at line 103. If the URL contains a phone number (some listing URLs include agent phone numbers as query params), the phone detection could fire instead of the URL detection. Conversely, if the URL check runs before phone check, a short text that looks like both a phone number and part of a URL creates ambiguity.

**Prevention:**
1. Increase the max text length check for the URL detection path specifically. Keep the 25-char limit for phone-only detection and the 80-char limit for email, but add a 300-char path for URL detection.
2. Detection priority should be: phone (short text, <25 chars) -> email (<80 chars) -> URL (up to ~300 chars). This preserves the existing behavior -- phone and email detection are unchanged.
3. URL detection should ONLY match if the full clipboard text is a URL (starts with `http` or `https`). Do NOT try to extract URLs from longer text blocks -- that is the `selection.ts` flow, not the clipboard watcher.
4. Reuse the existing suppression mechanism (`suppressDetection()`) for URL detection -- after the user shares a property URL, suppress for the same period as phone actions.

**Detection:**
- The 80-character cutoff (`trimmed.length > 80` at line 103) blocking URL detection
- URL detection interfering with existing phone/email detection behavior
- No clear priority ordering between the three detection types
- URL detection running on partial clipboard text (extracting from paragraphs)

**Phase to address:** Property Quick-Share -- modify clipboard.ts carefully to extend, not break, existing detection

---

### Pitfall 7: Activity timeline logging creating performance drag on every user action

**What goes wrong:**
If every dial, WhatsApp open, form send, and note push synchronously logs to the timeline store, each user action now has two operations: the action itself AND the timeline write. The existing actions (dial, WhatsApp, etc.) are near-instant. Adding a synchronous `store.set()` call (which writes the entire JSON to disk) turns every action into a 10-50ms delay. Over dozens of actions per hour, this creates a perceptible "heaviness" to the app.

**Prevention:**
1. Use **fire-and-forget async logging**: the action completes and returns to the user immediately. The timeline entry is queued and written in the next event loop tick.
2. **Batch writes**: accumulate timeline entries in memory and flush to disk every 5-10 seconds, or when the batch reaches 10 entries, whichever comes first. This reduces I/O from 50 writes/hour to 5-10 writes/hour.
3. If using a separate electron-store instance (per Pitfall 1), the write only serializes the timeline data, not the full settings object.
4. Never block the IPC response on the timeline write. The pattern should be: `ipcMain.on('action:dial', (_, e164) => { openDialler(e164); logActivity(e164, 'dial').catch(() => {}) })` -- note the `.catch(() => {})` ensuring the fire-and-forget doesn't create unhandled rejections.

**Detection:**
- `await logActivity(...)` in the synchronous action handlers (e.g., `ipcMain.on('action:dial')`)
- Timeline write happening inside the same `store.set()` call as other settings
- User-perceptible delay when clicking Dial or WhatsApp buttons that didn't exist before timeline was added

**Phase to address:** Activity Timeline -- implement async batch logging from the start

---

### Pitfall 8: Calculator not handling UAE-specific off-plan vs secondary market fee differences

**What goes wrong:**
Dubai real estate fees differ significantly between off-plan and secondary (ready) market transactions. The 4% DLD transfer fee applies to both, but registration fees diverge sharply:
- **Off-plan (Oqood)**: AED 40 + 5% VAT
- **Secondary (ready), property under AED 500K**: AED 2,000 + 5% VAT
- **Secondary (ready), property over AED 500K**: AED 4,000 + 5% VAT
- **Admin fee**: AED 580 (apartments/offices), AED 430 (land), AED 40 (off-plan)

Additionally, mortgage rules differ: off-plan properties typically use developer payment plans (40/60, 50/50, post-handover), not bank mortgages. A mortgage calculator that does not distinguish between off-plan and ready properties will produce wrong results for one category.

LTV rules also differ by residency:
- Resident, first property under AED 5M: 80% LTV max
- Resident, first property over AED 5M: 70% LTV max
- Resident, second+ property: 65% LTV max
- Non-resident: 50-60% LTV max (varies by bank)

If the calculator uses a single generic flow without distinguishing property type and residency status, the output will be wrong for most scenarios.

**Prevention:**
1. Add a **property type toggle** (off-plan / ready) at the top of any fee calculator. This determines which fee structure applies.
2. Add a **resident/non-resident toggle** to the mortgage calculator. This is the single most important input field after property price.
3. When off-plan is selected, show a note that financing typically uses developer payment plans, not traditional bank mortgages. Offer a payment plan calculator (percentage splits) instead of mortgage amortization.
4. Display the specific fee breakdown, not just the total. Show each line item (4% DLD, registration fee, admin fee, mortgage registration if applicable) so the agent can explain it to the client.
5. Include the source: "DLD fee schedule per Dubai Land Department" with the effective date.
6. Interest rate must be a user INPUT field, not hardcoded -- bank rates vary from 3.85% to 5.75% as of early 2026.

**Detection:**
- Single fee calculation path with no off-plan/ready distinction
- Single LTV percentage field with no residency context
- LTV defaulting to 80% for all scenarios
- Off-plan and ready property treated identically
- No breakdown of individual fee line items

**Phase to address:** Quick Calculators -- build the property type and residency toggles into the calculator from day one

---

### Pitfall 9: Voice memo copying triggers clipboard detection and Whisper hallucinates on short/silent audio

**What goes wrong (clipboard):**
After a voice memo is transcribed, the natural UX is a "Copy" button. The clipboard watcher is always running. If the transcript contains a phone number (agents mention phone numbers constantly), the clipboard watcher will detect it and trigger the contact popup, interrupting the agent mid-workflow.

**What goes wrong (hallucination):**
Voice memos are typically 10-60 seconds -- much shorter than meeting transcriptions. Whisper has documented hallucination issues with short audio, especially when there are silences at the beginning or end. Common hallucinated text includes "Thanks for watching", "Subscribe to my channel", and "Subtitles by the Amara.org community" -- text from Whisper's training data on video subtitles. Silent sections in a voice memo (agent pausing to think) can trigger these hallucinations, producing garbage text that gets pushed to OneNote.

**Prevention (clipboard):**
1. Use `setSkipNextClipboardChange()` (already exists in `clipboard.ts`, used by `panel:copy-number` at line 67-69 in ipc.ts) before writing the transcript to the clipboard.
2. The copy action should go through IPC to the main process so it can call `setSkipNextClipboardChange()` before `clipboard.writeText()`.
3. Do NOT use `navigator.clipboard.writeText()` from the renderer -- this bypasses the skip flag.

**Prevention (hallucination):**
1. Implement **Voice Activity Detection (VAD)** before sending audio to Whisper. SileroVAD is the recommended approach -- it yields significant reduction in hallucinations compared to beam search or silence threshold adjustments.
2. At minimum, trim leading and trailing silence from the audio buffer before transcription. Silences at the beginning and end are the primary hallucination trigger.
3. Set a **minimum audio duration** (e.g., 2 seconds of speech detected by VAD). If the voice memo is too short or contains no detected speech, show "No speech detected" instead of passing silence to Whisper.
4. After transcription, apply a **hallucination filter**: reject results that contain known hallucination phrases ("thanks for watching", "subscribe", "amara.org", etc.).
5. Show the transcript to the agent for review before pushing to OneNote -- never auto-push without confirmation.

**Detection:**
- Voice memo "Copy" button using `navigator.clipboard.writeText()` instead of the IPC path
- Copying a transcript that contains "+971 50 123 4567" and seeing the phone popup appear
- Transcribing a 5-second voice memo and getting "Thanks for watching" in the output
- Silent voice memos producing multi-sentence hallucinated text

**Phase to address:** Voice Memo -- wire copy through IPC and add VAD/hallucination filtering

---

### Pitfall 10: Area guides comparison feature creating a confusing layout in the existing panel width

**What goes wrong:**
The app runs as a frameless panel window. The existing ContactCard already has dense sections. If the area guides feature adds a "compare two communities side-by-side" layout, the panel width (likely 400-500px in normal use) cannot accommodate two data-rich columns. Text wraps, numbers misalign, and the comparison becomes harder to read than viewing each community separately.

**Prevention:**
1. Design the comparison as a **stacked vertical layout** or a **single-column table** with communities as rows and metrics as columns, not side-by-side full profiles.
2. Show only 4-6 key metrics in comparison mode (avg rent, avg sale price, service charge, ROI, walkability score). Not the full community profile.
3. Use color-coded indicators (green/red arrows or badges) to show which community is higher/lower for each metric.
4. Test the layout at the panel's default width (not maximized) before committing to a design.
5. Limit comparison to 2-3 communities maximum.

**Detection:**
- Side-by-side CSS grid or flexbox with two equal columns
- Community comparison requiring horizontal scrolling
- Design that only works when the window is maximized
- Trying to compare more than 3 communities at once

**Phase to address:** Area Guides -- prototype the comparison layout at the panel's default width

---

### Pitfall 11: View type proliferation in App.tsx making navigation unmaintainable

**What goes wrong:**
The current `App.tsx` (797 lines) uses a `View` type union with 8 values: `'main' | 'template-editor' | 'template-preview' | 'hotkeys' | 'role-template-editor' | 'form-editor' | 'education' | 'transcriber'`. Adding area guides, calculators, and voice memo brings this to 11+ view types. Each view gets its own `if (view === '...')` block with TitleBar and content. Adding 3 more view blocks pushes past 900 lines and makes the navigation flow hard to trace.

**Prevention:**
1. Area guides and calculators should be **new View values** (necessary for TitleBar and back-button behavior), but component content should be in separate files -- matching the existing pattern of `FlashcardView` and `TranscriberView`.
2. Keep each new view's `if` block in App.tsx thin: TitleBar + wrapper div + single component render. No business logic in App.tsx.
3. Voice memo does NOT need a separate view -- it should be a sub-feature of the contact card (mic icon in the General Notes section, matching the existing ephemeral pattern).
4. Add Area Guides as a TitleBar nav icon (MapPin) next to Education (BookOpen), keeping the nav pattern consistent.

**Detection:**
- App.tsx growing past 900 lines
- Business logic (calculator formulas, guide data processing) appearing in App.tsx
- More than 3 new state variables added to the App component
- View switching logic becoming nested (views within views)

**Phase to address:** All phases -- each new feature's view block should be minimal in App.tsx

---

## Minor Pitfalls

Mistakes that are quick to fix but easy to overlook.

### Pitfall 12: RERA service charge data in area guides presented as fixed when it varies by building

**What goes wrong:**
Service charges in Dubai are set per building/community, not per area. Within Dubai Marina, service charges range from AED 12-18/sqft depending on the specific tower. Presenting a single number ("Dubai Marina: AED 15/sqft") misleads agents into quoting a specific figure when talking to a client about a specific building.

**Prevention:**
1. Always present service charges as **ranges per community**, not specific numbers.
2. Link to the RERA Service Charge Index (published annually by DLD) as the source.
3. Note that service charges are reviewed annually via the Mollak system and the DLD publishes updated indices each year.

**Phase to address:** Area Guides -- data population

---

### Pitfall 13: Calculator disclaimer omission creating legal exposure

**What goes wrong:**
If the app says "Your mortgage payment will be AED X/month" without a disclaimer, the agent could be seen as providing unlicensed financial advice under UAE financial regulations.

**Prevention:**
1. Add disclaimer on every calculator output: "Estimates only. Consult your bank/broker for exact figures."
2. Frame area guide investment outlook descriptively ("Historical yields have ranged from X-Y%") not prescriptively ("This is a good investment").
3. Include source and date on all financial figures.

**Phase to address:** Quick Calculators -- add disclaimer to the UI from the first implementation

---

### Pitfall 14: Voice memo audio persisted to disk creating a privacy/legal risk

**What goes wrong:**
Audio recordings of client conversations sitting in temp files are a privacy risk under UAE Decree-Law No. 34/2021 (regarding personal data protection). The existing meeting transcriber processes audio in-memory without writing to disk. Voice memo must follow the same pattern.

**Prevention:**
1. Process audio in-memory only. Never write audio to disk.
2. Delete Float32Array buffers immediately after Whisper processes them.
3. Same approach as the existing meeting transcriber -- audio lives in `chunksRef` (memory) and is passed directly to the worker.

**Phase to address:** Voice Memo -- enforce from the start

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Area Guides | Stale market data contradicting flashcard data | Create shared market-data.ts, update both features from one source |
| Area Guides | Side-by-side comparison unreadable at panel width | Use stacked/table layout, test at default panel width |
| Area Guides | Service charges presented as fixed per area | Use ranges, cite RERA Service Charge Index |
| Quick Calculators | Rates hardcoded without dates/sources | Centralized rates file with lastVerified and source fields |
| Quick Calculators | No off-plan vs ready distinction in fees | Property type toggle determines fee structure |
| Quick Calculators | Mortgage LTV wrong for non-residents | Resident/non-resident toggle with Central Bank LTV rules |
| Quick Calculators | No financial disclaimer | Add "Estimates only" disclaimer on every calculator output |
| Activity Timeline | Unbounded growth in electron-store | Separate store instance (name: 'timeline'), rolling window, batch writes |
| Activity Timeline | Synchronous logging blocking user actions | Fire-and-forget async logging, batch writes every 5-10s |
| Activity Timeline | Raw action strings in UI | Human-readable entries with relative timestamps |
| Voice Memo | Double Whisper model load with meeting transcriber | Shared worker with lifecycle management and memory leak mitigation |
| Voice Memo | Hallucination on short/silent audio | VAD preprocessing, minimum duration check, hallucination filter |
| Voice Memo | Clipboard copy triggering phone detection | Route copy through IPC with setSkipNextClipboardChange() |
| Voice Memo | Audio files persisted to disk | In-memory processing only, matching existing transcriber pattern |
| Property Quick-Share | Broad URL regex causing popup fatigue | Listing-specific URL patterns per portal, separate feature toggle |
| Property Quick-Share | 80-char clipboard limit blocking URLs | Add separate URL length check path (up to 300 chars) |
| Property Quick-Share | Portal URL structures changing over time | Regex patterns in a maintainable config, not inline in clipboard.ts |

## Integration Gotchas

| Integration Point | Common Mistake | Correct Approach |
|-------------------|----------------|------------------|
| Clipboard watcher (URL detection) | Adding URL check inside the existing 80-char length guard | Add a separate length check path for URLs (up to ~300 chars) that runs after phone and email checks, preserving existing detection behavior |
| Clipboard watcher (copy suppression) | Using `navigator.clipboard.writeText()` in renderer for voice memo/transcript copy | Route all clipboard writes through IPC to main process so `setSkipNextClipboardChange()` fires before the write (pattern: `panel:copy-number` at line 67 of ipc.ts) |
| Whisper Web Worker (shared instance) | Creating a new worker per feature/component | Create one shared worker service that loads the model once, but terminates/recreates every N transcriptions to mitigate ONNX memory leaks |
| Whisper Web Worker (memory) | Keeping the worker alive indefinitely across a full work day | Implement idle timeout (10 min) and periodic recycling to combat ONNX Runtime memory leak (microsoft/onnxruntime#22271) |
| OneNote COM API (voice memo notes) | Building a new OneNote push path for voice memo transcripts | Reuse the existing `pushNotesToOneNote()` function in onenote.ts -- voice memo transcripts are just timestamped notes, same as General Notes |
| electron-store (timeline data) | Mixing timeline entries into the main AppSettings store schema | Create a separate store instance: `new Store({ name: 'timeline', defaults: { entries: {} } })` -- uses the `name` option to create a separate JSON file |
| TitleBar navigation | Adding too many nav icons, making the title bar crowded | Area Guides icon (MapPin) fits naturally next to Education (BookOpen). Calculators are context-dependent (within contact card). Voice memo belongs in the General Notes section of ContactCard. |
| Activity timeline (IPC) | Creating a new IPC handler for every logged action type | Add a single `timeline:log` handler that accepts `{ e164, action, metadata, timestamp }` -- all action types use the same handler |
| Market data (flashcards vs guides) | Two separate data sources for the same market statistics | Create a shared market-data.ts constants file that both features import |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous timeline logging on every action | 10-50ms delay on dial/WhatsApp clicks | Fire-and-forget async logging with batch writes | Immediately noticeable after ~100 logged actions |
| Loading full timeline on app startup | Startup time increases from <1s to 2-5s | Lazy-load timeline only when contact's timeline view opens | After 1-2 months of active use (~1000+ entries) |
| Area guide data parsed on every render | Sluggish area guide navigation | Parse data once on mount, memoize with `useMemo` | With 10+ community profiles |
| Whisper model loaded twice | RAM spikes to 1GB+, possible OOM | Single shared worker with lifecycle management | On machines with 8GB RAM or less |
| Whisper worker alive all day (memory leak) | Gradual RAM growth, eventual OOM crash | Periodic worker recycling every 5-10 transcriptions | After 10+ transcriptions in one session |
| URL regex on every clipboard poll (500ms) | CPU usage increase, battery drain | Only run URL regex if text starts with `http` prefix check | Always -- runs 2x per second |
| Full electron-store rewrite on timeline entry | Disk I/O spikes, corruption risk | Separate store + batch writes | After store exceeds 500KB |

## Security and Legal Considerations

| Concern | Risk | Prevention |
|---------|------|------------|
| Voice memo audio persisted to disk | TDRA/privacy risk (UAE Decree-Law No. 34/2021) | In-memory processing only, delete buffers after Whisper processes them |
| Calculator results implying financial advice | Unlicensed financial advice liability | Add "Estimates only" disclaimer on every calculator output |
| Area guide investment language | "Strong buy opportunity" = financial advice | Use descriptive language, not prescriptive. Include source and date. |
| Timeline storing property-client associations | Competitive intelligence risk if device is shared | Store only action type, contact e164, and timestamp -- not property details or URLs |
| Property URL with agent tracking params | Agent's referral codes leaked to clients | Strip query parameters from detected URLs before sharing |
| Whisper hallucination pushed to OneNote | False information in client records | Show transcript for review before pushing, never auto-push |

## "Looks Done But Isn't" Checklist

- [ ] **Area Guides:** Every community profile has a `lastUpdated` date visible in the UI
- [ ] **Area Guides:** Market data (prices, yields, service charges) has source attribution
- [ ] **Area Guides:** Data is in a separate data file, not inlined in TSX components
- [ ] **Area Guides:** Market data is consistent with flashcard market data (shared source)
- [ ] **Area Guides:** Service charges shown as ranges, not single values per community
- [ ] **Area Guides:** Comparison works at the panel's default width without horizontal scrolling
- [ ] **Area Guides:** Compare mode limits to max 3 communities
- [ ] **Calculators:** Every calculator shows "Rates effective as of [DATE]. Source: [AUTHORITY]"
- [ ] **Calculators:** Off-plan vs ready property toggle exists with correct fee structure per type
- [ ] **Calculators:** Mortgage calculator has resident/non-resident toggle with correct LTV limits
- [ ] **Calculators:** Interest rate is a user INPUT field, not hardcoded
- [ ] **Calculators:** Results include disclaimer text ("Estimates only. Consult your bank for exact figures.")
- [ ] **Calculators:** Commission calculator allows custom percentage (not locked to 2%)
- [ ] **Calculators:** Rate constants are in a single file with `lastVerified` dates, not scattered in components
- [ ] **Calculators:** Fee breakdown shows individual line items (DLD 4%, registration, admin, mortgage reg)
- [ ] **Timeline:** Timeline entries stored in a SEPARATE electron-store instance (`name: 'timeline'`), not in main config.json
- [ ] **Timeline:** Rolling window implemented (max 90 days or N entries per contact)
- [ ] **Timeline:** Logging is async/fire-and-forget, does not block user actions
- [ ] **Timeline:** Entries are human-readable ("Called Ahmed at 2:32 PM"), not raw action strings
- [ ] **Timeline:** Timeline supports filtering by action type
- [ ] **Voice Memo:** Uses shared Whisper worker service with lifecycle management (periodic recycling)
- [ ] **Voice Memo:** Audio is processed in-memory only, never written to disk
- [ ] **Voice Memo:** VAD preprocessing trims silence before sending to Whisper
- [ ] **Voice Memo:** Hallucination filter rejects known garbage phrases
- [ ] **Voice Memo:** Transcript shown for review before OneNote push (never auto-push)
- [ ] **Voice Memo:** Copy button routes through IPC with `setSkipNextClipboardChange()`
- [ ] **Voice Memo:** Cannot conflict with active meeting transcription (lock/queue)
- [ ] **Voice Memo:** Transcript auto-fills the General Notes textarea for OneNote push
- [ ] **Property URL:** Regex matches ONLY listing pages, not search/browse/blog/profile pages
- [ ] **Property URL:** Tested against 10+ real URLs per portal (Bayut, Property Finder, Dubizzle) including non-listing URLs
- [ ] **Property URL:** Detection is behind its own feature toggle in settings
- [ ] **Property URL:** Clipboard watcher's 80-char limit does not block URL detection
- [ ] **Property URL:** Query parameters stripped before sharing (no agent tracking codes leaked)
- [ ] **Property URL:** Copy suppression works when sharing a URL via WhatsApp (no re-detection)
- [ ] **General:** App.tsx view blocks for new features are thin (TitleBar + component, no business logic)
- [ ] **General:** New IPC handlers registered in ipc.ts AND exposed in preload/index.ts AND typed in electronAPI interface
- [ ] **General:** All new features have corresponding settings toggles where appropriate

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Timeline in main config.json (unbounded) | MEDIUM (2-4 hrs) | Create separate store, migrate existing entries, delete from main store |
| Calculator rates hardcoded without dates | MEDIUM (1-2 hrs) | Extract to rates file, add lastVerified/source, update UI |
| Whisper model loaded twice (two workers) | HIGH (4-6 hrs) | Refactor TranscriberView.tsx (729 lines) and voice memo to share worker service |
| Whisper worker memory leak (no recycling) | MEDIUM (2-3 hrs) | Add job counter, periodic worker termination/recreation, idle timeout |
| URL regex too broad (popup fatigue) | LOW (30 min) | Tighten regex to listing-specific patterns, test against real URLs |
| Area guide data stale after 6 months | LOW (1-2 hrs/cycle) | Update the data file, change lastUpdated dates |
| Flashcard/guide data contradiction | MEDIUM (3-4 hrs) | Create shared market-data.ts, update both flashcards.ts and guides to import from it |
| Timeline logging blocking actions | LOW (30 min) | Change synchronous store.set() to async fire-and-forget with batch writes |
| Voice memo clipboard copy triggering phone | LOW (10 min) | Add setSkipNextClipboardChange() before clipboard write (single line) |
| Calculator wrong LTV for non-residents | LOW (30 min) | Add residency toggle, update LTV defaults |
| No off-plan/ready distinction in fees | MEDIUM (1-2 hrs) | Add property type toggle, implement separate fee calculation paths |
| Whisper hallucination on short audio | MEDIUM (2-3 hrs) | Add VAD preprocessing (SileroVAD), hallucination phrase filter |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Timeline unbounded growth | Activity Timeline | Separate `timeline.json` exists in userData. Main config.json has no timeline entries. |
| Calculator rates without dates | Quick Calculators | Every calculator screen shows date and source. Rates file has lastVerified dates. |
| Calculator missing off-plan/ready | Quick Calculators | Property type toggle changes fee structure. Off-plan shows Oqood fees. |
| Calculator wrong LTV | Quick Calculators | Resident/non-resident toggle changes LTV defaults per Central Bank rules. |
| Whisper worker conflict/memory leak | Voice Memo | One shared worker service exists. Job counter tracks recycling. Idle timeout terminates worker. |
| Whisper hallucination on short audio | Voice Memo | VAD preprocessing exists. Hallucination filter rejects known phrases. |
| URL regex false positives | Property Quick-Share | Test suite with 30+ URLs per portal. All non-listing URLs rejected. |
| Area guide stale data | Area Guides | lastUpdated field exists. UI displays it. 6-month warning logic exists. |
| Flashcard/guide data sync | Area Guides | Shared market-data.ts exists. Both features import from it. |
| Clipboard watcher integration | Property Quick-Share | Existing phone/email detection unchanged. URL triggers only on full URLs starting with https. |
| Timeline logging performance | Activity Timeline | No await on timeline log calls. Batch write mechanism exists. |
| Voice memo clipboard conflict | Voice Memo | Copy uses IPC with setSkipNextClipboardChange(). Manual test: copy transcript with phone, no popup. |
| Comparison layout | Area Guides | Comparison tested at default panel width (~450px). No horizontal scroll. |
| App.tsx view proliferation | All phases | App.tsx under 900 lines. Each view block is TitleBar + component only. |

## Sources

**Direct codebase analysis:**
- `src/main/store.ts` -- electron-store with AppSettings type, synchronous JSON writes, current schema
- `src/main/clipboard.ts` -- polling (500ms), 80-char cutoff (line 103), 25-char phone limit (line 106), `setSkipNextClipboardChange()`, `suppressDetection()`
- `src/main/ipc.ts` -- IPC handler patterns, `panel:copy-number` with `setSkipNextClipboardChange()` at line 67-69
- `src/main/onenote.ts` -- COM API via PowerShell, `pushNotesToOneNote()`, `buildNotesAppendScript()`, `runPowerShell()` with 30s timeout
- `src/main/contacts.ts` -- `upsertContact()`, `getContact()`, store-backed CRUD
- `src/renderer/panel/workers/whisper-worker.ts` -- WebGPU/WASM detection (line 36-50), model loading, `transcriber()` call (line 81), chunked transcription
- `src/renderer/panel/components/TranscriberView.tsx` -- Worker lifecycle, model loading, 729 lines, cleanup terminating worker
- `src/renderer/panel/App.tsx` -- 797 lines, 8-value View union, TitleBar nav icons
- `src/renderer/panel/components/GeneralNotes.tsx` -- ephemeral textarea, push-to-OneNote pattern
- `src/shared/types.ts` -- AppSettings, Contact, WhisperModelId, TranscriberState interfaces
- `src/shared/flashcards.ts` -- hardcoded 2025 market data (price/sqft for JVC, Marina, Downtown; rental yields; growth rates)

**Web research (MEDIUM-HIGH confidence, multiple sources agree):**
- [DLD Fees 2026 Guide - Driven Properties](https://www.drivenproperties.com/blog/property-service-charges-dubai) -- 4% transfer fee, registration fee tiers, off-plan Oqood AED 40
- [DLD Fees 2025 Guide - Property Stellar](https://www.propertystellar.com/blog/dld-registration-fees-explained-for-new-buyers-in-dubai-2025/) -- fee breakdowns, admin fees
- [Dubai Property Fees 2026 - Totality Estates](https://totalityestates.com/blog/dubai-property-fees-charges-breakdown) -- off-plan vs secondary differences
- [UAE Mortgage Rates 2026 - Capital Zone](https://www.capitalzone.ae/revealed-the-banks-offering-the-lowest-mortgage-rates-in-the-uae-2026-updated-list/) -- bank-specific rates (Emirates NBD ~3.99%, ADCB ~4.25%, Mashreq ~4.10%)
- [EIBOR and Mortgage Impact 2025 - Haider Mortgage](https://haidermortgage.ae/2025/09/12/how-uae-central-bank-rates-and-eibor-impact-your-mortgage-in-2025/) -- EIBOR trends, Central Bank rate cuts
- [RERA Service Charge Index 2026 - DXBInteract](https://dxbinteract.com/service-charges-dubai) -- AED 10-30/sqft, annual DLD review via Mollak
- [Whisper Hallucination on Silent Audio - OpenAI Discussion #1606](https://github.com/openai/whisper/discussions/1606) -- hallucination on non-speech, known phrases
- [Calm-Whisper: Reduce Hallucination - arXiv](https://arxiv.org/html/2505.12969v1) -- VAD as mitigation, hallucination triggers
- [ONNX Runtime Memory Leak - Issue #22271](https://github.com/microsoft/onnxruntime/issues/22271) -- memory grows with repeated model runs
- [Transformers.js WebGPU Memory Leak - Issue #860](https://github.com/huggingface/transformers.js/issues/860) -- severe GPU memory leak in Whisper pipeline
- [electron-store Multiple Instances - Issue #48](https://github.com/sindresorhus/electron-store/issues/48) -- using `name` option for separate JSON files
- [electron-store Maximum Data Size - Issue #55](https://github.com/sindresorhus/electron-store/issues/55) -- no hard limit but performance degrades with large JSON

---
*Pitfalls research for: v1.2 Agent Productivity features (area guides, calculators, activity timeline, voice memo, property URL detection)*
*Researched: 2026-03-06*
