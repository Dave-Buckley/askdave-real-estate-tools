# Roadmap: Real Estate Agent Toolkit

## Overview

Three phases that deliver a working, distributable cross-platform desktop productivity tool for UAE real estate agents. Phase 1 ships a usable, demo-able product from day one — agents install the app and immediately can open any phone number in their dialler or WhatsApp with one click, and send templated messages. Phase 2 wires up OneNote and Google Calendar, completing the core daily workflow loop (communicate, document, follow up). Phase 3 finishes the remaining productivity features and ships the instruction website. Phase 4 adds a meeting transcriber for hands-free note capture. The app runs on both Windows and macOS. Mobile is covered through existing apps (OneNote, Google Calendar) in v1, with a dedicated companion app planned for v2.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (1.1, 2.1): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Core App + Communication** - Cross-platform Electron app with installer, system tray, hotkeys, click-to-dial, click-to-WhatsApp, message templates, clipboard detection
- [x] **Phase 2: Notes and Calendar Integration** - OneNote per-contact pages with role templates, Google Calendar reminders and viewings, inbound caller recognition (completed 2026-03-02)
- [x] **Phase 3: Secondary Features and Website** - Document checklists, UAE real estate news feed, and instruction/download website (completed 2026-03-03)
- [ ] **Phase 4: Meeting Transcriber** - Record client meetings via phone microphone over local WiFi, transcribe locally with Whisper, ephemeral transcript with Copy All for ChatGPT workflow

## Phase Details

### Phase 1: Core App + Communication
**Goal**: Agents install the app and immediately have a usable tool — they can open any phone number in their dialler or WhatsApp with one click, and send templated messages with auto-filled names. Works on Windows and macOS. This is the demo-able product.
**Depends on**: Nothing (first phase)
**Requirements**: APP-01, APP-02, APP-04, APP-05, APP-06, COMM-01, COMM-02, COMM-03
**Success Criteria** (what must be TRUE):
  1. Agent installs the app via clean installer (.exe on Windows, .dmg on macOS) with no admin rights required and no security warnings
  2. App appears in the system tray (Windows) or menu bar (macOS) on login without the agent having to start it manually
  3. Agent can configure at least one global hotkey that triggers a visible action from any application
  4. All phone numbers processed by the app are normalized to +971 E.164 format before any action is taken
  5. App silently downloads and applies an update without the agent doing anything
  6. Agent highlights a phone number anywhere on screen and it opens in the phone dialler (pre-filled, not auto-calling) with one click
  7. Agent highlights a phone number anywhere on screen and opens a WhatsApp chat — with the option to open on desktop (WhatsApp Web/Desktop) or on their phone
  8. Agent copies a phone number and immediately sees a popup offering dial and WhatsApp actions without pressing any hotkey
  9. Agent selects a message template, types or selects a contact name, and the template fills in automatically before sending
  10. The React UI panel opens from the tray and shows current contact card, communication actions, and template picker in a single view
  11. Agent can enable/disable individual features during setup or in settings, so they only see what they want to use
**Plans**: 5 plans
Plans:
- [ ] 01-01-PLAN.md -- Project scaffold, shared types, electron-store with default templates
- [ ] 01-02-PLAN.md -- Main process services: tray, clipboard, phone normalization, hotkeys, actions, IPC, auto-update
- [ ] 01-03-PLAN.md -- Tray panel UI: phone input, contact card, template list, preview, CRUD
- [ ] 01-04-PLAN.md -- Clipboard popup floating action bar + settings window (toggles, hotkey recorder, WhatsApp mode)
- [ ] 01-05-PLAN.md -- Build config: electron-builder NSIS/DMG, entitlements, notarize script

### Phase 2: Notes and Calendar Integration
**Goal**: Agents can document every call in a structured OneNote page and set follow-up reminders and viewing bookings in Google Calendar — the full communicate-document-follow-up loop is complete
**Depends on**: Phase 1
**Requirements**: NOTE-01, NOTE-02, NOTE-03, NOTE-04, ORG-01, ORG-02, APP-03
**Success Criteria** (what must be TRUE):
  1. Agent opens a contact and the app auto-creates or navigates to a OneNote page keyed on that contact's normalized phone number
  2. New OneNote pages are pre-filled with the correct qualifying template (tenant, landlord, buyer, seller, or portfolio) based on the contact's role
  3. When a contact has multiple roles, the agent can add a second role and the OneNote page updates to include that role's template section alongside the existing ones
  4. Agent jots property details into the quick notepad mid-call and pushes them to the contact's OneNote page with one button
  5. Agent clicks a follow-up button (3, 15, or 30 days) and a Google Calendar event is created for that contact without leaving the app
  6. Agent creates a viewing event from a contact card and a Google Calendar invite is sent to the client
  7. When an incoming call notification appears via phone-link integration, the app detects it and offers to open the caller's OneNote page
**Plans**: 3 plans
Plans:
- [x] 02-01-PLAN.md -- OneNote Graph API: rewrite onenote.ts, page find-or-create, role templates, multi-role append, IPC + UI wiring
- [x] 02-02-PLAN.md -- Google Calendar follow-up API, follow-up UI (7/15/30 day buttons), dial-triggers-OneNote, settings toggle
- [x] 02-03-PLAN.md -- Phone Link detection (PowerShell WinRT polling), incoming call bar, post-call follow-up prompt

### Phase 3: Secondary Features and Website
**Goal**: The toolkit is feature-complete for v1 and distributable — agents have document checklists, a UAE property news feed, and a public website they can share with management or colleagues to download the tool
**Depends on**: Phase 2
**Requirements**: ORG-03, NEWS-01, WEB-01
**Success Criteria** (what must be TRUE):
  1. Agent opens a client record, selects a transaction type (tenancy, sale, or renewal), and sees a document checklist they can tick off as they collect each item
  2. App displays a live feed of UAE real estate news aggregated from industry RSS sources, updated automatically in the background
  3. A public website exists with a clear feature overview, installation instructions, and working download links for both Windows and macOS installers
**Plans**: 3 plans
Plans:
- [ ] 03-01-PLAN.md -- Document checklists: types, static UAE document sets, IPC, ContactCard UI with tick + timestamp
- [ ] 03-02-PLAN.md -- UAE news feed: rss-parser, main-process fetch/cache, 30-min background refresh, panel view
- [ ] 03-03-PLAN.md -- Website polish: electron-builder GitHub Releases config, landing page download URLs, GitHub Pages prep

### Phase 4: Meeting Transcriber
**Goal**: Agents can record client meetings via phone microphone over local WiFi and get an ephemeral transcript they can copy-paste into ChatGPT -- fully local, fully free, no data saved to disk
**Depends on**: Phase 1 (core app)
**Requirements**: REC-01, REC-02, REC-03, TRANS-01, TRANS-02, TRANS-03, PRIV-01
**Success Criteria** (what must be TRUE):
  1. Agent clicks a mic icon in the title bar, scans a QR code on their phone, and audio is captured from the phone microphone via local WiFi
  2. Agent can pause and resume recording within a session
  3. After stopping the recording, the audio is transcribed to text automatically using local Whisper (no cloud, no cost)
  4. Transcribed text appears in the main window with a Copy All button and is fully selectable for partial copy
  5. All audio and transcript data is fully ephemeral -- nothing saved to disk, data discarded on navigation or new recording
**Plans**: 3 plans
Plans:
- [x] 04-01-PLAN.md -- Foundation: shared types, Whisper Web Worker, preload API extensions (partially obsolete -- AudioRecorder replaced by phone recording)
- [x] 04-02-PLAN.md -- WiFi server infrastructure: cleanup obsolete artifacts, local HTTP+WebSocket server, phone recorder page, IPC/preload revision
- [ ] 04-03-PLAN.md -- Desktop UI: TranscriberView with QR code, connection status, recording timer, Whisper transcription, transcript display with Copy All

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core App + Communication | 5/5 | Complete | 2026-03-02 |
| 2. Notes and Calendar Integration | 3/3 | Complete   | 2026-03-02 |
| 3. Secondary Features and Website | 3/3 | Complete   | 2026-03-03 |
| 4. Meeting Transcriber | 2/3 | In Progress | -- |
