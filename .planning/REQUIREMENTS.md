# Requirements: Real Estate Agent Toolkit

**Defined:** 2026-03-01
**Core Value:** Make every agent faster at the tasks they repeat hundreds of times a week -- calling, messaging, note-taking, and organizing -- without touching the CRM or creating security concerns.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Communication

- [x] **COMM-01**: Agent can highlight a phone number anywhere on screen and open it in the phone dialler (pre-filled, not auto-calling) with one click via tel: URI
- [x] **COMM-02**: Agent can highlight a phone number anywhere on screen and open a WhatsApp chat with one click, with the option to open on desktop (WhatsApp Web/Desktop) or on their phone
- [x] **COMM-03**: Agent can create, edit, and use reusable message templates with automatic contact name substitution for WhatsApp and email

### Contact Notes

- [x] **NOTE-01**: Tool auto-creates a new OneNote page per contact (keyed on normalized phone number) or navigates to an existing one
- [x] **NOTE-02**: OneNote pages are pre-filled with role-specific qualifying templates (tenant, landlord, buyer, seller, portfolio)
- [x] **NOTE-03**: A single contact can have multiple roles; templates adapt when a new role is added to an existing contact
- [ ] **NOTE-04**: Agent can jot property details into a quick notepad mid-call and push them to the contact's OneNote page with one button

### Organization

- [x] **ORG-01**: Agent can set a follow-up reminder (3, 15, or 30 days) that auto-creates a Google Calendar event for that contact
- [ ] **ORG-02**: Agent can create a viewing event from a contact and send a Google Calendar invite to the client
- [x] **ORG-03**: Agent can view and tick off a document checklist per client, configured by transaction type (tenancy, sale, renewal)

### Desktop App Core

- [x] **APP-01**: App runs in the system tray (Windows) or menu bar (macOS) with configurable global hotkeys for key actions
- [x] **APP-02**: App detects phone numbers on the clipboard and offers click-to-dial and click-to-WhatsApp actions
- [x] **APP-03**: App detects incoming call notifications via phone-link integration and offers to open the caller's OneNote page
- [x] **APP-04**: All phone numbers are normalized to UAE E.164 format (+971XXXXXXXXX) before any action
- [x] **APP-05**: App installs via clean installer (.exe for Windows, .dmg for macOS), requires no admin rights, starts on login, and auto-updates silently
- [x] **APP-06**: During setup or in settings, agent can enable/disable individual features so they only see what they want to use

### News & Info

- [x] **NEWS-01**: App displays a curated feed of UAE real estate news aggregated from key industry RSS sources

### Website

- [x] **WEB-01**: A simple instruction/marketing website explains the tool's features, shows how to install it, and provides download links

### Meeting Transcriber

- [x] **REC-01**: Agent clicks a mic icon in the title bar, scans a QR code on their phone, and audio is captured from the phone microphone via local WiFi
- [x] **REC-02**: Agent can pause and resume recording from the phone browser interface
- [x] **REC-03**: Recording state is visible in the desktop app (connection status, recording timer) while the phone browser shows recording controls
- [x] **TRANS-01**: After stopping the recording, the audio is transcribed to text automatically using local Whisper (no cloud, no cost)
- [x] **TRANS-02**: Transcribed text appears in the main window with a Copy All button for pasting into ChatGPT
- [x] **TRANS-03**: Transcript text is selectable for partial copy
- [x] **PRIV-01**: All audio and transcript data is fully ephemeral -- no audio or transcript saved to disk, no temp files, data discarded on navigation

## v1.1 Requirements

Requirements for v1.1 Polish & Agent Tools. Each maps to roadmap phases 5-7.

### Form I Templates

- [x] **FORMI-01**: All 4 Form I WhatsApp messages rewritten with agent-to-agent commission split language
- [x] **FORMI-02**: All 4 Form I email subjects and bodies rewritten with agent-to-agent language
- [x] **FORMI-03**: All 4 Form I descriptions updated to reflect agent-to-agent purpose

### General Notes

- [x] **NOTE-05**: User can type freeform notes in a text area within the contact card
- [x] **NOTE-06**: User can push notes to OneNote with one click (appends below existing page content)
- [x] **NOTE-07**: Textarea clears only after OneNote push confirms success
- [x] **NOTE-08**: Each push includes a timestamp header in OneNote for chronological log
- [x] **NOTE-09**: User sees success/error feedback after push (toast or inline indicator)

### Landing Page

- [x] **LAND-01**: Landing page updated with General Notes feature description
- [x] **LAND-02**: Landing page updated with agent-to-agent collaboration tools mention

## v1.2 Requirements

Requirements for v1.2 Agent Productivity. Each maps to roadmap phases 8-12.

### Area Guides

- [ ] **AREA-01**: Agent can view Dubai community profiles (10+ areas) from a dedicated screen in the title bar
- [ ] **AREA-02**: Agent can compare two or more communities side-by-side (price/sqft, yield, growth, property types)
- [ ] **AREA-03**: Each area guide displays a "data effective as of" date and source attribution

### Quick Calculators

- [ ] **CALC-01**: Agent can calculate monthly mortgage payment (principal, rate, term)
- [ ] **CALC-02**: Agent can calculate commission split between cooperating agents
- [ ] **CALC-03**: Agent can calculate ROI/yield on a property (purchase price, rental income)
- [ ] **CALC-04**: Each calculator displays effective date and source reference for rates used (DLD fees, LTV limits, etc.)

### Client Data Removal

- [ ] **PRIV-02**: App stores zero client PII locally -- no contact names, emails, phone numbers, or roles persisted to disk
- [ ] **PRIV-03**: Contact details entered during a session are ephemeral (RAM only)
- [ ] **PRIV-04**: OneNote page lookups work without local contact cache

### Voice Memo

- [ ] **MEMO-01**: Agent can record a short voice note after a call using their microphone
- [ ] **MEMO-02**: Voice note is transcribed locally using Whisper AI
- [ ] **MEMO-03**: Transcript is pushed to the contact's OneNote page with timestamp

### Property Quick-Share

- [ ] **SHARE-01**: App detects property listing URLs in clipboard (Bayut, Property Finder, Dubizzle)
- [ ] **SHARE-02**: Detected URL triggers a WhatsApp share button (same UX as phone number detection)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Communication Enhancements

- **COMM-04**: Agent can send an email and auto-trigger a WhatsApp message notifying the contact to check their inbox
- **COMM-05**: Agent can translate a composed email before sending via translation API

### General Notes Enhancements

- **NOTE-10**: Ctrl+Enter keyboard shortcut for pushing notes
- **NOTE-11**: Rich text or markdown support in notes textarea

### Form I Enhancements

- **FORMI-04**: Form I auto-fill with agent/brokerage details from settings

### Mobile

- **MOB-01**: Companion mobile app detects incoming calls and offers to open the caller's OneNote page
- **MOB-02**: Mobile callbacks widget showing today's follow-ups on the phone home screen

### Desktop Enhancements

- **APP-06**: Days-since-last-call counter displayed per contact

## v3+ Requirements

Deferred to future releases. Significant complexity or external dependencies.

### Signable Forms Platform

- **FORM-01**: Web platform for RERA form preparation (Form A, B, F) with agent and client detail input
- **FORM-02**: Digital signature capture compliant with UAE electronic transactions law
- **FORM-03**: Signed PDF generation and delivery

### Team Features

- **TEAM-01**: Team activity dashboard (calls, viewings, pipeline)
- **TEAM-02**: Agent leaderboard with gamified metrics

## Out of Scope

| Feature | Reason |
|---------|--------|
| CRM replacement | Tool works alongside existing CRM, not instead of it |
| Call logging / call tagging | CRM handles activity tracking |
| Data scraping from CRM or property portals | Security and compliance risk -- hard boundary |
| Area insights / market data | Sourcing involves scraping which isn't allowed |
| Built-in VoIP dialler | Agents use personal phones; tel: URI + Phone Link is correct |
| Bulk message sending | TDRA compliance risk; one-contact-at-a-time only |
| AI-generated listing descriptions | Out of product scope |
| Scrcpy / ADB phone mirroring | Requires USB debugging -- too technical and scary for agents |
| Cheque/currency calculators | Simple enough to do manually |
| Lead pipeline / deal tracker | CRM handles this |
| Commission tracker | CRM handles this |
| Daily briefing dashboard | Not needed |
| Local activity event logging | App stores no client data; OneNote timestamps are the activity record |
| Speaker diarization | Separate enhancement for future version |
| In-app meeting summaries / AI extraction | Agent uses ChatGPT externally for now |
| Saved transcript history / searchable archive | Explicitly out of scope (privacy) |
| Cloud transcription fallback | Conflicts with free/privacy requirements |
| Local note persistence / draft saving | OneNote is single source of truth -- app stores nothing locally |
| Note history in-app | OneNote IS the history -- no duplication |
| Two-way OneNote sync | Complexity far exceeds value for v1.1 |
| Form I override migration | Existing overrides mask new defaults by design; Reset button restores new text |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| APP-01 | Phase 1 | Complete |
| APP-02 | Phase 1 | Complete |
| APP-04 | Phase 1 | Complete |
| APP-05 | Phase 1 | Complete |
| APP-06 | Phase 1 | Complete |
| COMM-01 | Phase 1 | Complete |
| COMM-02 | Phase 1 | Complete |
| COMM-03 | Phase 1 | Complete |
| NOTE-01 | Phase 2 | Complete |
| NOTE-02 | Phase 2 | Complete |
| NOTE-03 | Phase 2 | Complete |
| NOTE-04 | Phase 2 | Pending |
| ORG-01 | Phase 2 | Complete |
| ORG-02 | Phase 2 | Pending |
| APP-03 | Phase 2 | Complete |
| ORG-03 | Phase 3 | Complete |
| NEWS-01 | Phase 3 | Complete |
| WEB-01 | Phase 3 | Complete |
| REC-01 | Phase 4 | Complete |
| REC-02 | Phase 4 | Complete |
| REC-03 | Phase 4 | Complete |
| TRANS-01 | Phase 4 | Complete |
| TRANS-02 | Phase 4 | Complete |
| TRANS-03 | Phase 4 | Complete |
| PRIV-01 | Phase 4 | Complete |

**v1 Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

### v1.1 Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FORMI-01 | Phase 5 | Complete |
| FORMI-02 | Phase 5 | Complete |
| FORMI-03 | Phase 5 | Complete |
| NOTE-05 | Phase 6 | Complete |
| NOTE-06 | Phase 6 | Complete |
| NOTE-07 | Phase 6 | Complete |
| NOTE-08 | Phase 6 | Complete |
| NOTE-09 | Phase 6 | Complete |
| LAND-01 | Phase 7 | Complete |
| LAND-02 | Phase 7 | Complete |

**v1.1 Coverage:**
- v1.1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0

### v1.2 Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AREA-01 | Phase 8 | Pending |
| AREA-02 | Phase 8 | Pending |
| AREA-03 | Phase 8 | Pending |
| CALC-01 | Phase 9 | Pending |
| CALC-02 | Phase 9 | Pending |
| CALC-03 | Phase 9 | Pending |
| CALC-04 | Phase 9 | Pending |
| PRIV-02 | Phase 10 | Pending |
| PRIV-03 | Phase 10 | Pending |
| PRIV-04 | Phase 10 | Pending |
| MEMO-01 | Phase 11 | Pending |
| MEMO-02 | Phase 11 | Pending |
| MEMO-03 | Phase 11 | Pending |
| SHARE-01 | Phase 12 | Pending |
| SHARE-02 | Phase 12 | Pending |

**v1.2 Coverage:**
- v1.2 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-06 -- v1.2 roadmap created, traceability added*
