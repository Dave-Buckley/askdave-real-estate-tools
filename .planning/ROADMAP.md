# Roadmap: Real Estate Agent Toolkit

## Overview

Three phases that deliver a working, distributable cross-platform desktop productivity tool for UAE real estate agents. Phase 1 ships a usable, demo-able product from day one — agents install the app and immediately can open any phone number in their dialler or WhatsApp with one click, and send templated messages. Phase 2 wires up OneNote and Google Calendar, completing the core daily workflow loop (communicate, document, follow up). Phase 3 finishes the remaining productivity features and ships the instruction website. The app runs on both Windows and macOS. Mobile is covered through existing apps (OneNote, Google Calendar) in v1, with a dedicated companion app planned for v2.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (1.1, 2.1): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Core App + Communication** - Cross-platform Electron app with installer, system tray, hotkeys, click-to-dial, click-to-WhatsApp, message templates, clipboard detection
- [ ] **Phase 2: Notes and Calendar Integration** - OneNote per-contact pages with role templates, Google Calendar reminders and viewings, inbound caller recognition
- [ ] **Phase 3: Secondary Features and Website** - Document checklists, UAE real estate news feed, and instruction/download website

## Phase Details

### Phase 1: Core App + Communication
**Goal**: Agents install the app and immediately have a usable tool — they can open any phone number in their dialler or WhatsApp with one click, and send templated messages with auto-filled names. Works on Windows and macOS. This is the demo-able product.
**Depends on**: Nothing (first phase)
**Requirements**: APP-01, APP-02, APP-04, APP-05, COMM-01, COMM-02, COMM-03
**Success Criteria** (what must be TRUE):
  1. Agent installs the app via clean installer (.exe on Windows, .dmg on macOS) with no admin rights required and no security warnings
  2. App appears in the system tray (Windows) or menu bar (macOS) on login without the agent having to start it manually
  3. Agent can configure at least one global hotkey that triggers a visible action from any application
  4. All phone numbers processed by the app are normalized to +971 E.164 format before any action is taken
  5. App silently downloads and applies an update without the agent doing anything
  6. Agent highlights a phone number anywhere on screen and it opens in the phone dialler (pre-filled, not auto-calling) with one click
  7. Agent highlights a phone number anywhere on screen and opens a WhatsApp chat with that contact in one click via wa.me
  8. Agent copies a phone number and immediately sees a popup offering dial and WhatsApp actions without pressing any hotkey
  9. Agent selects a message template, types or selects a contact name, and the template fills in automatically before sending
  10. The React UI panel opens from the tray and shows current contact card, communication actions, and template picker in a single view
**Plans**: TBD

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
**Plans**: TBD

### Phase 3: Secondary Features and Website
**Goal**: The toolkit is feature-complete for v1 and distributable — agents have document checklists, a UAE property news feed, and a public website they can share with management or colleagues to download the tool
**Depends on**: Phase 2
**Requirements**: ORG-03, NEWS-01, WEB-01
**Success Criteria** (what must be TRUE):
  1. Agent opens a client record, selects a transaction type (tenancy, sale, or renewal), and sees a document checklist they can tick off as they collect each item
  2. App displays a live feed of UAE real estate news aggregated from industry RSS sources, updated automatically in the background
  3. A public website exists with a clear feature overview, installation instructions, and working download links for both Windows and macOS installers
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core App + Communication | 0/TBD | Not started | - |
| 2. Notes and Calendar Integration | 0/TBD | Not started | - |
| 3. Secondary Features and Website | 0/TBD | Not started | - |
