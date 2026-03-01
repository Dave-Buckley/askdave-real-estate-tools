# Roadmap: Real Estate Agent Toolkit

## Overview

Four phases that deliver a working, distributable Windows desktop productivity tool for UAE real estate agents. Phase 1 builds the stable native shell that everything runs inside. Phase 2 ships the highest-value, lowest-friction features first — click-to-WhatsApp, click-to-dial, message templates — proving daily value before the harder integrations arrive. Phase 3 wires up OneNote and Google Calendar, completing the core daily workflow loop (communicate, document, follow up). Phase 4 finishes the remaining productivity features, ships the instruction website, and produces a distributable .exe that agents can actually install. Phases are intentionally ordered to get useful software into agents' hands early and to isolate the most technically complex work (OAuth, token management) into its own phase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Native Shell Foundation** - Electron app skeleton with system tray, hotkeys, local store, and distribution pipeline
- [ ] **Phase 2: Communication Daily Drivers** - Click-to-dial, click-to-WhatsApp, message templates, clipboard detection, and React UI panel
- [ ] **Phase 3: Notes and Calendar Integration** - OneNote per-contact pages with role templates, Google Calendar reminders and viewings, inbound caller recognition
- [ ] **Phase 4: Secondary Features and Website** - Document checklists, UAE real estate news feed, and instruction/download website

## Phase Details

### Phase 1: Native Shell Foundation
**Goal**: A stable, installable Electron shell exists that agents can put on their machines — ready for all integrations to be built inside it
**Depends on**: Nothing (first phase)
**Requirements**: APP-01, APP-04, APP-05
**Success Criteria** (what must be TRUE):
  1. Agent installs the app via a .exe installer with no admin rights required and no SmartScreen panic
  2. App appears in the system tray on Windows login without the agent having to start it manually
  3. Agent can configure at least one global hotkey that triggers a visible action from any application
  4. All phone numbers processed by the app are normalized to +971 E.164 format before any action is taken
  5. App silently downloads and applies an update without the agent doing anything
**Plans**: TBD

### Phase 2: Communication Daily Drivers
**Goal**: Agents can dial and WhatsApp any phone number they see on screen in one click, and send templated messages with auto-filled contact names — the highest-frequency daily tasks are solved
**Depends on**: Phase 1
**Requirements**: COMM-01, COMM-02, COMM-03, APP-02
**Success Criteria** (what must be TRUE):
  1. Agent highlights a phone number anywhere on screen, presses the hotkey, and their phone rings (or tel: URI fires) within one click
  2. Agent highlights a phone number anywhere on screen and opens a WhatsApp chat with that contact in one click via wa.me
  3. Agent copies a phone number and immediately sees a popup offering dial and WhatsApp actions without pressing any hotkey
  4. Agent selects a message template, types or selects a contact name, and the template fills in automatically before sending
  5. The React UI panel opens from the tray and shows current contact card, communication actions, and template picker in a single view
**Plans**: TBD

### Phase 3: Notes and Calendar Integration
**Goal**: Agents can document every call in a structured OneNote page and set follow-up reminders and viewing bookings in Google Calendar — the full communicate-document-follow-up loop is complete
**Depends on**: Phase 2
**Requirements**: NOTE-01, NOTE-02, NOTE-03, NOTE-04, ORG-01, ORG-02, APP-03
**Success Criteria** (what must be TRUE):
  1. Agent opens a contact and the app auto-creates or navigates to a OneNote page keyed on that contact's normalized phone number
  2. New OneNote pages are pre-filled with the correct qualifying template (tenant, landlord, buyer, seller, or portfolio) based on the contact's role
  3. When a contact has multiple roles, the agent can add a second role and the OneNote page updates to include that role's template section alongside the existing ones
  4. Agent jots property details into the quick notepad mid-call and pushes them to the contact's OneNote page with one button
  5. Agent clicks a follow-up button (3, 15, or 30 days) and a Google Calendar event is created for that contact without leaving the app
  6. Agent creates a viewing event from a contact card and a Google Calendar invite is sent to the client
  7. When an incoming call notification appears via Windows Phone Link, the app detects it and offers to open the caller's OneNote page
**Plans**: TBD

### Phase 4: Secondary Features and Website
**Goal**: The toolkit is feature-complete for v1 and distributable — agents have document checklists, a UAE property news feed, and a public website they can share with management or colleagues to download the tool
**Depends on**: Phase 3
**Requirements**: ORG-03, NEWS-01, WEB-01
**Success Criteria** (what must be TRUE):
  1. Agent opens a client record, selects a transaction type (tenancy, sale, or renewal), and sees a document checklist they can tick off as they collect each item
  2. App displays a live feed of UAE real estate news aggregated from industry RSS sources, updated automatically in the background
  3. A public website exists with a clear feature overview, installation instructions, and a working download link for the .exe installer
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Native Shell Foundation | 0/TBD | Not started | - |
| 2. Communication Daily Drivers | 0/TBD | Not started | - |
| 3. Notes and Calendar Integration | 0/TBD | Not started | - |
| 4. Secondary Features and Website | 0/TBD | Not started | - |
