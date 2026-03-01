# Project Research Summary

**Project:** Real Estate Agent Productivity Toolkit (Windows Desktop + Web Platform)
**Domain:** Desktop productivity tool with web component — UAE/Dubai real estate vertical
**Researched:** 2026-03-01
**Confidence:** MEDIUM (external research tools unavailable this session; all findings from training knowledge through August 2025)

## Executive Summary

This is a Windows desktop productivity tool targeting real estate agents in Dubai/UAE, designed to sit alongside (not replace) an existing CRM. The product combines system-level automation (clipboard detection, hotkeys, system tray) with external API integrations (Microsoft OneNote, Google Calendar, WhatsApp), and a separate hosted web platform for signable RERA forms. Experts build this type of tool using a hybrid architecture: a native desktop shell for OS-level concerns, an embedded web view for the main UI, and a separately deployed web application for any features that need to be accessed by external parties (clients, in this case, for e-signatures). The full-JavaScript path (Electron + React) is recommended over the lighter .NET + WebView2 path because the team's likely skill set and the need for a shared mental model across the desktop app and web platform outweigh the installer size difference.

The recommended stack is Electron v33 (desktop shell), React 19 + Vite 6 + TypeScript + Tailwind CSS v4 (UI), Zustand + TanStack Query (state), better-sqlite3 (local persistence), and Next.js v15 on Vercel + Supabase (web platform). WhatsApp and phone integrations require zero third-party APIs in v1 — both work via URL deep links opened in the system browser. OneNote and Google Calendar require OAuth flows that must be handled through the system browser (not an embedded WebView) to comply with Microsoft and Google security policies. This is the single most common integration mistake and must be planned for explicitly.

The three critical risks that could derail the project are: (1) the RERA form signing feature shipping before a UAE legal compliance review confirms the signature method is legally enforceable, (2) the installer failing on non-technical agents' machines due to missing code-signing certificate and SmartScreen warnings, and (3) feature overload causing agent abandonment within the first week. All three risks are avoidable with upfront decisions made before any code is written. The product should ship a tight daily-driver core (click-to-WhatsApp, message templates, OneNote notes, follow-up reminders, desktop widget) before expanding to secondary features. The RERA forms web platform, route planner, and translation are v2 unless the core tool has proven daily adoption.

---

## Key Findings

### Recommended Stack

Two distinct deployments share a TypeScript/React codebase: a Windows desktop app (Electron) and a hosted web platform (Next.js on Vercel). Electron is chosen over the lighter .NET + WebView2 path because the team can own the full stack in JavaScript without Rust or C# knowledge, and the 150MB installer size is acceptable for an office workstation tool. The web platform uses Supabase (Postgres + Auth + Storage) over Firebase because the relational data model for forms and submissions fits structured SQL better than a document store.

All local persistent data lives in a single SQLite file (`better-sqlite3`) in the user's `%AppData%` folder. API tokens are stored in `electron-store` with encryption, not in plaintext config files. The architecture deliberately keeps the desktop app functional offline — only integrations (Google Calendar, OneNote, WhatsApp) require connectivity.

**Core technologies:**
- **Electron v33:** Desktop shell — ships Chromium + Node.js, enabling the full npm ecosystem and proven clipboard/hotkey/tray APIs. NSIS `.exe` installer via `electron-builder`.
- **React 19 + Vite 6 + TypeScript + Tailwind v4:** UI layer — consistent with the Next.js web platform, keeping the team in a single mental model.
- **Zustand v5 + TanStack Query v5:** State management — Zustand for local app state, TanStack Query for caching and managing external API calls (Google Calendar, OneNote).
- **better-sqlite3 v11:** Local persistence — all templates, settings, and activity data. Single `.db` file, synchronous API, works cleanly in Electron's main process.
- **electron-updater + electron-builder:** Auto-update and packaging — mandatory from day one; non-technical agents must not be asked to update manually.
- **Microsoft Graph API + @azure/msal-node:** OneNote integration — official SDK, PKCE flow, system browser redirect pattern mandatory.
- **googleapis npm package:** Google Calendar integration — official Google client, handles token refresh. System browser OAuth redirect required (Google blocks embedded WebView).
- **WhatsApp `wa.me` deep link + `tel:` URI:** Communication triggers — zero API keys, zero Meta approval required for v1.
- **Next.js v15 on Vercel + Supabase + signature_pad + pdf-lib + Resend:** Web platform for RERA forms — separate deployment, loosely coupled to desktop app via auth token and agreed URL structure.

See `.planning/research/STACK.md` for full alternatives comparison and installation commands.

### Expected Features

**Must have (table stakes) — core loop agents expect:**
- Click-to-dial — most repeated daily friction; triggers agent's phone via `tel:` URI
- Click-to-WhatsApp — Dubai agents live in WhatsApp; `wa.me` deep link covers this completely
- Message templates with variable substitution — agents send near-identical messages hundreds of times per week
- Contact notes via OneNote integration — qualifying info captured immediately after a call, auto-creates OneNote page per contact
- Follow-up reminders (3/15/30 day) — Google Calendar integration, one-click creation
- Days-since-last-call indicator — passive accountability, calculated from local event store
- Desktop widget / callback panel — always-on-top, shows today's reminders without opening other apps
- Inbound caller recognition — surfaces OneNote page when the phone rings (requires phone mirroring app)
- Quick viewing booking — Google Calendar event creation from a contact card
- Document checklist — configurable per transaction type (tenancy, sale, renewal)

**Should have (differentiators for this specific market):**
- Signable RERA forms (Form A, B, F) via hosted web platform — eliminates a Dubai-specific compliance bottleneck; legally complex, see Pitfall 3
- OneNote integration with role-specific qualifying templates (tenant/landlord/buyer/seller/portfolio) — structured capture vs. blank notes
- Multi-role contact support — one person as both landlord and buyer, unified view with adapted templates
- Route planner for viewings — Google Maps waypoint optimization; UAE traffic makes ordering critical
- Email with WhatsApp follow-up (dual send) — standard Dubai agent behavior, automated in one click
- Translation before sending (DeepL or Google Translate) — Dubai's international client base
- Real estate news feed — curated UAE/Dubai property news via RSS aggregation
- Quick property notepad with OneNote push — structured capture mid-call

**Defer to v2+:**
- CRM replacement of any kind — out of scope by design, creates agency IT friction
- Bulk message sending — TDRA compliance risk; one-at-a-time only in v1
- Built-in VoIP dialler — Dubai agents use personal mobile numbers; `tel:` URI + phone mirroring is correct
- Team dashboards or leaderboards — multi-user backend complexity, validate solo adoption first
- AI-generated listing descriptions — agents have their own voice, portals not integrated
- Client portal for document uploads — separate product scope

See `.planning/research/FEATURES.md` for full dependency graph and anti-feature rationale.

### Architecture Approach

The architecture follows a layered pattern with a clear boundary between the native host layer (Electron main process) and the web/API layer (renderer + integrations). The desktop app and the hosted web platform are loosely coupled — they share only an auth scheme and URL structure, allowing independent deployment. The recommended build order respects hard component dependencies: native shell first, then detection engine, then embedded UI, then integrations one-by-one, then hotkeys, then the web platform (which can be built in parallel from Phase 4 onward).

**Major components:**
1. **Electron Main Process (System Tray Host)** — process lifecycle, global hotkeys via `globalShortcut`, clipboard monitoring via interval polling, tray icon/menu, auto-update, IPC bridge
2. **Detection Engine** — pure library: clipboard string in, typed events out (`PhoneDetected`, `AddressDetected`). No UI, no API calls. Fully testable in isolation.
3. **Integration Layer (API Connectors)** — isolated connectors per service (OneNote, Google Calendar, WhatsApp). Core app calls abstractions (`IMessagingService`, `ICalendarService`, `INoteService`), not concrete connectors.
4. **Local State Store** — `better-sqlite3` for structured data; `electron-store` (encrypted) for preferences and OAuth tokens.
5. **Renderer (Embedded Web View / React UI)** — all visual interface via `contextBridge` + IPC. `nodeIntegration: false` + `contextIsolation: true` mandatory.
6. **Hosted Web Platform (Next.js on Vercel)** — signable forms and news feed. Separate deployment. Desktop app treats it as an external URL.

**Key architectural constraint:** OAuth flows for both Google and Microsoft MUST use the system browser redirect pattern with a localhost callback server. Embedded WebView OAuth is blocked by both providers. Plan a dedicated spike for this before Phase 3.

See `.planning/research/ARCHITECTURE.md` for data flow diagrams and component interaction map.

### Critical Pitfalls

1. **Shadow CRM data accumulation** — Individual features (notes, reminders, call logs) collectively create a fragmented CRM without the architecture to support it. Prevention: write a Data Boundary Document at project start mapping every data type to its authoritative owner (OneNote owns notes, Google Calendar owns reminders, CRM owns contact records). Audit every new data field at each sprint.

2. **RERA forms legally unenforceable** — A signature UI that looks functional but doesn't meet UAE electronic transactions law (Federal Decree-Law No. 46 of 2021) and RERA/DLD frameworks creates signed documents that are unenforceable. Prevention: engage a UAE real estate lawyer before writing any signing code. Strongly consider UAE Pass (national digital identity platform) or DocuSign/Adobe Sign with UAE jurisdiction compliance. Scope v1 of the forms platform to "pre-fill and share" only — no signing until legal review is complete.

3. **Installer blocked by SmartScreen** — Non-technical agents will panic and abandon at "Unknown publisher" dialogs. Prevention: budget an EV code-signing certificate before any distribution, use a user-space NSIS or MSIX installer (no admin rights required), and test on a clean Windows machine with a standard user account before every release.

4. **OAuth token management failure** — Overly broad scopes trigger agent refusal; plaintext token storage on shared brokerage machines is a security exposure; silent token expiry failures appear as "the feature just stopped working." Prevention: request minimum scopes only (`calendar.events`, `Notes.ReadWrite`), store refresh tokens in Windows Credential Manager via `electron-store` encryption, implement explicit reconnect prompts on expiry.

5. **Feature overload causing abandonment** — Eight feature areas presented simultaneously will cause agents to close the app after day two. Prevention: identify the two or three highest-frequency, lowest-learning-curve features (click-to-WhatsApp, message templates, OneNote notes) and perfect those before shipping others. Conduct at least 5 structured user testing sessions with working UAE agents before v1 release.

See `.planning/research/PITFALLS.md` for the full top-10 pitfall list including UAE address data quality issues (Pitfall 6), messaging regulatory compliance (Pitfall 7), and Arabic language support timing (Pitfall 9).

---

## Implications for Roadmap

Based on combined research, a 5-phase structure is recommended. The architecture's hard dependency chain (shell → detection → UI → integrations → web platform) maps naturally to phases. The feature research confirms that the highest-value, lowest-complexity features are achievable in early phases, which supports user adoption before complexity increases.

### Phase 1: Native Shell Foundation
**Rationale:** Everything else runs inside this process. Must be stable before any integrations are added. Also resolves the installer/distribution question (code signing, NSIS packaging, auto-updater) before agents ever see the tool.
**Delivers:** Working `.exe` installer, system tray icon, start-on-login, SQLite local store, `electron-store` for encrypted preferences, auto-updater wired to GitHub Releases. No integrations, no visible UI beyond tray menu.
**Addresses:** Desktop widget infrastructure, days-since-last-call store foundation
**Avoids:** Pitfall 4 (installer blocked) — EV certificate and clean-machine testing happen here, not at the end

### Phase 2: Daily Driver Core (Communication)
**Rationale:** Click-to-WhatsApp and click-to-dial are the highest-frequency, lowest-learning-curve features. Shipping these first proves daily value within the first hour of use, creating adoption momentum before more complex features arrive. Message templates compound this value immediately.
**Delivers:** Clipboard detection engine (phone number parsing), click-to-WhatsApp via `wa.me` deep link, click-to-dial via `tel:` URI, message templates with Handlebars variable substitution, embedded React UI panel (tray → open panel), basic contact card view.
**Uses:** Electron `clipboard` polling, `globalShortcut`, `contextBridge` IPC, `better-sqlite3` for templates, `handlebars` for interpolation
**Implements:** Detection Engine component, Renderer component, partial Integration Layer (WhatsApp — zero API, just URL)
**Avoids:** Pitfall 2 (WhatsApp API violations) — using only `wa.me` URLs, no automation; Pitfall 7 (TDRA messaging rules) — one-contact-at-a-time only; Pitfall 8 (feature overload) — only 3 features ship

### Phase 3: Notes and Calendar Integration
**Rationale:** Completes the core daily workflow loop: communicate (Phase 2) → document → follow up. These integrations are the most architecturally complex (OAuth system browser pattern, token refresh, Microsoft Graph HTML content model) and should be isolated to their own phase to manage risk.
**Delivers:** OneNote integration (auto-create/append notes per contact, role-specific qualifying templates), Google Calendar integration (follow-up reminders at 3/15/30 days, viewing booking), desktop widget showing today's reminders, multi-role contact support, days-since-last-call indicator, inbound caller recognition (phone mirroring dependency noted).
**Uses:** `@azure/msal-node` + Microsoft Graph API for OneNote, `googleapis` for Google Calendar, system browser OAuth redirect with localhost callback server (dedicated spike required), TanStack Query for caching API responses
**Implements:** Integration Layer connectors (OneNote, Google Calendar)
**Avoids:** Pitfall 5 (OAuth token failure) — system browser pattern, minimum scopes, `electron-store` encrypted token storage, explicit reconnect prompts; Pitfall 1 (shadow CRM) — Data Boundary Document enforced, notes attached to contacts only, no standalone contacts database
**Research flag:** NEEDS deeper research — OAuth system browser redirect pattern in Electron is non-trivial. Plan a 1-2 day spike before this phase starts.

### Phase 4: Secondary Productivity Features
**Rationale:** By this phase, agents have proven daily adoption of the core tool (Phases 2-3). Adding route planner, news feed, document checklist, quick property notepad, email + WhatsApp dual send, and translation expands value without disrupting the established workflow. These features are lower risk (no new OAuth, no new architecture patterns) and can be shipped incrementally.
**Delivers:** Route planner (Google Maps waypoint optimization via URL in Phase 4a, embedded map in Phase 4b), UAE real estate news feed (RSS aggregation via `rss-parser`, 60-minute cache), document checklist (configurable per transaction type), quick property notepad with OneNote push, email + WhatsApp dual send, translation before send (DeepL or Google Translate API).
**Uses:** Google Maps Directions API, `rss-parser`, existing OneNote connector (quick notepad pushes to same structure)
**Avoids:** Pitfall 6 (UAE address data quality) — Google Maps Places Autocomplete for all address entry, map pin confirmation, test with 20 real UAE addresses before release; Pitfall 10 (news feed maintenance burden) — fetch/cache/display only, no custom pipeline, visible "last updated" timestamp
**Research flag:** Route planner address handling in UAE deserves a targeted design spike before implementation. Standard geocoding will fail on landmark-based addresses.

### Phase 5: RERA Forms Web Platform
**Rationale:** This is deliberately last because it requires a separate deployment, has the highest legal complexity, and depends on the desktop app having an established user base to share form links from. The legal review for UAE e-signature compliance must be completed before development begins, making this phase non-startable until that external dependency is resolved.
**Delivers:** Hosted Next.js web platform (Vercel), Supabase database + auth + storage, form builder for RERA Form A, B, F, e-signature capture (method TBD pending legal review), signed PDF generation via `pdf-lib`, "form ready to sign" email via Resend, desktop app link to open forms platform.
**Uses:** Next.js v15, Supabase v2, `signature_pad` or UAE Pass integration (pending legal review), `pdf-lib`, Resend
**Avoids:** Pitfall 3 (RERA forms legally unenforceable) — UAE legal counsel engaged before Phase 5 begins; v1 of this phase should ship "form pre-fill and share" only, with signing added only after legal review confirms the chosen method
**Research flag:** NEEDS legal research before this phase is planned. Engage UAE real estate lawyer to confirm: (a) which signature method is legally acceptable per form type, (b) whether UAE Pass integration is required, (c) audit trail requirements. This is a hard blocker for phase planning.

### Phase Ordering Rationale

- **Phases 1-2 are non-negotiable in this order.** The native shell must exist before any UI or integration. The daily driver core ships second because it proves value fastest and reduces the risk of building complex integrations nobody uses.
- **Phase 3 before Phase 4** because OneNote and Google Calendar are foundational to the tool's data model — notes and reminders are dependencies for several Phase 4 features (quick property notepad, document checklist behavior).
- **Phase 5 is deliberately isolated.** The legal dependency means it cannot be planned in detail until external review completes. Starting it before legal clarity is confirmed is Pitfall 3 in practice.
- **Arabic language support (Pitfall 9)** must be planned as Phase 2.1 or 3.1 — not deferred to "future." String externalization should be built into Phase 1-2 from the start. Full Arabic translation targets v1.1 (first post-initial-release update).

### Research Flags

**Needs deeper research before planning:**
- **Phase 3:** OAuth system browser redirect pattern in Electron — non-trivial to implement correctly for both Google and Microsoft simultaneously. Spike recommended. Also: OneNote page content model (HTML-based, complex to manipulate programmatically — scope to append-only for MVP).
- **Phase 4:** UAE address data quality and Google Maps Places Autocomplete behavior for landmark-based addresses — design spike needed before implementation.
- **Phase 5:** UAE e-signature legal requirements — hard blocker, requires external legal counsel before phase can be planned. Cannot be estimated until resolved.

**Standard patterns (can skip research-phase):**
- **Phase 1:** Electron packaging and auto-update patterns are well-documented and stable. `electron-builder` + `electron-updater` have extensive community resources.
- **Phase 2:** WhatsApp `wa.me` deep link and `tel:` URI are trivial, stable, and zero-dependency. Clipboard polling pattern in Electron is standard. `handlebars` template interpolation is well-documented.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core choices (Electron, React, SQLite) are HIGH confidence. Specific version numbers (Tailwind v4, googleapis major version) should be verified against npm before locking `package.json`. External web tools unavailable this session. |
| Features | MEDIUM-HIGH | Table stakes derived from first-party Allsopp & Allsopp experience (HIGH). Market-specific differentiators (UAE WhatsApp norms, RERA forms) are well-established patterns but not externally verified this session. Competitor feature lists (Property Finder, Bayut tools) not consulted. |
| Architecture | MEDIUM-HIGH | Layered hybrid desktop/web architecture is a well-established pattern. Electron-specific IPC and OAuth patterns are HIGH confidence. The .NET vs. Electron trade-off analysis is sound but reflects training data through August 2025. |
| Pitfalls | HIGH | Critical pitfalls (RERA legal, SmartScreen, OAuth) are grounded in well-documented technical and regulatory constraints. UAE-specific risks (TDRA messaging rules, address data quality) are domain-validated. Legal citations (Federal Decree-Law No. 46 of 2021) should be verified with UAE legal counsel. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Softphone vendor unknown:** Click-to-dial via `tel:` URI assumes agents have a compatible softphone (3CX, RingCentral, Zoom Phone) or phone mirroring (Samsung Link to Windows, Phone Link). Validate which softphone target agents use before Phase 2 ships. If agents use personal phones without mirroring, click-to-dial value drops significantly.
- **OneNote adoption among target agents:** Some Dubai real estate agents do not actively use OneNote. Validate adoption rate before building the integration. If low, a local notes system may be more appropriate.
- **UAE e-signature legal standard:** The specific signature method required for RERA forms (simple image, advanced electronic signature, UAE Pass) is unknown without legal review. This is a hard gap for Phase 5 planning.
- **WhatsApp Business vs. personal:** Click-to-chat URLs work for personal WhatsApp. If the brokerage uses a shared WhatsApp Business number, the Business API may be required. Validate with target brokerage before Phase 2 ships.
- **Google Maps billing setup:** Maps JS API and Directions API require a billing account. Free tier is $200/month credit — generous for this use case but must be configured before Phase 4 begins.
- **Code-signing certificate lead time:** EV certificates take 1-3 weeks to procure. Must be ordered at project start, not when Phase 1 is complete.
- **Tailwind v4 stable release:** Near training cutoff, this was in RC. Verify current stable status and any breaking API changes before building Phase 2 UI.

---

## Sources

### Primary (HIGH confidence)
- Electron documentation — security best practices, `contextBridge`, `globalShortcut`, clipboard APIs, packaging with `electron-builder`
- Microsoft Graph API — OneNote and Calendar scopes, MSAL v2 for Node.js
- Google Calendar API v3 + OAuth2 for desktop apps — including Google's firm policy blocking embedded WebView OAuth
- WhatsApp `wa.me` click-to-chat URL format — stable Meta-documented format
- UAE Electronic Transactions and Commerce Law, Federal Decree-Law No. 46 of 2021 — e-signature legal basis

### Secondary (MEDIUM confidence)
- Next.js v15 App Router, Supabase v2, `pdf-lib`, `signature_pad` — stable releases, widely documented, specific versions should be re-verified
- UAE RERA regulatory context and form requirements — domain knowledge, recommend verification with DLD/RERA official resources
- TDRA messaging rules (unsolicited commercial communications) — domain knowledge, recommend legal verification before launch

### Tertiary (LOW confidence — needs validation)
- Tailwind CSS v4 stable release status — was RC near training cutoff; verify current API and stable release date
- `googleapis` npm current major version — updates frequently; check npm before locking
- UAE Pass integration feasibility for RERA forms — referenced as an option; requires direct investigation with the UAE Pass API program

---
*Research completed: 2026-03-01*
*Ready for roadmap: yes*
