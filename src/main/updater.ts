import { autoUpdater } from 'electron-updater'

/**
 * Initialize auto-updater. Checks for updates on launch and installs silently on quit.
 * Fails gracefully in dev mode where no update config exists.
 */
export function setupAutoUpdater(): void {
  try {
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.checkForUpdatesAndNotify()
  } catch (err) {
    // Expected to fail in dev mode — no app-update.yml present
    console.log('Auto-updater not available (likely dev mode):', err)
  }
}
