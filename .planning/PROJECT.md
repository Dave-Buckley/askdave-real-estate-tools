# Real Estate Agent Toolkit

## What This Is

A lightweight desktop productivity tool for real estate agents in the UAE market. It sits alongside existing CRM systems — not inside them — and eliminates the repetitive, time-wasting tasks that slow agents down every day: manual dialling, scattered notes, forgotten follow-ups, and disorganized viewings. Designed to be simple enough for any agent to use, secure enough for firms to approve, and polished enough to present to management as a product.

## Core Value

Make every agent faster at the tasks they repeat hundreds of times a week — calling, messaging, note-taking, and organizing — without touching the CRM or creating security concerns.

## Requirements

### Validated

<!-- Shipped in v1.0 MVP (2026-03-06) -->

- Click-to-dial via Phone Link / tel: URI — v1.0
- Click-to-WhatsApp via wa.me deep link — v1.0
- Message templates (WhatsApp/Gmail/OneNote) with auto contact name fill — v1.0
- OneNote integration: per-contact pages keyed on phone number — v1.0
- Role-based qualifying templates (tenant, landlord, buyer, seller, portfolio) — v1.0
- Multi-role contact support with adaptive templates — v1.0
- Follow-up reminders (7/15/30 day) via Google Calendar — v1.0
- Quick booking: viewing/consultation events from contact card — v1.0
- Document checklist per client per transaction type — v1.0
- System tray app with configurable global hotkeys — v1.0
- Clipboard phone number detection with action popup — v1.0
- Inbound caller recognition via Windows Phone Link — v1.0
- UAE phone number normalization (E.164) — v1.0
- NSIS installer, no admin rights, auto-updates via GitHub Releases — v1.0
- UAE real estate news feed via RSS — v1.0
- Landing page and product overview — v1.0
- Meeting transcriber: phone mic (WiFi) + desktop mic, local Whisper AI — v1.0
- 1,517 education flashcards with spaced repetition — v1.0
- RERA forms + KYC forms with WhatsApp/email send — v1.0

### Active

- [ ] General Notes: text area in contact card, push to OneNote (appends below existing content), clears after push
- [ ] Fix Form I templates: rewrite all 4 Form I WhatsApp/email messages from client-facing to agent-to-agent commission split language

### Out of Scope

- CRM replacement — this works alongside existing CRM systems, not instead of them
- Call logging / call tagging — CRM handles activity tracking
- Data scraping from CRM or property portals — security and compliance risk
- Area insights / market data — sourcing involves scraping which isn't allowed
- Scrcpy / ADB phone mirroring — requires USB debugging, too technical for agents
- Built-in VoIP dialler — agents use personal phones via Phone Link
- Bulk message sending — TDRA compliance risk
- Cheque/currency calculators — simple enough to do manually

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
- **Platform:** Cross-platform desktop (Windows + macOS) via Electron. Simple website for instructions/download. Mobile covered by existing apps (OneNote, Google Calendar) in v1
- **No hidden costs:** All APIs used must have free tiers sufficient for v1. No surprise billing

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| OneNote for contact storage | Portable across firms, agents keep their contacts. Firms can mandate work notebooks | — Pending |
| Standalone tool, not CRM plugin | Avoids security concerns, works with any CRM, no IT approval needed for core features | — Pending |
| Google Calendar for reminders/bookings | Widely used, good API, calendar invites work cross-platform | — Pending |
| Windows Phone Link for phone integration | No scrcpy/ADB — clean, built-in, no scary debugging setup | — Pending |
| Signable forms deferred to v3+ | Legal complexity (UAE e-signature law) and separate web platform too much for v1 | — Pending |
| Simple instruction website, not a web app | v1 is desktop-focused; website just explains and distributes the tool | — Pending |

## Current Milestone: v1.1 Polish & Agent Tools

**Goal:** Ship the deferred General Notes notepad and fix Form I templates for agent-to-agent use, then update the landing page.

**Target features:**
- General Notes text area in contact card with push-to-OneNote
- Form I template rewrites (agent-to-agent commission split language)
- Landing page update to reflect v1.1 changes

---
*Last updated: 2026-03-06 after milestone v1.1 started*
