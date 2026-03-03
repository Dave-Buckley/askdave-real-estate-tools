# Requirements: Real Estate Agent Toolkit

**Defined:** 2026-03-01
**Core Value:** Make every agent faster at the tasks they repeat hundreds of times a week — calling, messaging, note-taking, and organizing — without touching the CRM or creating security concerns.

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

- [ ] **WEB-01**: A simple instruction/marketing website explains the tool's features, shows how to install it, and provides download links

## v2 Requirements

Deferred to next release. Tracked but not in current roadmap.

### Communication Enhancements

- **COMM-04**: Agent can send an email and auto-trigger a WhatsApp message notifying the contact to check their inbox
- **COMM-05**: Agent can translate a composed email before sending via translation API

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
| Data scraping from CRM or property portals | Security and compliance risk — hard boundary |
| Area insights / market data | Sourcing involves scraping which isn't allowed |
| Built-in VoIP dialler | Agents use personal phones; tel: URI + Phone Link is correct |
| Bulk message sending | TDRA compliance risk; one-contact-at-a-time only |
| AI-generated listing descriptions | Out of product scope |
| Scrcpy / ADB phone mirroring | Requires USB debugging — too technical and scary for agents |
| Cheque/currency calculators | Simple enough to do manually |

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
| WEB-01 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-02 after roadmap revision — 3 phases, cross-platform, all 17 requirements mapped*
