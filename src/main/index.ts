import { app, globalShortcut } from 'electron'
import { store } from './store'
import { createTray, createTrayPanel, createPopupWindow, showPopup, showPanel, getPanelWindow } from './tray'
import { startClipboardWatcher, stopClipboardWatcher } from './clipboard'
import { registerHotkeys, unregisterHotkeys } from './hotkeys'
import { grabSelectionAndDetectPhone } from './selection'
import { registerIPCHandlers } from './ipc'
import { setupAutoUpdater } from './updater'
import { restoreGoogleTokens } from './auth/google'
import { startPhoneLinkWatcher, stopPhoneLinkWatcher } from './phone-link'

import { HotkeyConfig } from '../shared/types'

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

  // Only auto-show popup if the setting is enabled
  if (store.get('popupAutoShow')) {
    showPopup(e164, displayNumber)
  }

  // Always send to panel regardless of popup preference
  const panelWindow = getPanelWindow()
  if (panelWindow && !panelWindow.isDestroyed()) {
    panelWindow.webContents.send('phone:detected', e164, displayNumber)
  }
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
    grabSelectionAndDetectPhone(onPhoneDetected)
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
  createPopupWindow(tray)

  // Show panel minimized in taskbar so it's always accessible
  panel.once('ready-to-show', () => {
    panel.minimize()
    panel.show()
  })

  // Register IPC handlers
  registerIPCHandlers()

  // Register global hotkeys (Dial + WhatsApp shortcuts)
  if (store.get('hotkeysEnabled')) {
    registerHotkeys(buildHotkeyConfig(), getActiveNumber, store.get('whatsappMode'))
  }

  // Register selection hotkey (grab highlighted text → detect phone → show popup)
  registerSelectionHotkey()

  // Start clipboard watcher for phone number detection
  if (store.get('clipboardEnabled')) {
    startClipboardWatcher(onPhoneDetected)
  }

  // Set login item so app starts on login
  app.setLoginItemSettings({
    openAtLogin: true,
    ...(process.platform === 'darwin' ? { type: 'mainAppService' as const } : {})
  })

  // Restore Google OAuth tokens from encrypted storage
  restoreGoogleTokens()

  // Initialize auto-updater
  setupAutoUpdater()

  // Start Phone Link watcher for incoming call detection (Windows only)
  if (process.platform === 'win32' && store.get('phoneLinkEnabled')) {
    startPhoneLinkWatcher()
  }

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
      startClipboardWatcher(onPhoneDetected)
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
})

// Tray app: do not quit when all windows close
app.on('window-all-closed', () => {
  // Intentionally empty: keep app running in tray
})
