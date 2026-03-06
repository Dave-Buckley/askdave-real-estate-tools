# Roadmap: Real Estate Agent Toolkit

## Milestones

- v1.0 MVP -- Phases 1-4 (shipped 2026-03-06) -- see milestones/v1.0-ROADMAP.md
- v1.1 Polish & Agent Tools -- Phases 5-7 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-4) - SHIPPED 2026-03-06</summary>

See milestones/v1.0-ROADMAP.md for full phase details.

- [x] **Phase 1: Foundation & Communication** - Desktop app shell, click-to-dial, click-to-WhatsApp, templates, clipboard detection
- [x] **Phase 2: Contact Intelligence** - OneNote integration, qualifying templates, follow-ups, caller recognition
- [x] **Phase 3: Forms, News & Web** - RERA/KYC forms, news feed, flashcards, landing page, installer
- [x] **Phase 4: Meeting Transcriber** - Phone mic via WiFi, desktop mic, local Whisper transcription

</details>

### v1.1 Polish & Agent Tools (In Progress)

**Milestone Goal:** Ship the deferred General Notes notepad with push-to-OneNote, fix Form I templates for agent-to-agent use, and update the landing page.

- [x] **Phase 5: Form I Template Rewrites** - Rewrite all 4 Form I templates from client-facing to agent-to-agent commission split language
- [x] **Phase 6: General Notes** - Freeform note-taking in contact card with one-click push to OneNote
- [ ] **Phase 7: Landing Page Update** - Update landing page to reflect v1.1 features

## Phase Details

### Phase 5: Form I Template Rewrites
**Goal**: Form I templates communicate agent-to-agent commission split terms instead of client-facing language
**Depends on**: Phase 4 (v1.0 complete)
**Requirements**: FORMI-01, FORMI-02, FORMI-03
**Success Criteria** (what must be TRUE):
  1. When user sends a Form I WhatsApp message, the text uses agent-to-agent commission split language (not client-facing)
  2. When user sends a Form I email, the subject and body use agent-to-agent language
  3. Form I entries in the forms list show descriptions reflecting agent-to-agent purpose
  4. Existing placeholder tokens ({name}, {unit}, etc.) still substitute correctly in the rewritten templates
**Plans**: Completed via quick task (1 plan)

Plans:
- [x] 05-01: Rewrite Form I templates to agent-to-agent commission split language

### Phase 6: General Notes
**Goal**: Agent can capture freeform notes during a call and push them to the contact's OneNote page
**Depends on**: Phase 5
**Requirements**: NOTE-05, NOTE-06, NOTE-07, NOTE-08, NOTE-09
**Success Criteria** (what must be TRUE):
  1. User sees a text area in the contact card where they can type freeform notes
  2. User clicks a push button and the notes appear in the contact's OneNote page below existing content
  3. Textarea clears only after OneNote confirms the push succeeded (no data loss on failure)
  4. Each pushed note appears in OneNote with a timestamp header, creating a chronological log
  5. User sees a success or error indicator after the push completes
**Plans**: 2 plans

Plans:
- [x] 06-01-PLAN.md -- OneNote push-notes backend (IPC + PowerShell script + preload bridge)
- [x] 06-02-PLAN.md -- GeneralNotes.tsx component + ContactCard mount + App.tsx wiring

### Phase 7: Landing Page Update
**Goal**: Landing page accurately describes the full v1.1 feature set
**Depends on**: Phase 6
**Requirements**: LAND-01, LAND-02
**Success Criteria** (what must be TRUE):
  1. Landing page includes a section describing the General Notes feature
  2. Landing page mentions agent-to-agent collaboration tools (Form I)
**Plans**: 1 plan

Plans:
- [ ] 07-01-PLAN.md -- General Notes feature card, Area Guides trim, docs sync

## Progress

**Execution Order:** Phase 5 -> Phase 6 -> Phase 7

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Communication | v1.0 | 3/3 | Complete | 2026-03-02 |
| 2. Contact Intelligence | v1.0 | 4/4 | Complete | 2026-03-04 |
| 3. Forms, News & Web | v1.0 | 4/4 | Complete | 2026-03-05 |
| 4. Meeting Transcriber | v1.0 | 3/3 | Complete | 2026-03-06 |
| 5. Form I Template Rewrites | v1.1 | 1/1 | Complete | 2026-03-06 |
| 6. General Notes | v1.1 | 2/2 | Complete | 2026-03-06 |
| 7. Landing Page Update | v1.1 | 0/1 | Not started | - |
