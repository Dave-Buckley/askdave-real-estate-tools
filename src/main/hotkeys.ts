import { globalShortcut } from 'electron'
import { HotkeyConfig } from '../shared/types'
import { openDialler, openWhatsApp } from './actions'

/**
 * Register global hotkeys for dial and WhatsApp actions.
 * Must be called after app.whenReady().
 *
 * @param config - Hotkey configuration with enabled flags and key combos
 * @param getActiveNumber - Callback that returns the currently active phone number, or null
 * @param whatsappMode - Current WhatsApp mode preference
 */
export function registerHotkeys(
  config: HotkeyConfig,
  getActiveNumber: () => string | null,
  whatsappMode: 'web' | 'desktop'
): void {
  if (config.dialEnabled) {
    const ok = globalShortcut.register(config.dialKey, () => {
      const number = getActiveNumber()
      if (number) {
        openDialler(number)
      }
    })
    if (!ok) {
      console.warn(`Hotkey ${config.dialKey} could not be registered (conflict with another app)`)
    }
  }

  if (config.whatsappEnabled) {
    const ok = globalShortcut.register(config.whatsappKey, () => {
      const number = getActiveNumber()
      if (number) {
        openWhatsApp(number, whatsappMode)
      }
    })
    if (!ok) {
      console.warn(`Hotkey ${config.whatsappKey} could not be registered (conflict with another app)`)
    }
  }
}

/**
 * Unregister all global shortcuts.
 * Should be called on app will-quit.
 */
export function unregisterHotkeys(): void {
  globalShortcut.unregisterAll()
}
