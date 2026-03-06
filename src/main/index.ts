import { app, globalShortcut, dialog, shell, BrowserWindow } from 'electron'
import { store } from './store'
import { createTray, createTrayPanel, showPanelNearCursor, showPanel, getPanelWindow } from './tray'
import { startClipboardWatcher, stopClipboardWatcher } from './clipboard'
import { registerHotkeys, unregisterHotkeys } from './hotkeys'
import { grabSelectionAndDetectPhone } from './selection'
import { registerIPCHandlers } from './ipc'
import { setupAutoUpdater } from './updater'
import { startPhoneLinkWatcher, stopPhoneLinkWatcher } from './phone-link'
import { fetchNews } from './news'
import { stopServer as stopTranscriberServer } from './transcriber-server'

import { exec } from 'child_process'
import { HotkeyConfig } from '../shared/types'

/**
 * Check if a Windows process is running by name.
 */
function isProcessRunning(processName: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`tasklist /FI "IMAGENAME eq ${processName}" /NH`, (err, stdout) => {
      if (err) { resolve(false); return }
      resolve(stdout.toLowerCase().includes(processName.toLowerCase()))
    })
  })
}

/**
 * Check each companion app that Ask Dave relies on.
 * If an app is needed (feature enabled) but not running, show a single dialog
 * listing the missing apps and offer to launch them.
 * If all needed apps are already running, no dialog appears.
 */
async function promptCompanionApps(): Promise<void> {
  const apps: { name: string; feature: string; enabled: boolean; processName: string; launch: () => void }[] = [
    {
      name: 'Phone Link',
      feature: 'click-to-dial and incoming call detection',
      enabled: process.platform === 'win32' && store.get('phoneLinkEnabled'),
      processName: 'PhoneExperienceHost.exe',
      launch: () => exec('start explorer.exe shell:AppsFolder\\Microsoft.YourPhone_8wekyb3d8bbwe!App')
    },
    {
      name: 'OneNote',
      feature: 'contact notes',
      enabled: store.get('oneNoteEnabled'),
      processName: 'ONENOTE.EXE',
      launch: () => shell.openExternal('onenote:')
    },
    {
      name: 'WhatsApp Desktop',
      feature: 'sending messages via WhatsApp Desktop',
      enabled: store.get('whatsappMode') === 'desktop',
      processName: 'WhatsApp.exe',
      launch: () => shell.openExternal('whatsapp:')
    }
  ]

  const enabledApps = apps.filter((a) => a.enabled)
  if (enabledApps.length === 0) return

  // Check which enabled apps are NOT already running
  const notRunning: typeof apps = []
  for (const appInfo of enabledApps) {
    const running = await isProcessRunning(appInfo.processName)
    if (!running) notRunning.push(appInfo)
  }

  // All companion apps already active — nothing to do
  if (notRunning.length === 0) return

  // Build a single dialog listing all missing apps
  const appList = notRunning
    .map((a) => `  • ${a.name}  —  needed for ${a.feature}`)
    .join('\n')

  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: 'Ask Dave — Companion Apps',
    message: 'Some companion apps are not running',
    detail: `The following apps need to be active for full functionality:\n\n${appList}\n\nWould you like to open them now?`,
    buttons: ['Open All', 'Skip'],
    defaultId: 0,
    cancelId: 1,
    noLink: true
  })

  if (response === 0) {
    for (const appInfo of notRunning) {
      appInfo.launch()
    }
  }
}

// Single instance lock: if another instance launches, focus the existing panel
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}
app.on('second-instance', () => {
  showPanel()
})

// Track the currently active phone number for hotkey actions
let activeNumber: string | null = null

function getActiveNumber(): string | null {
  return activeNumber
}

function buildHotkeyConfig(): HotkeyConfig {
  return {
    dialEnabled: store.get('hotkeysEnabled'),
    dialKey: store.get('dialHotkey'),
    whatsappEnabled: store.get('hotkeysEnabled'),
    whatsappKey: store.get('whatsappHotkey')
  }
}

/**
 * Callback when a phone number is detected from clipboard.
 */
function onPhoneDetected(e164: string, displayNumber: string): void {
  activeNumber = e164

  const panelWindow = getPanelWindow()
  if (panelWindow && !panelWindow.isDestroyed()) {
    panelWindow.webContents.send('phone:detected', e164, displayNumber)
  }

  // Show panel near cursor if auto-show is enabled
  if (store.get('popupAutoShow')) {
    showPanelNearCursor()
  }
}

/**
 * Callback when an email address is detected from clipboard.
 */
function onEmailDetected(email: string): void {
  const panelWindow = getPanelWindow()
  if (panelWindow && !panelWindow.isDestroyed()) {
    panelWindow.webContents.send('email:detected', email)
  }

  if (store.get('popupAutoShow')) {
    showPanelNearCursor()
  }
}

/**
 * Callback when multiple contact fields are extracted from a text block.
 */
function onContactExtracted(info: { e164?: string; displayNumber?: string; email?: string; name?: string; unit?: string }): void {
  if (info.e164) activeNumber = info.e164

  const panelWindow = getPanelWindow()
  if (panelWindow && !panelWindow.isDestroyed()) {
    panelWindow.webContents.send('contact:extracted', info)
  }

  showPanelNearCursor()
}

let selectionShortcutKey: string | null = null

function registerSelectionHotkey(): void {
  // Unregister previous selection hotkey if set
  if (selectionShortcutKey) {
    globalShortcut.unregister(selectionShortcutKey)
    selectionShortcutKey = null
  }

  if (!store.get('hotkeysEnabled')) return

  const key = store.get('selectionHotkey')
  if (!key) return

  const ok = globalShortcut.register(key, () => {
    grabSelectionAndDetectPhone(onPhoneDetected, onEmailDetected, onContactExtracted)
  })
  if (ok) {
    selectionShortcutKey = key
  } else {
    console.warn(`Selection hotkey ${key} could not be registered (conflict)`)
  }
}

app.whenReady().then(() => {
  // Create tray and windows
  const tray = createTray()
  const panel = createTrayPanel(tray)

  // Keep panel hidden on startup — lives in tray until needed
  // (panel.show = false in constructor, no action needed here)

  // Register IPC handlers
  registerIPCHandlers()

  // Register global hotkeys (Dial + WhatsApp shortcuts)
  if (store.get('hotkeysEnabled')) {
    registerHotkeys(buildHotkeyConfig(), getActiveNumber, store.get('whatsappMode'))
  }

  // Register selection hotkey (grab highlighted text → detect phone → show panel)
  registerSelectionHotkey()

  // Start clipboard watcher for phone number detection
  if (store.get('clipboardEnabled')) {
    startClipboardWatcher(onPhoneDetected, onEmailDetected)
  }

  // Set login item so app starts on login
  app.setLoginItemSettings({
    openAtLogin: true,
    ...(process.platform === 'darwin' ? { type: 'mainAppService' as const } : {})
  })

  // Initialize auto-updater
  setupAutoUpdater()

  // Start Phone Link watcher for incoming call detection (Windows only)
  if (process.platform === 'win32' && store.get('phoneLinkEnabled')) {
    startPhoneLinkWatcher()
  }

  // Start news feed background refresh (initial fetch + 30-minute interval)
  if (store.get('newsEnabled')) {
    fetchNews().catch(console.error)
    setInterval(() => {
      if (store.get('newsEnabled')) fetchNews().catch(console.error)
    }, 30 * 60 * 1000)
  }

  // Prompt to launch companion apps after a short delay (let the tray settle)
  setTimeout(() => {
    promptCompanionApps().catch(console.error)
  }, 1500)

  // Listen for store changes to re-register hotkeys dynamically
  store.onDidChange('dialHotkey', () => {
    unregisterHotkeys()
    if (store.get('hotkeysEnabled')) {
      registerHotkeys(buildHotkeyConfig(), getActiveNumber, store.get('whatsappMode'))
    }
  })

  store.onDidChange('whatsappHotkey', () => {
    unregisterHotkeys()
    if (store.get('hotkeysEnabled')) {
      registerHotkeys(buildHotkeyConfig(), getActiveNumber, store.get('whatsappMode'))
    }
  })

  store.onDidChange('hotkeysEnabled', () => {
    unregisterHotkeys()
    if (store.get('hotkeysEnabled')) {
      registerHotkeys(buildHotkeyConfig(), getActiveNumber, store.get('whatsappMode'))
    }
    registerSelectionHotkey()
  })

  store.onDidChange('selectionHotkey', () => {
    registerSelectionHotkey()
  })

  store.onDidChange('clipboardEnabled', () => {
    stopClipboardWatcher()
    if (store.get('clipboardEnabled')) {
      startClipboardWatcher(onPhoneDetected, onEmailDetected)
    }
  })

  store.onDidChange('phoneLinkEnabled', () => {
    stopPhoneLinkWatcher()
    if (process.platform === 'win32' && store.get('phoneLinkEnabled')) {
      startPhoneLinkWatcher()
    }
  })
})

// Stop watcher and unregister hotkeys on quit
app.on('will-quit', () => {
  unregisterHotkeys()
  stopClipboardWatcher()
  stopPhoneLinkWatcher()
  stopTranscriberServer()
})

// Tray app: do not quit when all windows close
app.on('window-all-closed', () => {
  // Intentionally empty: keep app running in tray
})
