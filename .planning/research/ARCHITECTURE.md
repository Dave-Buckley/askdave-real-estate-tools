# Architecture Research
**Project:** Real Estate Agent Productivity Toolkit
**Dimension:** Architecture
**Date:** 2026-03-01
**Milestone:** Greenfield — Structural foundations

---

## Research Question

How are desktop productivity tools with web components and system integrations typically structured? What are the major components?

---

## Summary

Desktop productivity tools that combine system-level features (clipboard, hotkeys, OS notifications) with web-connected components (APIs, web-hosted forms, news feeds) are typically structured in a layered architecture with a clear boundary between the native host layer and the web/API layer. The key design tension is between lightweight installation simplicity and the breadth of integrations required. For a Windows-first tool that needs to sit quietly alongside an existing CRM, the dominant pattern is a System Tray Host application that owns OS-level concerns, delegates UI to an embedded web view (or lightweight native window), and communicates with external services through an isolated integration layer.

---

## Major Components

### 1. System Tray Host (Native Shell)

The outermost layer. Owns the process lifecycle, lives in the Windows system tray, starts on login, and presents no visible window by default. This component:

- Registers global keyboard hotkeys (Win32 `RegisterHotKey` or equivalent library)
- Attaches a clipboard listener (`WM_CLIPBOARDUPDATE` message chain)
- Owns the process that keeps all other components alive
- Handles install/uninstall/auto-update
- Presents a tray icon with a context menu as the primary entry point

**Why this comes first:** Everything else depends on the process being alive and stable. This is the root.

**Technology choice implications:**
- **.NET 6/8 WinForms or WPF** — lightest installer footprint, best access to Win32 APIs for clipboard and hotkeys, easiest to keep the background process tiny. Recommended for this tool.
- **Electron** — larger installer (~80-120 MB), but ships a full Chromium rendering engine which simplifies the web view story. Better if the team is JS-only.
- **Tauri** — Rust core with OS WebView, small footprint, but requires Rust knowledge and the Windows WebView2 runtime.

For "lightweight, simple to install, sit alongside CRM" — .NET with an embedded WebView2 control is the pragmatic choice. WebView2 is pre-installed on all modern Windows 11 machines (and can be bundled as a bootstrapper for older ones).

---

### 2. Detection Engine (Number / Entity Parsing)

A background worker that inspects clipboard content and extracts structured entities: phone numbers, property addresses, dollar amounts, listing IDs. This is purely in-process logic with no UI.

- Triggered by clipboard change events from the System Tray Host
- Runs regex and/or NLP parsing against the clipboard string
- Emits typed events: `PhoneDetected`, `AddressDetected`, `PriceDetected`
- Downstream subscribers decide what to do with those events

**Boundary:** This component should be a pure library — it takes a string, returns structured data. It does not call APIs, write to disk, or touch the UI. This makes it testable and replaceable.

---

### 3. Integration Layer (API Connectors)

Stateless clients that translate the app's internal operations into third-party API calls. Each connector is isolated:

| Connector | What it does |
|---|---|
| **OneNote** | Appends or creates notes via Microsoft Graph API |
| **Google Calendar** | Creates/reads events via Google Calendar API |
| **WhatsApp** | Sends messages via WhatsApp Business API (or Twilio/WA Cloud API) |

**Key principle:** Each connector only knows about its own API. The core app calls an abstraction (`IMessagingService`, `ICalendarService`, `INoteService`), not the concrete connector. This allows connectors to be swapped or added without touching core logic.

**Auth handling:** OAuth tokens for Google/Microsoft and API keys for WhatsApp are stored in the Windows Credential Manager (not flat files or the registry). Each connector handles its own token refresh cycle.

**Data flow:**
```
User Action / Detection Event
        |
   Core App Logic
        |
  Integration Layer (picks the right connector)
        |
  Third-Party API  <-->  Internet
```

---

### 4. Local State & Settings Store

A minimal persistence layer for:

- User preferences (which hotkeys, which integrations are enabled)
- Cached auth tokens (delegated to Windows Credential Manager for secrets)
- Recent activity log (last N clipboard detections, last N actions taken)
- Pending queue for actions that failed while offline

**Implementation:** SQLite via a local `.db` file in `%AppData%\[AppName]`. This is the standard Windows location for per-user app data. Keeps the install directory clean and survives app updates.

**What does NOT go here:** Anything that belongs to the web platform (forms, their data, signatures). That lives server-side.

---

### 5. Embedded Web View (Local UI Shell)

A WebView2 control hosted inside the .NET process that renders the main UI panel when the user opens the app from the tray. This is where most of the visual interface lives — it is an HTML/CSS/JS application that runs locally but can also navigate to hosted URLs.

- Renders the dashboard, activity feed, quick-action buttons
- Communicates with the .NET host via a message bridge (`WebMessageReceived` / `PostWebMessageAsJson`)
- Loads local assets from a bundled web build (no local server needed for local UI)
- For the news feed and signable forms web platform, it navigates to hosted URLs in the same WebView2 pane

**Boundary — host bridge:**
```
Web UI (JS)  <-->  Message Bridge  <-->  .NET Host Process
```
The JS side cannot directly call Win32 APIs. It sends messages to the host, which executes the privileged action and returns a result. This is the only path for things like "copy to clipboard," "register hotkey," "save to disk."

---

### 6. Web Platform (Hosted — Separate Deployment)

A server-side web application accessible via browser or the embedded web view. This is a distinct deployment from the desktop app:

- **Signable forms:** Document templates with e-signature capture, stored server-side
- **News feed / market updates:** Content management, agent-facing feed
- **Potential future portal:** Client-facing access without needing the desktop app

**Technology:** A standard web stack — Next.js, Django, Laravel, or similar. The desktop app treats this as an external URL. The only coupling is an auth token that identifies the logged-in agent, passed from the desktop app to the hosted platform as a query param or cookie.

**Key architectural point:** The web platform and the desktop app are loosely coupled. The desktop app can be built and shipped before the web platform exists. The web platform can be developed and deployed independently. They share only an auth scheme and an agreed URL structure.

---

## Component Map (What Talks to What)

```
┌─────────────────────────────────────────────────────┐
│              Windows System Tray Host                │
│   (process owner, hotkeys, clipboard listener)       │
│                                                      │
│  ┌──────────────┐    ┌────────────────────────────┐ │
│  │  Detection   │    │     Local State Store      │ │
│  │  Engine      │    │     (SQLite / AppData)     │ │
│  │  (parsing)   │    └────────────────────────────┘ │
│  └──────┬───────┘                                    │
│         │ events                                     │
│  ┌──────▼───────────────────────────────────────┐   │
│  │           Core App Logic / Orchestrator      │   │
│  └──────┬──────────────────┬────────────────────┘   │
│         │                  │                         │
│  ┌──────▼──────┐   ┌───────▼──────────────────────┐ │
│  │ Integration │   │     Embedded Web View (UI)   │ │
│  │ Layer       │   │     (WebView2 / local HTML)  │ │
│  │  - OneNote  │   │                              │ │
│  │  - GCal     │   │  navigates to ──────────────────────► Web Platform
│  │  - WhatsApp │   │  (hosted forms, news feed)   │ │     (external URL)
│  └──────┬──────┘   └──────────────────────────────┘ │
│         │                                            │
└─────────┼────────────────────────────────────────────┘
          │
          ▼
    Third-Party APIs
    (MS Graph, Google, WhatsApp)
```

---

## Data Flow — Key Scenarios

### Scenario A: Clipboard Number Detection → WhatsApp Message

```
OS Clipboard Change
  → System Tray Host receives WM_CLIPBOARDUPDATE
  → Detection Engine parses clipboard string
  → PhoneDetected event emitted
  → Core Logic checks user preferences (auto-prompt or silent)
  → Web View receives message: show "Send WhatsApp?" prompt
  → User confirms in UI
  → Web View sends confirmation message to .NET host
  → Core Logic calls WhatsApp Connector
  → WhatsApp API called
  → Result returned to Web View: "Sent"
  → Activity logged to Local State Store
```

### Scenario B: Hotkey → OneNote Quick Capture

```
User presses hotkey combo
  → System Tray Host detects via RegisterHotKey callback
  → Core Logic fires "quick capture" intent
  → Web View receives message: show capture overlay
  → User types note content, submits
  → Web View sends content to .NET host
  → Core Logic calls OneNote Connector
  → Microsoft Graph API called
  → Note created in OneNote
  → Web View receives success message
  → Activity logged
```

### Scenario C: Opening a Signable Form

```
User clicks "New Form" in Web View
  → Web View navigates (or opens pane) to hosted Web Platform URL
  → Auth token passed as header/cookie to identify the agent
  → Web Platform renders form builder / template list
  → Agent fills form, sends to client
  → Client signs via browser (no desktop app needed on client side)
  → Signed form stored server-side
  → Webhook or polling notifies desktop app of completion (optional)
```

---

## Suggested Build Order (Dependency Chain)

The components have hard dependencies that dictate a natural build order:

### Phase 1 — Native Shell Foundation
**Build:** System Tray Host + Local State Store

Everything else runs inside this process. Get a working tray icon, start-on-login, basic preferences window, and SQLite persistence. No integrations, no web view yet.

**Output:** App installs, sits in tray, persists settings. Proves the skeleton works.

---

### Phase 2 — Detection Engine
**Depends on:** Phase 1 (needs a running process to attach clipboard listener to)

**Build:** Clipboard listener + Detection Engine (number/address parsing)

Wire the clipboard listener into the tray host, pipe events through the detection engine. Log detected entities to the local state store. Add a minimal UI notification (balloon tooltip or tray icon badge).

**Output:** App silently detects phone numbers and addresses copied to clipboard. Logs them.

---

### Phase 3 — Embedded Web View + Local UI
**Depends on:** Phase 1 (needs host process), Phase 2 (needs events to display)

**Build:** WebView2 control embedded in the tray host. Local HTML/JS/CSS panel showing the activity log, quick-action buttons, and settings.

Wire the message bridge so the web UI can read detected entities from the host and trigger actions.

**Output:** User opens the app from tray, sees a clean UI showing recent detections. Can trigger placeholder actions.

---

### Phase 4 — Integration Layer (one connector at a time)
**Depends on:** Phase 3 (UI to trigger actions), Phase 1 (credential store for tokens)

**Build order within this phase:**
1. WhatsApp connector (simplest auth — API key, no OAuth flow needed if using Cloud API)
2. Google Calendar connector (OAuth, but well-documented)
3. OneNote connector (Microsoft Graph OAuth — shares auth pattern with potential future Microsoft 365 features)

Wire each connector to a button/action in the web UI as it's built.

**Output:** Each integration works end-to-end: detect → user action → API call → confirmation in UI.

---

### Phase 5 — Hotkeys
**Depends on:** Phase 1 (native shell), Phase 3 (UI to respond), Phase 4 (connectors to invoke)

**Build:** Global hotkey registration. Map hotkeys to actions already built in Phase 4 (open quick-capture panel, trigger WhatsApp, etc.)

**Output:** User can trigger key flows without clicking the tray icon.

---

### Phase 6 — Web Platform (Hosted)
**Depends on:** Phase 3 (embedded web view to navigate to it), but independent as a deployment

**Build:** Hosted web app for signable forms and news feed. Can be developed in parallel with Phases 4-5 since it's a separate deployment. Integrates with desktop app only through a URL and an auth token.

**Output:** Agent opens the app, navigates to forms platform inside the embedded web view or in their browser.

---

## Key Architectural Decisions and Tradeoffs

### Decision 1: .NET + WebView2 vs. Electron

| Factor | .NET + WebView2 | Electron |
|---|---|---|
| Installer size | ~5-20 MB | ~80-150 MB |
| Win32 API access | Native, direct | Via Node.js native modules |
| Clipboard/hotkeys | First-class | Workable but indirect |
| Dev language | C# + HTML/JS | JS/TS throughout |
| WebView2 on machine | Pre-installed Win11 | Bundled (no dependency) |
| Recommendation | Best fit for "lightweight" | Better if team is JS-only |

### Decision 2: Local-first vs. Cloud-first for state

The detection history, settings, and activity log should be local-first (SQLite). This keeps the app functional when offline, keeps user data private, and avoids a server dependency for the core experience. Only the web platform (forms, news feed) requires connectivity.

### Decision 3: Monorepo vs. Separate repos

Given the distinct deployment boundaries (desktop app vs. hosted web platform), a monorepo with clear package separation is practical:

```
/desktop         → .NET project (tray host, detection, integrations)
/desktop-ui      → HTML/JS/CSS for the embedded web view
/web-platform    → hosted web app (forms, news feed)
/shared          → shared types, API contracts
```

This allows the web platform to be deployed independently while keeping everything in one place for a small team.

---

## Risks and Constraints to Note for Roadmap

1. **WhatsApp API complexity:** WhatsApp Business API requires a verified business account and Meta approval. This can take days to weeks. Start the approval process early, or plan for a "manual open WhatsApp" fallback (deep link to `wa.me/...`) while approval is pending.

2. **Microsoft Graph OAuth:** OneNote access requires an Azure App Registration and the user to grant permissions. This is a setup step for each agent — plan for an onboarding flow.

3. **Clipboard access on Windows:** Windows clipboard monitoring is reliable but requires the app to be running with a message window (even a hidden one). This is standard practice but needs to be accounted for in the architecture — the host cannot be purely a background service with no window handle.

4. **WebView2 runtime:** WebView2 is included by default on Windows 11 and Windows 10 with recent cumulative updates, but older machines may need the bootstrapper. The installer should check for and install it silently.

5. **Side-by-side CRM:** The app must not interfere with the existing CRM. Hotkeys must be chosen carefully to avoid conflicts with common CRM shortcuts. The clipboard listener should be read-only and non-destructive.

---

## Sources

This document is based on established architectural patterns for hybrid desktop/web applications, including:
- Windows application development patterns (Win32, .NET, WebView2 host model)
- Common patterns for system tray utilities (Clipboard managers, quick-launch tools, productivity apps like Alfred, Raycast, Ditto)
- Microsoft Graph and Google API OAuth integration patterns
- WhatsApp Business Cloud API integration model
- Electron and Tauri architecture documentation
- SQLite as embedded store pattern (used by browsers, VS Code, many desktop tools)
