# Phase 1: Core App + Communication - Research

**Researched:** 2026-03-02
**Domain:** Electron desktop app — system tray, clipboard monitoring, global hotkeys, phone actions, message templates, installer, auto-update
**Confidence:** HIGH (core Electron APIs verified against official docs; signing landscape verified via official Electron docs + recent web sources)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Clipboard Popup:**
- Floating action bar style — compact horizontal bar with phone number + action buttons (Dial, WhatsApp)
- Appears near system tray / menu bar area — consistent position every time
- Stays visible until the agent clicks an action or explicitly dismisses it
- If a new phone number is copied while popup is showing, it replaces the current popup (one popup at a time)

**Main Panel Layout:**
- Dropdown panel from tray icon (not a separate window) — like Discord/Slack tray menus
- Default view is a quick actions hub: phone number input field at top + template list below — always useful whether a number is active or not
- Contact card shows the formatted number with action buttons immediately available. A small "Add name" link expands an optional name field for template substitution. Name is not required for actions.
- WhatsApp button uses a saved default preference (desktop or phone). A dropdown arrow or secondary action reveals the alternative option. One click for the common case.

**Template System:**
- Ships with 5-8 pre-loaded UAE real estate template examples (listing intro, follow-up, viewing confirmation, etc.). Agents can edit or delete them.
- Simple `{name}` style placeholders for variables. When the agent enters a name, it fills in automatically. If no name entered, placeholder stays visible as a reminder.
- When a template is selected with a number active: show a preview of the filled-in message. Agent can review, edit, then click "Send via WhatsApp" or "Copy". Safe and gives control.
- WhatsApp is the primary send channel. "Send via WhatsApp" is the main action, "Copy text" is a secondary action for pasting elsewhere.

**Setup & Preferences:**
- No first-run wizard. App launches with everything enabled and sensible defaults. Settings accessible from tray menu for customization.
- Simple on/off toggle list for features in settings (clipboard detection, hotkeys, etc.)
- Pre-set default hotkeys (e.g., Ctrl+Shift+D for dial, Ctrl+Shift+W for WhatsApp). Agents can customize by recording a new key combo in settings.
- Settings panel opens as a separate window (not inside the tray dropdown). Keeps the dropdown focused on daily actions.

### Claude's Discretion
- Exact hotkey defaults and modifier keys
- Loading states and transitions in the panel
- Error state handling (invalid numbers, WhatsApp not installed, etc.)
- Template editor UI design and editing flow
- Auto-update mechanism and notification behavior
- Phone number normalization implementation details
- Installer build tooling and signing approach

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| APP-01 | App runs in system tray (Windows) or menu bar (macOS) with configurable global hotkeys | Electron `Tray` API + `globalShortcut` module — both verified against official docs |
| APP-02 | App detects phone numbers on the clipboard and offers click-to-dial and click-to-WhatsApp actions | Self-polling with `electron.clipboard.readText()` at 500ms interval; phone number regex for UAE detection |
| APP-04 | All phone numbers normalized to UAE E.164 format (+971XXXXXXXXX) before any action | `libphonenumber-js` v1.12.38 — parsePhoneNumber() with default region 'AE' produces E.164 via `.number` property |
| APP-05 | App installs via clean installer (.exe / .dmg), no admin rights, starts on login, auto-updates silently | `electron-builder` v26.8.1 with `nsis.perMachine: false`; `app.setLoginItemSettings`; `electron-updater` |
| APP-06 | During setup or in settings, agent can enable/disable individual features | `electron-store` v11 for persistent settings; toggle UI in settings window |
| COMM-01 | Agent highlights a phone number and opens it in the phone dialler (pre-filled, not auto-calling) | `shell.openExternal('tel:+971XXXXXXXXX')` — verified pattern for both Windows and macOS |
| COMM-02 | Agent highlights a phone number and opens a WhatsApp chat, desktop or phone choice | `https://wa.me/971XXXXXXXXX` (web/phone) and `whatsapp://send?phone=971XXXXXXXXX` (desktop app); user preference stored in electron-store |
| COMM-03 | Agent can create, edit, and use reusable message templates with automatic contact name substitution | Template data in electron-store; `{name}` substitution via simple string replace; preview before send |
</phase_requirements>

---

## Summary

Phase 1 is a greenfield Electron desktop application. The technology is mature, well-documented, and the required features map directly to stable Electron built-in APIs (`Tray`, `globalShortcut`, `clipboard`, `shell`, `autoUpdater`, `app.setLoginItemSettings`). The recommended build stack is **Electron 40 + electron-vite 5 + React + TypeScript + Tailwind CSS v4**, packaged with **electron-builder 26** and distributed via NSIS (Windows) and DMG (macOS).

The only genuinely hard problems in this phase are: (1) **code signing and distribution**, which requires a physical EV certificate for Windows and Apple Developer membership + notarization for macOS — both take time and money to procure and must be started immediately; (2) the **tray dropdown window positioning**, which needs careful cross-platform handling using `tray.getBounds()` since Electron has no native "attach BrowserWindow to tray" primitive; and (3) **macOS `app.setLoginItemSettings`** which changed in macOS 13+ to use `SMAppService` and has known open bugs.

All other features — clipboard polling, phone normalization, tel: URI, WhatsApp links, template substitution, and persistent settings — are straightforward to implement using standard packages. There are no show-stopping unknowns; the phase is ready to plan.

**Primary recommendation:** Scaffold with `electron-vite` (React + TypeScript), use electron-builder for packaging, and wire Electron's built-in APIs directly for all OS integrations. Do not use unmaintained clipboard-watcher libraries — implement a lightweight self-poll in the main process.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| electron | 40.6.1 | Cross-platform desktop runtime | Current stable; ships Chromium 144, Node 24, V8 14.4 |
| electron-vite | 5.0.0 | Build tooling (main + preload + renderer via Vite) | Official CLI; handles multi-entry Vite config; TypeScript out of the box |
| react | 19.x | Renderer UI | Standard; excellent with Vite |
| typescript | 5.x | Type safety across all processes | Required for maintainability |
| electron-builder | 26.8.1 | Packaging + installers + auto-update metadata | Most widely adopted; generates NSIS, DMG, `latest.yml` |
| electron-updater | (bundled with electron-builder) | Auto-update at runtime | Pairs with electron-builder; NSIS + DMG supported |
| libphonenumber-js | 1.12.38 | Phone number parsing and E.164 normalization | Google's libphonenumber algorithm; handles UAE national format (05x) to +971 |
| electron-store | 11.0.2 | Persistent JSON settings (templates, preferences, hotkeys) | Standard in Electron ecosystem; schema validation; cross-process change events |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | 4.x | Utility CSS for tray panel and settings window | v4 Vite plugin — zero PostCSS config required |
| @tailwindcss/vite | 4.x | Tailwind v4 Vite plugin | Required for v4; replaces PostCSS config |
| zod | 3.x | Template schema validation | Validate user-edited templates before saving |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| electron-vite | electron-react-boilerplate | electron-react-boilerplate uses webpack; slower DX and build times |
| electron-builder | electron-forge | Forge is simpler but electron-builder has better NSIS per-user support and finer control |
| electron-store | lowdb / nedb | electron-store is Electron-specific, handles userData path correctly, supports migrations |
| libphonenumber-js | google-libphonenumber | google-libphonenumber is 550kB; libphonenumber-js is 145kB with same accuracy |
| Tailwind v4 | Tailwind v3 + PostCSS | v4 is simpler setup with Vite and produces smaller output |
| Self-written clipboard poll | electron-clipboard-extended | electron-clipboard-extended is **unmaintained** (Inactive on Snyk, 62 weekly downloads, no updates 12 months); electron-clipboard-watcher is 10 years old |

**Installation:**
```bash
npm create @electron-vite/react my-app -- --template react-ts
cd my-app
npm install electron-builder electron-updater libphonenumber-js electron-store zod
npm install -D @tailwindcss/vite tailwindcss
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── main/               # Electron main process
│   ├── index.ts        # App bootstrap, tray creation, login item
│   ├── tray.ts         # Tray icon, context menu, panel show/hide
│   ├── clipboard.ts    # Clipboard polling service (setInterval)
│   ├── hotkeys.ts      # globalShortcut registration/teardown
│   ├── phone.ts        # Phone number normalization (libphonenumber-js)
│   ├── actions.ts      # shell.openExternal for tel: and WhatsApp
│   ├── updater.ts      # electron-updater setup
│   └── store.ts        # electron-store instance and typed schema
├── preload/
│   ├── index.ts        # contextBridge for tray panel
│   └── popup.ts        # contextBridge for clipboard popup window
└── renderer/
    ├── panel/          # Tray dropdown React app
    │   ├── App.tsx
    │   ├── PhoneInput.tsx
    │   ├── TemplateList.tsx
    │   └── TemplatePreview.tsx
    ├── popup/          # Clipboard popup React app (separate entry)
    │   ├── App.tsx
    │   └── ActionBar.tsx
    └── settings/       # Settings window React app (separate entry)
        ├── App.tsx
        ├── FeatureToggles.tsx
        └── HotkeyRecorder.tsx
build/
├── entitlements.mac.plist   # macOS hardened runtime entitlements
├── icons/                   # .ico (Windows), .icns (macOS), .png (Linux)
electron-builder.config.js   # Packaging configuration
```

### Pattern 1: Tray Dropdown Panel (BrowserWindow positioned near tray)

**What:** A frameless BrowserWindow is toggled on tray click, positioned below the tray icon using `tray.getBounds()`.
**When to use:** For the main quick-actions panel — shown/hidden on tray icon click.

```typescript
// Source: https://www.electronjs.org/docs/latest/api/tray (getBounds method)
// src/main/tray.ts
import { Tray, BrowserWindow, screen, nativeImage } from 'electron'

let trayWindow: BrowserWindow | null = null

export function createTrayPanel(tray: Tray): BrowserWindow {
  trayWindow = new BrowserWindow({
    width: 360,
    height: 480,
    frame: false,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  tray.on('click', () => togglePanel(tray, trayWindow!))
  return trayWindow
}

function togglePanel(tray: Tray, win: BrowserWindow) {
  if (win.isVisible()) {
    win.hide()
    return
  }
  positionPanel(tray, win)
  win.show()
  win.focus()
}

function positionPanel(tray: Tray, win: BrowserWindow) {
  const { x, y, width, height } = tray.getBounds()
  const winBounds = win.getBounds()
  const display = screen.getDisplayNearestPoint({ x, y })
  const taskbarAtBottom = y > display.bounds.height / 2  // Windows taskbar at bottom

  const panelX = Math.round(x + width / 2 - winBounds.width / 2)
  const panelY = taskbarAtBottom
    ? y - winBounds.height  // above tray on Windows taskbar
    : y + height            // below menu bar on macOS

  win.setPosition(panelX, Math.max(0, panelY))
}
```

**Cross-platform note:** On Windows the tray is bottom-right; on macOS it is top-right. The `y + height` vs `y - winBounds.height` logic handles both. Use `tray.getBounds()` — it is supported on both macOS and Windows (HIGH confidence, verified via official docs).

### Pattern 2: Clipboard Polling Service

**What:** `setInterval` in the main process reads `clipboard.readText()` every 500ms and detects UAE phone numbers via regex, then fires an IPC event.
**When to use:** Always active when clipboard detection feature is enabled.

```typescript
// Source: https://www.electronjs.org/docs/latest/api/clipboard
// src/main/clipboard.ts
import { clipboard } from 'electron'
import { parsePhoneNumber, isPossiblePhoneNumber } from 'libphonenumber-js'

const UAE_LOOSE_REGEX = /(?:(?:\+|00)971|0)(?:5[0-9]|[2-9])\d{7}/g

let lastClipboardText = ''
let pollingInterval: NodeJS.Timeout | null = null

export function startClipboardPolling(onPhoneDetected: (e164: string) => void) {
  pollingInterval = setInterval(() => {
    const text = clipboard.readText()
    if (text === lastClipboardText) return
    lastClipboardText = text

    const matches = text.match(UAE_LOOSE_REGEX)
    if (!matches) return

    // Use libphonenumber-js to normalize the first match
    const rawNumber = matches[0]
    try {
      const phone = parsePhoneNumber(rawNumber, 'AE')
      if (phone.isValid()) {
        onPhoneDetected(phone.number) // E.164: '+971XXXXXXXXX'
      }
    } catch {
      // Not a valid UAE number — ignore
    }
  }, 500)
}

export function stopClipboardPolling() {
  if (pollingInterval) clearInterval(pollingInterval)
}
```

### Pattern 3: Phone Actions via shell.openExternal

**What:** Use `shell.openExternal` to open the OS dialler with `tel:` URI and WhatsApp with `https://wa.me/` or `whatsapp://` protocol.

```typescript
// Source: https://www.electronjs.org/docs/latest/api/shell
// src/main/actions.ts
import { shell } from 'electron'

// COMM-01: Open phone dialler pre-filled (does NOT auto-call)
export async function openDialler(e164: string) {
  // Strip the leading '+' for tel: URI — RFC 3966 recommends full E.164 with +
  await shell.openExternal(`tel:${e164}`)
}

// COMM-02: Open WhatsApp chat
// 'web' opens https://wa.me/ in default browser → redirects to WhatsApp Web or prompts app
// 'desktop' uses whatsapp:// protocol → opens WhatsApp desktop if installed
export async function openWhatsApp(e164: string, mode: 'web' | 'desktop') {
  // Remove '+' prefix for wa.me and whatsapp:// links — both expect digits only
  const digits = e164.replace('+', '')

  if (mode === 'web') {
    await shell.openExternal(`https://wa.me/${digits}`)
  } else {
    await shell.openExternal(`whatsapp://send?phone=${digits}`)
  }
}
```

**Note on WhatsApp links:** `https://wa.me/971XXXXXXXXX` is the official Meta-supported format. It opens WhatsApp Web in the browser, which can redirect to the desktop app or phone. `whatsapp://send?phone=971XXXXXXXXX` directly targets the installed WhatsApp desktop app. Store the user's preferred mode in `electron-store`.

### Pattern 4: Global Hotkey Registration

**What:** Register shortcuts after `app.whenReady()`. Unregister all on `will-quit`.

```typescript
// Source: https://www.electronjs.org/docs/latest/api/global-shortcut
// src/main/hotkeys.ts
import { app, globalShortcut } from 'electron'

export function registerHotkeys(config: HotkeyConfig) {
  // Must be called after app.whenReady()
  if (config.dialEnabled) {
    const ok = globalShortcut.register(config.dialKey, () => {
      // trigger dial action with current active phone number
    })
    if (!ok) console.warn(`Hotkey ${config.dialKey} could not be registered (conflict)`)
  }

  if (config.whatsappEnabled) {
    globalShortcut.register(config.whatsappKey, () => {
      // trigger WhatsApp action
    })
  }
}

// Always call this on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
```

**Important:** `globalShortcut.register()` returns `false` silently when blocked by another app. Always check the return value and surface a warning in settings. Do not throw.

### Pattern 5: Phone Number Normalization (libphonenumber-js)

```typescript
// Source: https://www.npmjs.com/package/libphonenumber-js
// src/main/phone.ts
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

export function normalizeToUAE(raw: string): string | null {
  try {
    // parsePhoneNumber with 'AE' default region handles:
    //   '0501234567'    → '+971501234567'
    //   '+971501234567' → '+971501234567'
    //   '00971501234567'→ '+971501234567'
    //   '+971 50 123 4567' (with spaces/dashes) → '+971501234567'
    const phone = parsePhoneNumber(raw.trim(), 'AE')
    if (phone.isValid()) return phone.number  // E.164 string
    return null
  } catch {
    return null
  }
}
```

**UAE number coverage:** All current UAE mobile prefixes are supported by libphonenumber-js — 050/054/056 (Etisalat), 052/055/058 (du), 053/058 (Virgin Mobile on du network), 057 (DOMC). Landlines: 02 (Abu Dhabi), 04 (Dubai), 03, 06, 07, 09. The loose regex in clipboard polling (Pattern 2) captures raw text; libphonenumber-js handles normalization.

### Pattern 6: IPC Security with contextBridge

```typescript
// Source: https://www.electronjs.org/docs/latest/tutorial/ipc
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Renderer → Main (one-way)
  dial: (e164: string) => ipcRenderer.send('action:dial', e164),
  openWhatsApp: (e164: string, mode: 'web' | 'desktop') =>
    ipcRenderer.send('action:whatsapp', e164, mode),

  // Renderer → Main → Renderer (two-way)
  getTemplates: () => ipcRenderer.invoke('store:getTemplates'),
  saveTemplate: (template: Template) => ipcRenderer.invoke('store:saveTemplate', template),
  getSettings: () => ipcRenderer.invoke('store:getSettings'),
  saveSettings: (settings: Settings) => ipcRenderer.invoke('store:saveSettings', settings),

  // Main → Renderer (events)
  onPhoneDetected: (cb: (e164: string) => void) =>
    ipcRenderer.on('phone:detected', (_e, e164) => cb(e164)),
  onPhoneDetectedCleanup: () => ipcRenderer.removeAllListeners('phone:detected'),
})
```

**Security:** `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true` — these are Electron 20+ defaults. Never expose raw `ipcRenderer` to the renderer.

### Pattern 7: electron-store Typed Schema

```typescript
// Source: https://github.com/sindresorhus/electron-store
// src/main/store.ts
import Store from 'electron-store'  // ESM import — electron-store v10+ is pure ESM

interface Template {
  id: string
  name: string
  body: string  // Contains {name} placeholder
}

interface AppSettings {
  clipboardEnabled: boolean
  hotkeysEnabled: boolean
  dialHotkey: string
  whatsappHotkey: string
  whatsappMode: 'web' | 'desktop'
  templates: Template[]
}

export const store = new Store<AppSettings>({
  defaults: {
    clipboardEnabled: true,
    hotkeysEnabled: true,
    dialHotkey: 'CommandOrControl+Shift+D',
    whatsappHotkey: 'CommandOrControl+Shift+W',
    whatsappMode: 'web',
    templates: DEFAULT_TEMPLATES,
  },
})
```

**CRITICAL:** `electron-store` v10+ is **pure ESM**. Your project MUST use ESM (`"type": "module"` or `.mjs` files, or electron-vite with ESM output for main process). If you use CommonJS main process, pin to `electron-store@9`.

### Pattern 8: Clipboard Popup (Floating Frameless Window)

**What:** A small borderless window that appears at a fixed position near the tray whenever a UAE phone number is detected.

```typescript
// src/main/tray.ts — popup creation
const popupWindow = new BrowserWindow({
  width: 320,
  height: 60,
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  skipTaskbar: true,
  resizable: false,
  movable: false,
  show: false,
  webPreferences: {
    preload: path.join(__dirname, '../preload/popup.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
})

// Position near tray — consistent location per CONTEXT.md decision
function showPopup(e164: string) {
  const trayBounds = tray.getBounds()
  // Place just above the tray on Windows, below menu bar on macOS
  positionNearTray(popupWindow, trayBounds)
  popupWindow.webContents.send('popup:show', e164)
  popupWindow.show()
}
```

### Anti-Patterns to Avoid

- **Exposing full `ipcRenderer` via contextBridge:** Allows renderer to send arbitrary messages. Expose only named functions.
- **Using `electron-clipboard-extended` or `electron-clipboard-watcher`:** Both are unmaintained (confirmed 2025). Build a 15-line self-poll instead.
- **Using CommonJS `require()` with electron-store v10+:** Pure ESM breaking change. Either use ESM or downgrade to v9.
- **Polling clipboard at < 300ms interval:** Unnecessary CPU consumption for this use case. 500ms is imperceptible to users.
- **Setting `perMachine: true` in NSIS config:** Requires admin rights — violates APP-05. Use `perMachine: false`.
- **Using Squirrel.Windows for auto-update:** electron-updater explicitly does not support Squirrel on Windows. Use NSIS target.
- **Calling `globalShortcut.register` before `app.whenReady()`:** Will throw. Always register inside `app.whenReady()` callback.
- **Forgetting `globalShortcut.unregisterAll()` on quit:** Leaves ghost shortcuts registered, causing conflict on next launch.
- **Using `openAsHidden` with `setLoginItemSettings` on macOS 13+:** Deprecated and broken. Use `type: 'mainAppService'` instead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Phone parsing/normalization | Custom regex pipeline | `libphonenumber-js` | UAE has 9 mobile prefixes, portability, spaces/dashes/00971/+971 all valid — regex will miss edge cases |
| Persistent settings | JSON.write to userData | `electron-store` | Handles atomic writes, file locks, migrations, cross-process change events, JSON schema validation |
| App packaging | Custom build scripts | `electron-builder` | Generates NSIS, DMG, `latest.yml`, code-sign hooks, auto-update metadata — years of edge cases baked in |
| Auto-update | Manual HTTP fetch + apply | `electron-updater` | Delta updates, rollback protection, signature verification, platform-specific installers |
| Template variable substitution | Templating library | Simple `str.replace('{name}', name)` | Only one variable (`{name}`) in Phase 1 — do not over-engineer |

**Key insight:** The Electron ecosystem has mature solutions for every infrastructure problem in this phase. The only custom code needed is the business logic: UAE phone detection, WhatsApp mode preference, template management, and the UI layer.

---

## Common Pitfalls

### Pitfall 1: Windows Code Signing — SmartScreen Warnings

**What goes wrong:** App ships without code signing or with an OV certificate → Windows SmartScreen shows "Windows protected your PC" warning on every install → agents refuse to install or feel unsafe.

**Why it happens:** Since June 2023, Microsoft treats OV certificates the same as unsigned code for SmartScreen purposes. EV certificates (or Azure Trusted Signing) are required.

**How to avoid:**
- Order an EV code signing certificate immediately (takes 1-3 weeks to procure per STATE.md blocker note). DigiCert, Sectigo, or GlobalSign are common sources.
- Alternative for lower cost: Azure Trusted Signing — but as of October 2025 it is restricted to US/Canada-based organizations. If the business is UAE-based, this option may not be available.
- EV certificates require a hardware HSM (USB token). CI signing requires a cloud HSM service (e.g., DigiCert KeyLocker, SSL.com eSigner).
- After getting the cert, even EV certs may show SmartScreen initially — submit the executable to Microsoft for analysis to expedite reputation.

**Warning signs:** Installer shows UAC/SmartScreen dialog. Test on a clean Windows machine without developer tools.

### Pitfall 2: macOS Gatekeeper — "App is damaged" Error

**What goes wrong:** macOS refuses to open the app with "App is damaged and can't be opened" unless it is both code-signed AND notarized by Apple.

**Why it happens:** macOS 10.15+ enforces notarization for all apps downloaded from the internet (quarantine flag). Code signing alone is not enough.

**How to avoid:**
- Requires: Apple Developer Program membership ($99/year), `Developer ID Application` certificate, `Developer ID Installer` certificate.
- Use `@electron/notarize` package with `notarytool` backend (old `altool` was deprecated in late 2023).
- electron-builder config: `hardenedRuntime: true`, `gatekeeperAssess: false`, custom `afterSign` hook calling `@electron/notarize`.
- Requires `entitlements.mac.plist` with `com.apple.security.cs.allow-jit` and `com.apple.security.cs.allow-unsigned-executable-memory`.

**Warning signs:** Test on macOS with a non-developer account. Run `spctl --assess --verbose /path/to/app` to verify notarization.

### Pitfall 3: electron-store ESM-only in v10+

**What goes wrong:** `require('electron-store')` throws `ERR_REQUIRE_ESM` at runtime.

**Why it happens:** `electron-store` v10.0.0 dropped CommonJS support and is now pure ESM.

**How to avoid:** Use `import Store from 'electron-store'` with an ESM main process. electron-vite supports ESM output for the main process. Alternatively, pin to `electron-store@9` if the project uses CommonJS.

**Warning signs:** Build works but app crashes on launch with `ERR_REQUIRE_ESM` in the main process log.

### Pitfall 4: Tray BrowserWindow Positioning on Multi-Monitor / High-DPI

**What goes wrong:** Panel appears at wrong position on Windows with multiple monitors or non-100% DPI scaling.

**Why it happens:** `tray.getBounds()` returns physical pixels; `win.setPosition()` expects logical pixels on Windows with DPI scaling.

**How to avoid:** Use `screen.getDisplayNearestPoint()` to get the display's `scaleFactor`, then divide physical coordinates by `scaleFactor` if needed. Test on 125%, 150%, 200% DPI settings.

**Warning signs:** Panel appears offset or on wrong monitor during testing.

### Pitfall 5: macOS Login Item API Change (macOS 13+)

**What goes wrong:** `app.setLoginItemSettings({ openAtLogin: true })` appears to succeed but app does not launch at login on macOS 13+.

**Why it happens:** Apple replaced the legacy Login Items API with `SMAppService` in macOS 13. Electron updated to use the new API, but there are open bug reports as of early 2026 where this does not work reliably in all build configurations.

**How to avoid:**
- Use `app.setLoginItemSettings({ openAtLogin: true, type: 'mainAppService' })` for non-MAS builds on macOS 13+.
- Test on actual macOS hardware (not Simulator).
- As a fallback: add a LaunchAgent plist manually during installation if `getLoginItemSettings().openAtLogin` returns `false` after setting it.

**Warning signs:** Setting is applied (no error) but app does not appear in System Settings > General > Login Items.

### Pitfall 6: Hotkey Conflicts and Silent Failures

**What goes wrong:** Global shortcuts silently fail to register because another app has claimed them.

**Why it happens:** `globalShortcut.register()` returns `false` without throwing when OS or another app owns the shortcut.

**How to avoid:** Always check the return value. Surface a warning in the settings UI: "This hotkey is already in use by another app. Please choose a different shortcut." Allow the agent to re-record a custom combo.

### Pitfall 7: WhatsApp `whatsapp://` Not Available on All Machines

**What goes wrong:** `shell.openExternal('whatsapp://...')` fails silently or opens browser with an error if WhatsApp desktop is not installed.

**Why it happens:** The `whatsapp://` custom protocol is only registered when WhatsApp desktop is installed.

**How to avoid:** Default mode to `'web'` (uses `https://wa.me/`) which always works. Only use `'desktop'` mode when user explicitly selects it. Catch shell.openExternal errors and surface a user-friendly message.

---

## Code Examples

Verified patterns from official sources:

### Auto-Update Setup (2 lines minimum)

```typescript
// Source: https://www.electron.build/auto-update.html
// src/main/updater.ts
import { autoUpdater } from 'electron-updater'

export function setupAutoUpdater() {
  // electron-builder automatically creates app-update.yml during build
  // Do NOT call setFeedURL() — it is managed by electron-builder
  autoUpdater.checkForUpdatesAndNotify()
  // For fully silent: set autoInstallOnAppQuit: true (default)
  // For background download + install on quit:
  autoUpdater.autoInstallOnAppQuit = true
}
```

### Login Item (Start on Login)

```typescript
// Source: https://www.electronjs.org/docs/latest/api/app#appsetloginitemsettingssettings
// src/main/index.ts
app.whenReady().then(() => {
  app.setLoginItemSettings({
    openAtLogin: true,
    // macOS 13+ requires 'type' field:
    ...(process.platform === 'darwin' ? { type: 'mainAppService' } : {}),
  })
})
```

### Template Substitution

```typescript
// src/main/templates.ts — No library needed
export function applyTemplate(body: string, name: string): string {
  // If name is blank, leave placeholder visible as reminder
  return name.trim()
    ? body.replace(/\{name\}/g, name.trim())
    : body
}

// COMM-03: WhatsApp send via URL
export function buildWhatsAppURL(e164: string, message: string): string {
  const digits = e164.replace('+', '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
```

### electron-builder Configuration (electron-builder.config.js)

```javascript
// Source: https://www.electron.build/nsis.html + https://www.electron.build/auto-update.html
/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'ae.yourcompany.agentkit',
  productName: 'Agent Kit',
  directories: { output: 'dist' },
  files: ['dist/**'],
  win: {
    target: ['nsis'],
    icon: 'build/icons/icon.ico',
    // EV certificate config — set via environment variables, not hardcoded
    certificateFile: process.env.WIN_CERT_FILE,
    certificatePassword: process.env.WIN_CERT_PASSWORD,
  },
  nsis: {
    oneClick: true,       // Silent install — no wizard
    perMachine: false,    // Per-user install — no admin rights required (APP-05)
    allowElevation: false,
    createDesktopShortcut: false,
    createStartMenuShortcut: true,
  },
  mac: {
    target: ['dmg'],
    icon: 'build/icons/icon.icns',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    // Notarization is triggered via afterSign hook
  },
  afterSign: 'scripts/notarize.js',  // See @electron/notarize
  publish: {
    provider: 'github',  // Or 'generic' with your own server
  },
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `electron-packager` + manual zip | `electron-builder` with auto-update | 2017-2019 | electron-builder generates all distribution targets in one command |
| Webpack (electron-react-boilerplate) | Vite via `electron-vite` | 2022-2023 | 10-100x faster HMR and builds |
| `altool` for macOS notarization | `notarytool` via `@electron/notarize` | Late 2023 (Apple deprecated altool) | New projects MUST use notarytool; altool was retired |
| OV code signing certificate on Windows | EV certificate (or Azure Trusted Signing) | June 2023 (Microsoft policy change) | OV = same as unsigned for SmartScreen |
| `openAsHidden` in setLoginItemSettings | `type: 'mainAppService'` (macOS 13+) | macOS 13 / Electron 22+ | `openAsHidden` deprecated and broken |
| Manual clipboard event libs | Self-poll with `setInterval` | 2024+ (libs went unmaintained) | Both major clipboard libs are inactive; poll is the correct approach |
| PostCSS config for Tailwind | `@tailwindcss/vite` plugin (v4) | Tailwind v4.0 (early 2025) | No PostCSS, no content globs needed |
| `electron-store` CommonJS | `electron-store` ESM (v10+) | 2023 | Breaking change: `require()` no longer works |

**Deprecated/outdated:**
- `electron-clipboard-watcher`: Unmaintained (last published 10 years ago). Do not use.
- `electron-clipboard-extended`: Inactive per Snyk (2025), 62 weekly downloads, no recent updates. Do not use.
- `altool` for notarization: Apple retired it. Use `notarytool` via `@electron/notarize`.
- `Squirrel.Windows` as auto-update target: Not supported by `electron-updater`. Use NSIS.

---

## Open Questions

1. **EV Certificate Procurement (Blocker)**
   - What we know: EV cert for Windows is required to avoid SmartScreen warnings. Takes 1-3 weeks. Already flagged in STATE.md.
   - What's unclear: Has the EV cert been ordered yet? If Azure Trusted Signing geographic restriction (US/Canada only as of Oct 2025) applies to a UAE-registered business, it may not be an option.
   - Recommendation: Order EV cert NOW from DigiCert or Sectigo. Do not wait until code is ready. Consider DigiCert KeyLocker for cloud-based CI signing.

2. **Update Distribution Server**
   - What we know: `electron-updater` supports GitHub Releases and generic HTTP servers. GitHub Releases is free for public repos; private repos need Pro plan.
   - What's unclear: Will the repo be public or private? Is GitHub the right host, or do we self-host?
   - Recommendation: Use GitHub Releases for simplicity in Phase 1. Private repo with GitHub Pro ($4/mo) or make releases public even if code is private.

3. **macOS Build Environment**
   - What we know: macOS code signing and notarization require running on macOS (or a macOS CI runner). Cannot be done from Windows.
   - What's unclear: Does the developer have a Mac for signing/notarization? Is there a macOS CI runner (e.g., GitHub Actions macOS runner) available?
   - Recommendation: Use GitHub Actions with a `macos-latest` runner for macOS builds. This is free for public repos; for private repos it costs ~10x more runner minutes.

4. **WhatsApp Desktop Protocol on Windows**
   - What we know: `whatsapp://send?phone=...` works when WhatsApp desktop is installed. `https://wa.me/...` always works via browser.
   - What's unclear: Whether `whatsapp://` is consistently registered by the Microsoft Store version of WhatsApp on all Windows 11 configurations.
   - Recommendation: Default to `'web'` mode. Make `'desktop'` mode an explicit user opt-in with a warning that it requires WhatsApp desktop installed.

---

## Sources

### Primary (HIGH confidence)
- https://www.electronjs.org/docs/latest/api/tray — Tray API, getBounds(), cross-platform differences
- https://www.electronjs.org/docs/latest/api/global-shortcut — globalShortcut.register(), limitations, accelerator format
- https://www.electronjs.org/docs/latest/api/clipboard — clipboard.readText(), main process usage
- https://www.electronjs.org/docs/latest/tutorial/ipc — contextBridge pattern, security model
- https://www.electronjs.org/docs/latest/tutorial/code-signing — EV cert requirement, notarization flow
- https://www.electronjs.org/docs/latest/api/app — setLoginItemSettings, SMAppService for macOS 13+
- https://www.electron.build/nsis.html — NSIS per-user config, perMachine, oneClick options
- https://www.electron.build/auto-update.html — electron-updater setup, supported targets, 2-line minimum
- https://www.npmjs.com/package/libphonenumber-js — v1.12.38, parsePhoneNumber, E.164 output
- https://www.npmjs.com/package/electron-store — v11.0.2, ESM-only in v10+, schema, migrations
- https://faq.whatsapp.com/5913398998672934 — Official wa.me and api.whatsapp.com link formats
- https://electron-vite.org/ — electron-vite 5.0.0, React + TypeScript scaffold

### Secondary (MEDIUM confidence)
- https://tailwindcss.com/blog/tailwindcss-v4 — Tailwind v4, @tailwindcss/vite plugin, no PostCSS required
- https://www.electronjs.org/docs/latest/tutorial/security — nodeIntegration, contextIsolation, sandbox defaults
- https://snyk.io/advisor/npm-package/electron-clipboard-extended — Inactive maintenance status confirmed
- https://www.npmjs.com/package/electron-clipboard-watcher — Last published 10 years ago confirmed

### Tertiary (LOW confidence)
- Multiple web sources on EV vs OV SmartScreen behavior post-March 2024 — Microsoft's exact behavior is opaque and changes. Validate by testing on a clean Windows 11 machine with a freshly signed build.
- GitHub issues re: setLoginItemSettings bug on macOS 13+ (Feb 2025) — open bugs, behavior may vary by Electron version.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed via `npm view` against live registry; core Electron APIs verified against official docs
- Architecture patterns: HIGH — patterns derived from official Electron docs and verified API references
- Code signing / signing pitfalls: MEDIUM — policy details from official Electron docs + web sources, but Microsoft/Apple behavior can change without notice; validate by testing
- Pitfalls (login item, ESM, hotkeys): HIGH — confirmed via official docs and GitHub issue tracker evidence

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (Electron releases every 8 weeks; signing policy can change; check before build)
