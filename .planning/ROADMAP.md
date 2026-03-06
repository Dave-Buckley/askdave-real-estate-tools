# Roadmap: Real Estate Agent Toolkit

## Milestones

- v1.0 MVP -- Phases 1-4 (shipped 2026-03-06) -- see milestones/v1.0-ROADMAP.md
- v1.1 Polish & Agent Tools -- Phases 5-7 (shipped 2026-03-06)
- v1.2 Agent Productivity -- Phases 8-12 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-4) - SHIPPED 2026-03-06</summary>

See milestones/v1.0-ROADMAP.md for full phase details.

- [x] **Phase 1: Foundation & Communication** - Desktop app shell, click-to-dial, click-to-WhatsApp, templates, clipboard detection
- [x] **Phase 2: Contact Intelligence** - OneNote integration, qualifying templates, follow-ups, caller recognition
- [x] **Phase 3: Forms, News & Web** - RERA/KYC forms, news feed, flashcards, landing page, installer
- [x] **Phase 4: Meeting Transcriber** - Phone mic via WiFi, desktop mic, local Whisper transcription

</details>

<details>
<summary>v1.1 Polish & Agent Tools (Phases 5-7) - SHIPPED 2026-03-06</summary>

- [x] **Phase 5: Form I Template Rewrites** - Rewrite all 4 Form I templates from client-facing to agent-to-agent commission split language
- [x] **Phase 6: General Notes** - Freeform note-taking in contact card with one-click push to OneNote
- [x] **Phase 7: Landing Page Update** - Update landing page to reflect v1.1 features

</details>

### v1.2 Agent Productivity (In Progress)

**Milestone Goal:** Give agents in-app reference tools (area guides, calculators), remove all client PII from local storage, add voice-to-OneNote workflow, and extend clipboard detection to property listing URLs.

- [ ] **Phase 8: Area Guides** - Dedicated view with 10 Dubai community profiles and side-by-side comparison
- [ ] **Phase 9: Quick Calculators** - Mortgage, commission split, ROI/yield, and DLD cost calculators with UAE-specific defaults
- [ ] **Phase 10: Client Data Removal** - Strip all client PII from local storage; app becomes a zero-data pass-through tool
- [ ] **Phase 11: Voice Memo** - Record voice note, transcribe locally via Whisper, push transcript to contact's OneNote page
- [ ] **Phase 12: Property Quick-Share** - Detect property listing URLs in clipboard and offer WhatsApp share

## Phase Details

### Phase 8: Area Guides
**Goal**: Agent can quickly look up Dubai community data and compare areas during client conversations
**Depends on**: Phase 7 (v1.1 complete)
**Requirements**: AREA-01, AREA-02, AREA-03
**Success Criteria** (what must be TRUE):
  1. Agent can open an Area Guides screen from the title bar and browse 10+ Dubai community profiles with key stats (price/sqft, yield, service charges, freehold status, metro access)
  2. Agent can select 2-3 communities and view them side-by-side with differences highlighted (best yield, lowest service charge)
  3. Every area guide displays a "data effective as of" date and source attribution so the agent knows the freshness of the data
  4. Agent can share a formatted area summary to a client via WhatsApp with one click
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: Quick Calculators
**Goal**: Agent can run common financial calculations with UAE-specific parameters during or after client calls
**Depends on**: Phase 8 (independent, but sequenced for orderly delivery)
**Requirements**: CALC-01, CALC-02, CALC-03, CALC-04
**Success Criteria** (what must be TRUE):
  1. Agent can calculate monthly mortgage payments with a resident/non-resident toggle that applies correct UAE Central Bank LTV limits
  2. Agent can calculate commission splits between cooperating agents with customizable percentages
  3. Agent can calculate ROI/yield on a property given purchase price and rental income (gross and net)
  4. Every calculator displays effective date, source reference for rates used, and an "estimates only" disclaimer
  5. Agent can copy a formatted calculation summary for pasting into WhatsApp
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

### Phase 10: Client Data Removal
**Goal**: App stores zero client PII on disk -- all contact data is transient session state, making the app a true pass-through tool
**Depends on**: Phase 9 (must stabilize contact model before Voice Memo builds on it)
**Requirements**: PRIV-02, PRIV-03, PRIV-04
**Success Criteria** (what must be TRUE):
  1. After closing the app, no client names, emails, phone numbers, or roles exist in any file on disk (electron-store, temp files, logs)
  2. Contact details entered during a session work for all actions (dial, WhatsApp, OneNote, templates) but are discarded on app close
  3. OneNote page lookups still work using only the E.164 phone number from clipboard detection (no local contact cache needed)
  4. Existing features that relied on persisted contact data (templates with {name}, OneNote page creation) continue to function via transient session state
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD

### Phase 11: Voice Memo
**Goal**: Agent can dictate a post-call voice note and have it transcribed and pushed to OneNote without typing
**Depends on**: Phase 10 (contact model must be stable; reuses OneNote push infrastructure)
**Requirements**: MEMO-01, MEMO-02, MEMO-03
**Success Criteria** (what must be TRUE):
  1. Agent can click a record button in the contact card, speak into their desktop microphone, and stop recording
  2. Recording is transcribed locally using Whisper AI (no audio or transcript leaves the device)
  3. Agent can review and edit the transcript before pushing, then push to the contact's OneNote page with a "[Voice memo - timestamp]" prefix
  4. No audio files or transcripts are persisted to disk at any point (fully ephemeral, UAE privacy compliant)
**Plans**: TBD

Plans:
- [ ] 11-01: TBD
- [ ] 11-02: TBD

### Phase 12: Property Quick-Share
**Goal**: Agent can share property listing links via WhatsApp as quickly as they share phone numbers today
**Depends on**: Phase 11 (modifies clipboard watcher core; built last to isolate regressions)
**Requirements**: SHARE-01, SHARE-02
**Success Criteria** (what must be TRUE):
  1. When agent copies a property listing URL from Bayut, Property Finder, or Dubizzle, a share bar appears (same UX as phone number detection)
  2. Agent can click "Share via WhatsApp" to open a WhatsApp chat with the listing URL pre-filled
  3. Property URL detection has its own toggle in settings (independent of phone number detection)
  4. Existing phone number and email clipboard detection continue to work exactly as before (no regressions)
**Plans**: TBD

Plans:
- [ ] 12-01: TBD

## Progress

**Execution Order:** Phase 8 -> Phase 9 -> Phase 10 -> Phase 11 -> Phase 12

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Communication | v1.0 | 3/3 | Complete | 2026-03-02 |
| 2. Contact Intelligence | v1.0 | 4/4 | Complete | 2026-03-04 |
| 3. Forms, News & Web | v1.0 | 4/4 | Complete | 2026-03-05 |
| 4. Meeting Transcriber | v1.0 | 3/3 | Complete | 2026-03-06 |
| 5. Form I Template Rewrites | v1.1 | 1/1 | Complete | 2026-03-06 |
| 6. General Notes | v1.1 | 2/2 | Complete | 2026-03-06 |
| 7. Landing Page Update | v1.1 | 1/1 | Complete | 2026-03-06 |
| 8. Area Guides | v1.2 | 0/? | Not started | - |
| 9. Quick Calculators | v1.2 | 0/? | Not started | - |
| 10. Client Data Removal | v1.2 | 0/? | Not started | - |
| 11. Voice Memo | v1.2 | 0/? | Not started | - |
| 12. Property Quick-Share | v1.2 | 0/? | Not started | - |
