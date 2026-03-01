# Real Estate Agent Toolkit

## What This Is

A lightweight desktop productivity tool for real estate agents in the UAE market. It sits alongside existing CRM systems — not inside them — and eliminates the repetitive, time-wasting tasks that slow agents down every day: manual dialling, scattered notes, forgotten follow-ups, and disorganized viewings. Designed to be simple enough for any agent to use, secure enough for firms to approve, and polished enough to present to management as a product.

## Core Value

Make every agent faster at the tasks they repeat hundreds of times a week — calling, messaging, note-taking, and organizing — without touching the CRM or creating security concerns.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Click-to-dial: highlight a phone number anywhere on screen, one click to call via phone
- [ ] Click-to-WhatsApp: highlight a number, one click to open a WhatsApp chat (phone or desktop)
- [ ] Contact notes with OneNote integration: auto-create/find OneNote pages per contact with qualifying templates (tenant, landlord, buyer, seller, portfolio)
- [ ] Inbound caller recognition: incoming call triggers a button to pull up that contact's OneNote file
- [ ] Editable message templates: reusable scripts for WhatsApp/email with auto name fill, easy to customize per agent
- [ ] Email button on contacts: quick send email, with option to auto-WhatsApp the contact to notify them
- [ ] Translation option: translate composed emails before sending
- [ ] Follow-up reminders: 3-day, 15-day, 30-day buttons that auto-create Google Calendar reminders
- [ ] Days-since-last-call indicator: small counter per contact showing how recently they were called
- [ ] Desktop widget/organiser: always-visible panel showing today's callbacks and upcoming follow-ups
- [ ] Signable forms platform: web forms for RERA documents (Form A, B, F etc.) with agent/client detail input and digital signature
- [ ] Quick booking: select a contact, create a Google Calendar viewing event and send an invite
- [ ] Route planner: input viewing addresses, get optimal order to minimize travel
- [ ] Quick property notepad: jot property details mid-call, one button formats and pushes to OneNote
- [ ] Document checklist: per client, per transaction type (tenancy, sale, renewal), trackable checklist of required documents
- [ ] Real estate news feed: curated industry news aggregated from key sites
- [ ] Multi-role contact support: one contact can be tenant, landlord, buyer, seller, or investor — notes and templates adapt accordingly

### Out of Scope

- CRM replacement — this works alongside existing CRM systems, not instead of them
- Call logging / call tagging — CRM handles activity tracking
- Data scraping from CRM or property portals — security and compliance risk
- Area insights / market data — sourcing this data involves scraping which isn't allowed
- Team dashboards / leaderboards — too much for v1, possible future addition
- Cheque/currency calculators — simple enough to do manually
- End of day summary generation — agents handle reporting themselves

## Context

- **Market:** UAE real estate, primarily Dubai. Covers lettings (tenants + landlords) and sales (buyers + sellers)
- **Users:** Individual real estate agents and small teams at agencies
- **Environment:** Agents work from desks using Windows PCs alongside a CRM (varies by firm), phones (Samsung/iPhone), WhatsApp (heavy use in Dubai market), OneNote, Google Calendar
- **Origin:** Built from real pain points experienced at Allsopp & Allsopp. Existing AutoHotkey scripts (click-to-WhatsApp, tenant/landlord templates, phone mirroring) proved the concept but aren't distributable
- **Commercial intent:** Designed to be presentable to management at a new firm, with potential to be sold as a product to other agencies
- **Dubai specifics:** RERA forms (A, B, F), Emirates ID as standard document, cheque-based rent payments, highly international client base (Arabic, Russian, Mandarin, English), WhatsApp is primary communication channel
- **Key RERA forms:** Form A (agent-seller agreement), Form B (agent-buyer agreement), Form F (tenancy contract)

## Constraints

- **Security:** Must not embed in or scrape from CRM systems. No data extraction from property portals
- **Simplicity:** Must be usable by non-technical agents. No command-line tools, no debugging, no complex setup
- **Portability:** Agent's personal contact notes should be portable if they change firms (personal OneNote)
- **Platform:** Windows desktop primary (matches agency standard). Web components for signable forms
- **Compliance:** Forms and document handling must respect UAE real estate regulations

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| OneNote for contact storage | Portable across firms, agents keep their contacts. Firms can mandate work notebooks | — Pending |
| Standalone tool, not CRM plugin | Avoids security concerns, works with any CRM, no IT approval needed for core features | — Pending |
| Google Calendar for reminders/bookings | Widely used, good API, calendar invites work cross-platform | — Pending |
| Separate web platform for signable forms | Forms need to be accessible on any device for client signing | — Pending |

---
*Last updated: 2026-03-01 after initialization*
