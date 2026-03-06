# Project Research Summary

**Project:** Real Estate Agent Toolkit v1.2 -- Agent Productivity Features
**Domain:** Electron desktop app feature iteration (UAE real estate productivity tool)
**Researched:** 2026-03-06
**Confidence:** HIGH

## Executive Summary

v1.2 adds five features to a shipped, stable Electron desktop app (v1.0 MVP: 102 commits, 9,905 LOC; v1.1: General Notes + Form I). The features -- Area Guides, Quick Calculators, Activity Timeline, Voice Memo to OneNote, and Property Quick-Share -- require zero new npm dependencies. Every capability is achievable with the existing stack (Electron 34, React 19, TypeScript, Tailwind v4, electron-store, @huggingface/transformers, ws) plus built-in browser and Node.js APIs. The researchers unanimously confirm this. Two features (Area Guides, Calculators) are fully renderer-side with no IPC needed. Two (Voice Memo, Property Quick-Share) extend proven patterns from v1.0/v1.1. One (Activity Timeline) is cross-cutting but architecturally straightforward.

**Critical user decisions override parts of the research:** (1) The Activity Timeline is simplified -- no local activity logging in electron-store, no action interception. OneNote timestamps on pushed notes ARE the chronological record. The researchers' suggestions about ActivityEntry arrays and electron-store storage are rejected. (2) Zero client PII stored in the app. Contact names, emails, and roles currently in electron-store must be removed in v1.2. The app is a pass-through tool -- all client data lives in OneNote, Google Calendar, and other external tools. The only acceptable local storage is settings/config, message templates, flashcard progress, form overrides, area guide static data, and calculator reference data. This is a foundational architectural change that must be addressed before or alongside the five feature builds.

The recommended approach is to build the two independent, renderer-only features first (Area Guides, then Calculators), tackle the client data removal as its own phase, then build Voice Memo and Property Quick-Share. The primary risks are: stale area guide data without visible freshness dates (solved by schema design), calculator formulas without effective dates creating agent liability (solved by a centralized rates file), and property URL regex matching non-listing pages causing popup fatigue (solved by listing-specific patterns and a feature toggle). The Whisper worker reuse for Voice Memo is medium complexity but follows proven patterns.

## Key Findings

### Recommended Stack

No stack changes whatsoever. See [STACK.md](./STACK.md) for the full feature-by-feature analysis and 11 alternatives that were considered and rejected.

**Core technologies (all shipped, all retained):**
- **Electron ^34 + electron-vite ^5:** Desktop shell and build -- no changes
- **React ^19 + TypeScript ^5.7 + Tailwind v4:** All five features are React components with Tailwind styling
- **electron-store ^9:** Settings, templates, flashcard progress, form overrides, calculator reference data -- remains the persistence layer for non-PII data only
- **@huggingface/transformers + whisper-worker.ts:** Voice Memo reuses the existing Whisper Web Worker from TranscriberView
- **Built-in APIs:** `Intl.NumberFormat` for AED formatting, `navigator.mediaDevices` for voice recording, `URL` constructor for property URL validation, standard math for all calculators

**What NOT to add (all rejected with rationale):** Chart.js, financial math libraries, SQLite, IndexedDB, Redux/Zustand, map libraries, URL shorteners, metadata scrapers, date pickers.

### Expected Features

See [FEATURES.md](./FEATURES.md) for the complete landscape with complexity assessments and UAE-specific parameters.

**Must have (table stakes):**
- Area Guides: 10 Dubai community profiles with price/sqft, yield, service charges, metro, freehold status, side-by-side comparison (2-3 areas), "effective as of" date
- Quick Calculators: Mortgage (with UAE Central Bank LTV rules, resident/non-resident toggle), Commission (2% default, customizable split), ROI/Yield (gross vs net), DLD cost breakdown -- all with effective date and source reference
- Activity Timeline (SIMPLIFIED): Timestamps on notes pushed to OneNote serve as the activity record. OneNote IS the chronological log. No local event logging.
- Voice Memo: Record desktop mic (30s-5min), transcribe via Whisper, review/edit, push to OneNote with "[Voice memo - timestamp]" prefix
- Property Quick-Share: Detect Bayut/PropertyFinder/Dubizzle listing URLs in clipboard, offer WhatsApp share with pre-filled message

**Should have (differentiators):**
- Area comparison with highlighted best values per row (highest yield, lowest service charge)
- Calculator "copy summary" button for client-facing WhatsApp messages
- Voice memo auto-timestamp prefix distinguishing dictated vs typed notes
- Area guide "share with client" formatted WhatsApp message
- Property URL detection behind its own settings toggle (independent of phone detection)

**Defer (v1.3+):**
- Additional area profiles beyond 10
- Calculator history persistence across sessions
- Voice memo auto-language detection
- Property URL listing detail fetch (og:title scraping)
- Activity timeline search/filter (not applicable -- OneNote handles this)
- Map integration for area guides
- Multi-currency calculator

**New v1.2 requirement (user decision):**
- Remove all client PII from electron-store (contact names, emails, roles). The app stores NO client data locally. This is the app's USP and must be treated as a first-class architectural change.

### Architecture Approach

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed integration designs, data structures, and component boundaries.

The app follows Electron's three-process model with a single frameless panel window. View routing uses a `View` union type in App.tsx. Area Guides and Calculators are new top-level views following the exact FlashcardView/TranscriberView pattern -- title bar button, standalone view, back navigation. Voice Memo is an inline component in ContactCard near General Notes. Property Quick-Share extends the existing clipboard watcher in clipboard.ts.

**Major components:**
1. **AreaGuideView.tsx (new)** -- Static data view with list/detail/compare modes. Imports data from `shared/area-guides.ts`. No IPC. ~400-500 lines.
2. **CalculatorView.tsx (new)** -- Tabbed calculator (Mortgage/Commission/ROI/DLD). Pure renderer-side math. No IPC. ~300-400 lines.
3. **VoiceMemo.tsx (new)** -- Compact recorder in ContactCard. Reuses Whisper worker and pushNotesToOneNote. ~250-350 lines.
4. **clipboard.ts (modified)** -- Extended with property URL detection. Whitelist of portal domains + listing-specific path patterns. New `onUrlDetected` callback.
5. **App.tsx (modified)** -- Two new View types, two title bar buttons (MapPin, Calculator), URL detection handler. Kept thin -- all logic in subcomponents.
6. **ContactCard.tsx (modified)** -- VoiceMemo section added. Activity Timeline section NOT added (OneNote is the record). Contact PII fields removed from display/persistence.

**Key architectural decision (user override):** Activity Timeline does NOT store events in electron-store. No `ActivityEntry` type, no `addActivity()` function, no IPC interception of action handlers. The timestamp on each pushed note in OneNote IS the timeline. This dramatically simplifies what was the most cross-cutting feature in the research, reducing it to a non-feature from an architecture standpoint. The researchers' Activity Timeline architecture (types.ts changes, contacts.ts functions, ipc.ts interceptors, separate store instance) is entirely rejected.

**Key architectural decision (user override):** Zero client PII in electron-store. The `Contact` type loses `name`, `email`, `roles`, and any other PII fields. The only contact identifier retained is the E.164 phone number (needed for action routing), and it is transient session state, not persisted. This is a breaking change to the data model that must be planned carefully.

### Critical Pitfalls

See [PITFALLS.md](./PITFALLS.md) for the full list of 11 pitfalls with prevention strategies.

**Note:** Several pitfalls identified by researchers relate to the Activity Timeline's electron-store storage strategy. Since the user has rejected local activity logging entirely, Pitfalls 1 (unbounded timeline growth) and 7 (logging performance drag) are no longer applicable. Pitfall 3 (Whisper worker conflict) remains relevant for Voice Memo.

1. **Calculator rates without effective dates create liability** -- Every calculator must display "Rates effective as of [DATE]. Source: [AUTHORITY]." Store all rate constants in a single `calculator-rates.ts` file with `lastVerified` dates. Interest rates must be user-input fields, not hardcoded. Add "Estimates only" disclaimer. Phase: Calculators.

2. **Whisper worker double-load for Voice Memo + Transcriber** -- If both create independent workers, the model loads twice (~200-400MB each). For v1.2, accept this: Voice Memo creates its own worker on demand, loads when recording starts, unloads when done. Simultaneous use is unlikely. Consider shared worker in v1.3 if memory becomes an issue. Phase: Voice Memo.

3. **Property URL regex matching non-listing pages** -- Naive domain matching (e.g., `/bayut\.com/`) triggers the share popup on search results, blog posts, and agent profiles. Use listing-specific URL path patterns per portal. Test against 10+ real URLs per portal. Put detection behind its own settings toggle. Phase: Property Quick-Share.

4. **Area guide data becoming stale and misleading** -- Static market data (prices, yields, service charges) has a shelf life of 3-6 months. Every guide must show "Last updated: [DATE]" and source attribution. Use ranges, not specific numbers. Separate structural data (lifestyle, landmarks) from volatile market data. Phase: Area Guides.

5. **Clipboard watcher length limit blocks URL detection** -- The current 80-character cutoff in clipboard.ts silently rejects property URLs (typically 100-300 chars). URL detection must run with its own length threshold (up to 500 chars) after the existing phone/email checks. Detection priority: phone (<=25 chars) -> email (<=80 chars) -> URL (<=500 chars). Phase: Property Quick-Share.

## Implications for Roadmap

Based on combined research and user override decisions, the v1.2 milestone should be structured as five phases. The client data removal is a new phase not in the original research scope but is critical to the app's identity.

### Phase 1: Area Guides

**Rationale:** Highest standalone value. Zero dependencies on other v1.2 features. Static data (already researched in 741-line `dubai-area-guides-research.md`). Renderer-only -- no IPC, no data model changes. Establishes the pattern for new top-level views.

**Delivers:** Dedicated Area Guides view accessible from title bar (MapPin icon), 10 Dubai community profiles with key stats, side-by-side comparison of 2-3 areas, "effective as of" date display, source disclaimer footer.

**Addresses features:** Community profiles (table stakes), comparison UI (table stakes), freehold/metro/yield stats (table stakes), effective date (table stakes), highlight best values in comparison (differentiator), "share with client" WhatsApp button (differentiator).

**Avoids pitfalls:** Stale data (schema includes `lastUpdated` field, displayed in UI). Comparison layout at narrow panel width (use stacked vertical or compact table, not side-by-side columns). Data in separate TS file, not inlined in JSX.

**New files:** `src/shared/area-guides.ts` (~600 lines), `src/renderer/panel/components/AreaGuideView.tsx` (~400-500 lines).
**Modified files:** `App.tsx` (new View type + title bar button).

### Phase 2: Quick Calculators

**Rationale:** High standalone value. Pairs naturally with Area Guides (agent looks up an area, calculates ROI). Pure renderer-side math -- no IPC, no data model changes, no external APIs. Independent of all other phases.

**Delivers:** Calculator view accessible from title bar (Calculator icon) with tabs for Mortgage, Commission, ROI/Yield, and DLD Cost Breakdown. UAE-specific defaults (Central Bank LTV rules, RERA commission standards, DLD fees). Effective date and source reference on every calculator. Resident/non-resident toggle on mortgage. "Copy summary" button for client-facing messages.

**Addresses features:** Mortgage calculator with UAE rules (table stakes), commission calculator (table stakes), ROI/yield (table stakes), DLD cost breakdown (table stakes), effective date display (table stakes), copy summary (differentiator).

**Avoids pitfalls:** Rates without dates (centralized `calculator-rates.ts` with `lastVerified`). Wrong LTV for non-residents (resident/non-resident toggle from the start). No disclaimer (mandatory "Estimates only" text). Interest rate hardcoded (user-input field, not fixed value).

**New files:** `src/shared/calculator-defaults.ts` (~50-80 lines), `src/renderer/panel/components/CalculatorView.tsx` (~300-400 lines).
**Modified files:** `App.tsx` (new View type + title bar button).

### Phase 3: Client Data Removal (Zero PII)

**Rationale:** This is a new v1.2 requirement from the user, not in the original feature list. The app's USP is that it stores NO client data locally. Contact names, emails, and roles currently persisted in electron-store must be removed. This is a data model change that affects ContactCard rendering, template placeholders, and OneNote page naming. It must be done before or alongside features that touch the contact model (Voice Memo depends on contact context for OneNote push).

**Delivers:** All client PII removed from electron-store persistence. Contact data becomes transient session state derived from clipboard detection and selection grabs. Templates and OneNote pages continue to work via E.164 phone number routing. The app becomes a true pass-through tool.

**Addresses requirements:** Zero client data storage (new v1.2 requirement, core to app identity and marketing).

**Avoids pitfalls:** Data model migration issues (plan the Contact type refactor before building features that depend on it). Template placeholder breakage (ensure `{name}` still works via transient session data, not persisted data).

**Modified files:** `src/shared/types.ts` (Contact type simplification), `src/main/contacts.ts` (remove persistence of PII fields), `src/main/store.ts` (remove contacts from store schema), `ContactCard.tsx` (derive display data from session state), `App.tsx` (contact state management).

### Phase 4: Voice Memo to OneNote

**Rationale:** Depends on the contact model being stable (Phase 3). Builds on proven Whisper and OneNote infrastructure from v1.0/v1.1. Medium complexity due to audio processing extraction, but all patterns exist in TranscriberView.tsx already.

**Delivers:** Compact voice recorder inline in ContactCard (near General Notes). Desktop mic only (no phone flow). Record, transcribe via Whisper, review/edit in textarea, push to OneNote with "[Voice memo - timestamp]" prefix. Model loads on demand, cached after first download.

**Addresses features:** Voice memo recording (table stakes), Whisper transcription (table stakes), review before push (table stakes), auto-timestamp prefix (differentiator).

**Avoids pitfalls:** Whisper worker double-load (accept separate worker for v1.2, consider shared worker in v1.3). Voice memo clipboard copy triggering phone detection (route copy through IPC with `setSkipNextClipboardChange()`). Audio persisted to disk (process in-memory only, never write to disk -- UAE privacy law compliance).

**New files:** `src/renderer/panel/components/VoiceMemo.tsx` (~250-350 lines), `src/renderer/panel/utils/audio.ts` (~30-50 lines, shared audio conversion utility).
**Modified files:** `ContactCard.tsx` (add VoiceMemo section).

### Phase 5: Property Quick-Share

**Rationale:** Lowest standalone impact but cleanest scope. Extends the clipboard watcher -- a sensitive piece of infrastructure -- so building it last isolates regressions. Benefits from all other features being stable.

**Delivers:** Property listing URL detection in clipboard for Bayut, Property Finder, and Dubizzle. Quick-share bar with "Share via WhatsApp" button. Feature toggle in settings (independent of phone detection). URL detection integrated into selection hotkey (Ctrl+Space) as well.

**Addresses features:** URL detection for property portals (table stakes), WhatsApp share (table stakes), settings toggle (differentiator).

**Avoids pitfalls:** Regex false positives (listing-specific path patterns, not domain-only). Clipboard watcher length limit (separate URL path with 500-char threshold). Existing phone/email detection broken (URL check runs AFTER phone and email, preserving existing behavior). Popup fatigue (own toggle, dismiss button).

**New IPC:** `url:detected` (main -> renderer).
**Modified files:** `src/main/clipboard.ts`, `src/main/selection.ts`, `src/main/index.ts`, `src/preload/index.ts`, `App.tsx`.

### Phase Ordering Rationale

- **Area Guides first** -- zero dependencies, highest standalone value, establishes the new-view pattern for Calculators. Static data already researched.
- **Calculators second** -- also zero dependencies, pairs with Area Guides, pure math. Both Phase 1 and 2 could theoretically be built in parallel.
- **Client Data Removal third** -- must happen before Voice Memo because Voice Memo interacts with the contact model (OneNote push needs contact context). Getting the Contact type right before building features on top of it prevents rework.
- **Voice Memo fourth** -- depends on stable contact model (Phase 3) and reuses OneNote push from v1.1. Medium complexity but all patterns exist.
- **Property Quick-Share last** -- modifies clipboard watcher core, which is the app's primary input mechanism. Build it last so any regressions are isolated. Lowest impact if cut.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Client Data Removal):** This was NOT researched by the four researcher agents (it is a post-research user decision). Needs careful analysis of how removing persisted contacts affects template placeholder resolution, OneNote page naming, the selection hotkey flow, and ContactCard state management. Consider running `/gsd:research-phase` for this phase.
- **Phase 4 (Voice Memo):** The audio processing extraction from TranscriberView.tsx (736 lines) needs careful planning. The shared-vs-separate worker decision has memory implications. Research is adequate but implementation planning needs attention.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Area Guides):** Well-documented pattern (same as FlashcardView). Data already researched. Static renderer-only component.
- **Phase 2 (Calculators):** Pure math, standard form inputs. UAE-specific parameters are fully documented in FEATURES.md.
- **Phase 5 (Property Quick-Share):** Extends clipboard.ts with a third detection type. Pattern is clear from existing phone/email detection. Regex patterns documented in STACK.md and PITFALLS.md.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All findings from direct codebase analysis with line numbers. Zero new dependencies. Every integration point verified against source code. 11 alternatives evaluated and rejected with rationale. |
| Features | HIGH | Feature landscape covers all 5 v1.2 features with table stakes, differentiators, and anti-features. UAE-specific parameters (LTV rules, DLD fees, commission standards) verified against official sources. |
| Architecture | HIGH | Integration designs verified against existing patterns. Component boundaries, file creation/modification lists, and build order all derived from source code analysis. Data structures typed. |
| Pitfalls | HIGH | 11 pitfalls identified from direct code analysis. Critical pitfalls have concrete prevention strategies and recovery costs. However, several pitfalls (1, 7) are no longer applicable due to user's Activity Timeline simplification. |

**Overall confidence:** HIGH

### Gaps to Address

- **Client Data Removal impact analysis:** The researchers did not anticipate the zero-PII requirement. The full impact on template placeholders (`{name}` resolution), OneNote page creation/naming, the selection hotkey's `ExtractedContact` flow, and the `contacts.ts` persistence layer needs mapping before implementation. This is the biggest gap in the current research.

- **Activity Timeline simplified scope:** The researchers designed a full event logging system. The user wants only OneNote timestamps as the activity record. This means the Activity Timeline is effectively a non-feature from a code standpoint -- no new components, no new IPC handlers, no new types. The "Activity Timeline" section in ContactCard is removed from the roadmap. Verify that existing General Notes timestamps in OneNote are sufficient.

- **Voice Memo and contact context after PII removal:** Voice Memo pushes transcripts to a contact's OneNote page. After removing persisted contacts, the flow needs to work with transient session state (E.164 from clipboard + any name detected). Verify that `pushNotesToOneNote` can operate with just E.164 and optional transient name data.

- **Property URL regex validation:** Patterns are based on observed URL structures, not official API documentation. Need to test against 10+ real URLs per portal at implementation time. URL structures may have changed since research date.

- **Comparison layout at panel width:** No prototype exists yet. The comparison view must work at the panel's default width (~400-500px). Stacked vertical layout is recommended over side-by-side columns, but this needs validation during implementation.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `clipboard.ts` (131 lines), `selection.ts` (185 lines), `ContactCard.tsx` (714 lines), `TranscriberView.tsx` (736 lines), `GeneralNotes.tsx` (128 lines), `App.tsx` (797 lines), `store.ts` (270 lines), `types.ts` (129 lines), `onenote.ts` (475 lines), `contacts.ts` (81 lines), `ipc.ts`, `preload/index.ts`, `whisper-worker.ts` (99 lines)
- `.planning/research/dubai-area-guides-research.md` (741 lines, 10 communities, 45+ sources)
- `.planning/research/area-data-cross-reference.md` (priority-ranked corrections)
- PROJECT.md validated requirements and constraints
- MEMORY.md project state and user preferences

### Secondary (MEDIUM confidence)
- [UAE Central Bank LTV regulations](https://www.finnxstar.com/maximum-loan-to-value-ltv-in-dubai/) -- 80%/85% LTV rules, 25-year max tenor
- [DLD transfer fee structure](https://egsh.ae/insights/mortgage-registration-explained-dubai) -- 4% transfer, 0.25% mortgage registration
- [Dubai commission standards](https://www.engelvoelkers.com/ae/en/resources/how-much-is-the-real-estate-agent-commission-in-dubai) -- 2% sales, 5% rentals
- [Bayut area guides format](https://www.bayut.com/area-guides/) -- community profile data fields
- [electron-store GitHub](https://github.com/sindresorhus/electron-store) -- JSON persistence characteristics
- Property portal URL patterns: Bayut, Property Finder, Dubizzle (observed structures, not official API docs)

### Tertiary (LOW confidence)
- Property URL regex patterns -- based on URL observation, not portal API documentation. Needs validation at implementation time.
- Voice memo 5-minute cap -- arbitrary, may need adjustment based on agent feedback.

---
*Research completed: 2026-03-06*
*Ready for roadmap: yes*
