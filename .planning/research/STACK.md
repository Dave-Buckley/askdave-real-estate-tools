# Technology Stack

**Project:** Real Estate Agent Productivity Toolkit (Windows Desktop + Web Platform)
**Researched:** 2026-03-01
**Research Confidence:** MEDIUM — Based on training data through August 2025. External tools (Context7, WebSearch, WebFetch) were unavailable during this research session. Version numbers should be verified against official docs before locking in.

---

## Recommended Stack

### Desktop Shell Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Electron** | ~v33 (latest stable) | Windows desktop app shell | Ships Chromium+Node.js, which means full npm ecosystem access, proven clipboard/hotkey/tray APIs, and auto-update support out of the box. Non-technical agents get a standard `.exe` installer. Tauri is lighter but requires Rust and WebView2 — adding friction for a Windows-only target where bundle size is not the primary concern. |

**Why NOT Tauri:** Tauri v2 is excellent but the Rust toolchain requirement and its plugin ecosystem maturity are still catching up. For a team likely unfamiliar with Rust, debugging native issues is harder. Electron's Node.js backend lets the same JavaScript/TypeScript team own the entire stack. Bundle size concern is real (~150MB) but acceptable for an office workstation tool.

**Why NOT NW.js:** Smaller community, fewer recent updates, Electron has better long-term support trajectory.

**Why NOT .NET MAUI / WinUI 3:** Requires .NET ecosystem familiarity; web UI components (for the forms web platform) don't integrate as naturally as with an Electron/browser stack.

---

### UI Framework (inside Electron renderer)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **React** | v19 (latest stable) | UI component tree | Largest ecosystem, best tooling. The forms web platform (separate web app) also uses React, keeping the team in a single mental model. |
| **Vite** | v6 | Build tooling | Fast HMR, native ESM, lighter than Webpack. First-class Electron + React templates exist. |
| **TypeScript** | v5.x | Type safety | Catches API contract errors at build time — critical when integrating OneNote, Google Calendar, and WhatsApp APIs with different response shapes. |
| **Tailwind CSS** | v4 | Styling | Utility-first, no context switching to separate CSS files. v4 drops the config file requirement and is faster. Agent-facing UI will be dense (sidepanel tool) so utility classes shine here. |

**Why NOT Vue/Svelte:** React's dominance means more Electron-specific examples, more Stack Overflow answers, and easier hiring. For a tight productivity tool this isn't a close call.

---

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Zustand** | v5 | Global app state | Minimal boilerplate. Avoids Redux overhead for a relatively simple state surface (active contact, selected template, calendar events). Plays well with React 19. |
| **TanStack Query** | v5 | Server/API state, caching | Handles the caching, background refresh, and error states for Google Calendar, OneNote, and WhatsApp API calls. Prevents stale data without manual polling logic. |

---

### System-Level Features (Electron main process)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Electron built-in `globalShortcut`** | (bundled) | System-wide hotkeys | No extra library needed. Electron's `globalShortcut` module works even when the app is not focused. |
| **Electron built-in `clipboard`** | (bundled) | Clipboard read/write/monitoring | Clipboard monitoring (polling `clipboard.readText()` on interval) is the standard Electron pattern. Native clipboard events are not cross-platform stable; interval polling at 500ms is imperceptible. |
| **Electron built-in `Tray` + `Menu`** | (bundled) | System tray icon, quick-access menu | Keeps the tool accessible without taking taskbar real estate. Non-technical agents expect a tray icon for background tools. |
| **Electron built-in `shell`** | (bundled) | Opening URLs in default browser (WhatsApp Web, Google Maps) | `shell.openExternal()` is the correct, sandboxed way to open WhatsApp Web links (`https://wa.me/...`) and Google Maps route URLs. |
| **`electron-updater`** | v6 | Auto-update via GitHub Releases or S3 | Non-technical agents must not be asked to manually update. `electron-updater` handles silent background updates with a single prompt to restart. Works with `electron-builder`. |

---

### Packaging & Distribution

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **`electron-builder`** | v25 | Produce NSIS `.exe` installer for Windows | Industry standard. Produces a proper Windows installer with Start Menu shortcut, uninstaller, and auto-update feed. NSIS target is the most compatible for non-technical Windows users. |

**Signing note (MEDIUM confidence):** A Windows code-signing certificate is required to avoid SmartScreen warnings on first install. This is not optional for non-technical users who will panic at "Unknown publisher" dialogs. Budget for an EV certificate (~$300/yr) or use a standard OV certificate. This is an infrastructure cost, not a code decision, but it blocks distribution.

---

### Click-to-Dial

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **`tel:` URI + `shell.openExternal()`** | (native) | Trigger system default phone app | The simplest approach. On Windows with a softphone (3CX, RingCentral, Zoom Phone, etc.) installed, `tel:+1234567890` opens the softphone's dialer. No SDK required. If the agent's CRM already has a softphone plugin, this avoids conflicts. |
| **3CX JS Browser SDK** | (if 3CX) | Direct dial from app if 3CX is CRM phone | Only use if the team standardizes on 3CX. Adds complexity and a vendor dependency. |

**Recommendation:** Start with `tel:` URI. Validate with actual agents which softphone they use. Only integrate a specific SDK in a later phase.

---

### Click-to-WhatsApp

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **WhatsApp Click-to-Chat URL** | (no library) | Open pre-filled WhatsApp message in default app or WhatsApp Web | `https://wa.me/{phone}?text={encodedMessage}` opened via `shell.openExternal()`. Zero dependencies, no API key, works with both WhatsApp Desktop and WhatsApp Web. |
| **WhatsApp Business API (via Meta)** | (if bulk/automated) | Programmatic message sending | Only needed if agents want to send messages without the WhatsApp UI opening (e.g., bulk sends). Requires Meta business verification, per-message cost. Defer to a later phase. |

**Recommendation:** Start with click-to-chat URL. This covers 95% of agent use cases with zero complexity.

---

### Microsoft OneNote Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Microsoft Graph API** | v1.0 | Read/write OneNote pages and notebooks | The official, stable, long-term supported API. Graph v1.0 (not beta) for production use. |
| **`@azure/msal-node`** | v2 | OAuth2 / MSAL authentication for Graph API | The Microsoft-maintained Node.js auth library. Handles token refresh, caching, and the OAuth2 flow. Do not roll your own auth. |
| **`axios`** or **`node-fetch`** | v5 (node-fetch) | HTTP calls to Graph API | TanStack Query handles caching; the HTTP client is interchangeable. Prefer `node-fetch` in Electron's Node.js main process, Axios in renderer if needed. |

**Auth flow:** Use MSAL's `PublicClientApplication` with the Authorization Code + PKCE flow. Register an app in Azure AD (free). Scopes needed: `Notes.ReadWrite`, `Calendars.ReadWrite` (if using Outlook Calendar instead of Google).

**Known complexity (HIGH confidence):** OneNote via Graph API is read/write but the page content model is HTML-based and not trivial to manipulate programmatically. Start with "append a note to a page" rather than full rich edit. Full OneNote editing in-app is a significant feature; scoping to "create/append" is realistic for an MVP.

---

### Google Calendar Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Google Calendar API v3** | v3 | Read/write calendar events | Stable, well-documented REST API. |
| **`googleapis` npm package** | v144+ | Official Google API client for Node.js | Handles auth, pagination, and type generation. Do not use raw HTTP calls — the client handles token refresh and quota headers. |
| **OAuth2 with `electron-google-oauth2`** or manual flow** | - | Google OAuth2 in Electron | Google blocks the embedded WebView for OAuth by default (security policy). Must open Google's OAuth consent page in the **system browser** (`shell.openExternal()`), then catch the redirect via a localhost server in the main process. `electron-google-oauth2` wraps this pattern. |

**Critical pitfall (HIGH confidence):** Google explicitly blocks `file://` and embedded WebView OAuth flows. The app MUST use the system browser redirect pattern with a local loopback server (e.g., `http://127.0.0.1:{random_port}/callback`). This is non-trivial to implement correctly. Plan a dedicated spike for auth.

---

### Message Templates

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **`handlebars`** | v4 | Template variable interpolation (`{{client_name}}`, `{{property_address}}`) | Lightweight, well-known, safe (no code execution). Familiar to anyone who's used email marketing tools. |
| **SQLite via `better-sqlite3`** | v11 | Local storage of templates | Templates are user data that must persist across sessions. SQLite is the right choice for a local desktop app — no server needed, no network dependency, simple backup (copy the file). `better-sqlite3` is synchronous and works cleanly in Electron's main process. |

**Why NOT localStorage/IndexedDB:** Browser storage is per-profile and not directly accessible from the main process. SQLite is more durable, queryable, and easier to back up / migrate.

**Why NOT a cloud database for templates:** Templates are personal agent preferences. Keeping them local reduces infrastructure, eliminates sync complexity, and works offline.

---

### Viewing Route Planner

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Google Maps JavaScript API** | latest | Map display, place search, route visualization | No realistic alternative for real estate (street view, satellite imagery, address autocomplete). |
| **Google Maps Directions API** | latest | Multi-stop route optimization | Waypoint optimization (reorder stops for shortest route) is available in the standard Directions API with `optimize:true`. |
| **Google Maps Embed API** | latest | If rendering map in Electron WebView | `<webview>` or `BrowserView` in Electron can host the Maps JS API. Alternatively, open route in browser tab via `shell.openExternal()` with a Google Maps URL. |

**Recommendation:** Phase 1 — generate an optimized Google Maps URL (with all addresses as waypoints) and open it in the system browser. This requires no API key, no billing, and works immediately. Phase 2 — embed the map in the app using Maps JS API (requires billing account and API key).

**API key management:** Never bundle API keys in the renderer (exposed to users via DevTools). Store keys in Electron's main process environment, pass results to renderer via IPC.

---

### Signable Forms Web Platform

This is a **separate web application** (not part of the Electron desktop app) that agents share links to for client e-signatures.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Next.js** | v15 | Web app framework | App Router with React Server Components handles the public-facing form viewer and the agent-facing form builder. SSR ensures forms load fast for clients on mobile. |
| **Vercel** | (hosting) | Deployment | Zero-config deployment for Next.js. Auto-scaling, edge CDN, preview deployments. For a real estate business, this is the right tradeoff vs. managing servers. |
| **`react-signature-canvas`** or **`signature_pad`** | latest | Capture client signature on touch/mouse | `signature_pad` (Szimek) is the most mature, dependency-free canvas signature library. Works on iOS Safari (critical — clients sign on phones). |
| **Supabase** | v2 | Database (form definitions, submissions, signatures) + Auth (agent login) + Storage (signed PDF storage) | Postgres-backed BaaS. The real-time subscription feature is useful if agents want live "client just signed" notifications. Row-level security keeps agent data isolated. Better than Firebase for structured relational data (forms have fields, submissions have field values). |
| **`pdf-lib`** | v1 | Generate signed PDF from completed form | Pure JavaScript, runs in Node.js (Vercel Edge/serverless). Embeds the signature image and field values into a PDF template. No headless browser needed. |
| **Resend** | (email) | Send "form ready to sign" emails and "form signed" confirmations | Modern transactional email API with good React Email support. Better DX than SendGrid for a small app. |

**Why NOT DocuSign/Adobe Sign SDK:** Overkill for a custom forms solution. Those are enterprise products with per-envelope pricing. Building a lightweight e-sign flow with `signature_pad` + `pdf-lib` + Supabase storage is entirely feasible for the real estate use case and eliminates recurring per-document costs.

**Legal note (MEDIUM confidence):** E-signatures are legally binding in most jurisdictions under ESIGN Act (US) and eIDAS (EU) if you capture intent, audit trail, and identity. Supabase provides the audit trail (timestamps, IP, user agent). Consult local real estate regulations for any additional requirements.

---

### News Feed

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **RSS/Atom feed parsing via `rss-parser`** | v3 | Aggregate real estate news from industry sources | Real estate publications (Inman, RealTrends, local MLS announcements) publish RSS feeds. No API key required, works offline with cached results. |
| **Custom API aggregator (optional Phase 2)** | - | Curated news feed with filtering | If the team wants to curate sources or filter by keyword (e.g., local suburb names), a lightweight serverless function (Vercel Edge) can aggregate and cache feeds. |

**Why NOT a news API (NewsAPI, etc.):** Adds cost and API key management. RSS is free and sufficient for the use case. Agents want real estate–specific news, not general news, so curation beats algorithmic search.

---

### Local Data Persistence

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **`better-sqlite3`** | v11 | All local persistent data (templates, contacts cache, settings, viewed properties) | Single `.db` file in `app.getPath('userData')`. Synchronous API is clean in Electron main process. Supports full SQL for future reporting features. |
| **`electron-store`** | v10 | App preferences and auth tokens (encrypted) | JSON key-value store with optional encryption. Use for settings that don't need SQL (window position, theme, last-used template). Not for large datasets. |

---

### IPC and Security

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Electron `contextBridge` + `ipcRenderer`/`ipcMain`** | (bundled) | Secure communication between renderer and main process | `contextBridge` exposes only specific functions to the renderer, preventing renderer-side code from accessing Node.js APIs directly. This is the current Electron security best practice. `nodeIntegration: false` + `contextIsolation: true` are mandatory. |

**Why this matters:** If a malicious website is ever loaded in the renderer (unlikely but possible if agents paste URLs), `contextIsolation` prevents it from accessing the filesystem or executing Node.js code.

---

### Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vitest** | v3 | Unit tests for business logic (template interpolation, route URL generation, API response parsing) | Vite-native, fast, Jest-compatible API. Electron-specific logic runs in main process and can be tested in Node environment. |
| **Playwright** | v1.49+ | End-to-end tests for Electron app and web forms platform | Playwright has first-class Electron support via `playwright-electron`. Also covers the Next.js web platform. Single test framework for both surfaces. |

---

## Full Stack at a Glance

```
Desktop App (Electron v33 + React 19 + TypeScript + Vite + Tailwind v4)
├── Main process: system APIs, SQLite, OAuth flows, IPC
├── Renderer: React UI, TanStack Query, Zustand
├── Packaging: electron-builder → NSIS .exe
└── Updates: electron-updater → GitHub Releases

Web Platform (Next.js v15 on Vercel)
├── Supabase (Postgres + Auth + Storage)
├── signature_pad (e-signature capture)
├── pdf-lib (signed PDF generation)
└── Resend (transactional email)

Shared/Integrations
├── Microsoft Graph API + @azure/msal-node (OneNote)
├── googleapis (Google Calendar)
├── WhatsApp click-to-chat URLs (zero dependency)
├── tel: URI (click-to-dial, zero dependency)
├── Google Maps URL generation → system browser (Phase 1)
└── rss-parser (news feed)
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Desktop framework | Electron v33 | Tauri v2 | Rust toolchain complexity, plugin ecosystem less mature for this feature set |
| Desktop framework | Electron v33 | NW.js | Smaller community, slower update cadence |
| Desktop framework | Electron v33 | .NET MAUI | Wrong ecosystem for a web-centric team; no React reuse |
| UI framework | React 19 | Vue 3 | Fewer Electron examples, smaller ecosystem for this use case |
| State management | Zustand | Redux Toolkit | Overkill for this app's state complexity |
| Local DB | better-sqlite3 | lowdb / JSON files | No SQL, poor performance for search/filter operations |
| Local DB | better-sqlite3 | PostgreSQL (local) | Massive operational overhead for a desktop tool |
| Web forms hosting | Vercel + Next.js | AWS / self-hosted | Operational complexity not justified for this team size |
| Forms DB | Supabase | Firebase | Relational data model fits forms/submissions better than document store |
| E-signature | Custom (signature_pad + pdf-lib) | DocuSign/Adobe Sign | Per-document cost, unnecessary complexity for in-house forms |
| Phone integration | tel: URI | TAPI / Windows Telephony API | Requires C++ interop, fragile, overkill |
| WhatsApp | Click-to-chat URL | WhatsApp Business API | Meta verification required, per-message cost, no advantage for manual sends |

---

## Installation (Desktop App)

```bash
# Scaffold with Electron + Vite + React + TypeScript template
npm create electron-vite@latest my-app -- --template react-ts
cd my-app
npm install

# State & data fetching
npm install zustand @tanstack/react-query

# Local database
npm install better-sqlite3
npm install -D @types/better-sqlite3

# Secure preferences + encrypted token storage
npm install electron-store

# Template interpolation
npm install handlebars

# RSS feed parsing
npm install rss-parser

# Microsoft Graph auth
npm install @azure/msal-node

# Google APIs client
npm install googleapis

# Packaging
npm install -D electron-builder electron-updater

# Styling
npm install -D tailwindcss @tailwindcss/vite
```

```bash
# Web Platform (separate repo)
npx create-next-app@latest forms-platform --typescript --tailwind --app
cd forms-platform
npm install @supabase/supabase-js signature_pad pdf-lib resend
```

---

## Confidence Levels by Area

| Area | Confidence | Notes |
|------|------------|-------|
| Electron as framework choice | HIGH | Dominant for JavaScript desktop apps through training cutoff; not displaced by 2026 |
| React 19 + Vite 6 + TypeScript | HIGH | Mainstream, stable, well-documented |
| Tailwind CSS v4 | MEDIUM | v4 was in RC near training cutoff; verify stable release and API changes |
| Zustand v5 + TanStack Query v5 | HIGH | Both stable, widely used |
| better-sqlite3 v11 | MEDIUM | Verify current version; API is stable |
| Microsoft Graph API + msal-node | HIGH | Official Microsoft SDK, long-term stable |
| googleapis npm package version | MEDIUM | Package updates frequently; verify current major version |
| Google OAuth in Electron (system browser pattern) | HIGH | Google's policy blocking embedded WebView is firm and well-documented |
| WhatsApp click-to-chat URL approach | HIGH | Stable, no API changes expected |
| Next.js v15 App Router | HIGH | Stable release |
| Supabase for web platform | HIGH | Mature BaaS, well-documented |
| signature_pad library | HIGH | Stable, widely used |
| pdf-lib | HIGH | Stable, pure JS, no headless browser needed |
| electron-builder NSIS packaging | HIGH | Standard Windows packaging approach |
| electron-updater | HIGH | Standard auto-update approach |
| Windows code-signing requirement | HIGH | SmartScreen behavior is consistent and well-documented |

---

## Critical Decisions That Need Validation Before Phase 1

1. **Softphone vendor** — Which softphone do target agents use (3CX? RingCentral? Zoom Phone?)? This determines whether `tel:` URI is sufficient or a vendor SDK is needed.
2. **OneNote vs. Outlook Notes vs. custom notes** — Some agents may not actively use OneNote. Validate adoption before building the integration.
3. **Code-signing certificate** — Must be procured before any public distribution. Lead time can be 1-3 weeks for EV certificates.
4. **WhatsApp Business Account** — Click-to-chat URLs work for personal WhatsApp. If the brokerage uses a shared WhatsApp Business number, the Business API may be required in a later phase.
5. **Google Maps billing** — Maps JS API and Directions API require a billing account. Free tier is generous ($200/month credit) but must be set up before Phase 1 map work begins.
6. **Forms platform legal review** — Confirm e-signature requirements with a local real estate attorney before launch.

---

## Sources

- Electron documentation and security best practices (training data, HIGH confidence for architecture patterns)
- Microsoft Graph API documentation — OneNote and Calendar scopes (training data, HIGH confidence for API existence; verify current Graph v1.0 endpoint paths)
- Google Calendar API v3 and OAuth2 for desktop apps — Google's policy on embedded WebView blocked (training data, HIGH confidence; this is a firm security policy)
- WhatsApp click-to-chat URL format — `https://wa.me/{phone}?text={encoded}` (training data, HIGH confidence; stable URL format)
- Next.js App Router, Supabase, pdf-lib, signature_pad (training data, MEDIUM confidence on exact versions)
- Tailwind CSS v4 release status (training data, MEDIUM confidence — verify stable release date and breaking changes)

**Note:** All version numbers should be verified against npm or official docs before locking the package.json. This research was produced without access to live web tools.
