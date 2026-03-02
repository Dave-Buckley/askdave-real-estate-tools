import { app } from 'electron'
import { store } from './store'
import { createTray, createTrayPanel, createPopupWindow, showPopup, getPanelWindow } from './tray'
import { startClipboardPolling, stopClipboardPolling } from './clipboard'
import { registerHotkeys, unregisterHotkeys } from './hotkeys'
import { registerIPCHandlers } from './ipc'
import { setupAutoUpdater } from './updater'
import { HotkeyConfig } from '../shared/types'

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

app.whenReady().then(() => {
  // Create tray and windows
  const tray = createTray()
  createTrayPanel(tray)
  createPopupWindow(tray)

  // Register IPC handlers
  registerIPCHandlers()

  // Register global hotkeys
  if (store.get('hotkeysEnabled')) {
    registerHotkeys(buildHotkeyConfig(), getActiveNumber, store.get('whatsappMode'))
  }

  // Start clipboard polling if enabled
  if (store.get('clipboardEnabled')) {
    startClipboardPolling((e164, displayNumber) => {
      activeNumber = e164
      showPopup(e164, displayNumber)

      // Also notify the panel renderer
      const panelWindow = getPanelWindow()
      if (panelWindow && !panelWindow.isDestroyed()) {
        panelWindow.webContents.send('phone:detected', e164, displayNumber)
      }
    })
  }

  // Set login item — app starts on login
  app.setLoginItemSettings({
    openAtLogin: true,
    ...(process.platform === 'darwin' ? { type: 'mainAppService' as const } : {})
  })

  // Initialize auto-updater
  setupAutoUpdater()

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
  })

  store.onDidChange('clipboardEnabled', () => {
    stopClipboardPolling()
    if (store.get('clipboardEnabled')) {
      startClipboardPolling((e164, displayNumber) => {
        activeNumber = e164
        showPopup(e164, displayNumber)

        const panelWindow = getPanelWindow()
        if (panelWindow && !panelWindow.isDestroyed()) {
          panelWindow.webContents.send('phone:detected', e164, displayNumber)
        }
      })
    }
  })
})

// Unregister hotkeys and stop polling on quit
app.on('will-quit', () => {
  unregisterHotkeys()
  stopClipboardPolling()
})

// Tray app — do not quit when all windows close
app.on('window-all-closed', () => {
  // Intentionally empty — keep app running in tray
})
