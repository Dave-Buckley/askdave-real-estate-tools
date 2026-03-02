import path from 'path'
import { Tray, BrowserWindow, screen, Menu, nativeImage, app } from 'electron'

let trayInstance: Tray | null = null
let panelWindow: BrowserWindow | null = null
let popupWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null

/**
 * Create the system tray icon with a context menu.
 */
export function createTray(): Tray {
  // Use a simple default icon — will be replaced with a designed icon later
  const icon = nativeImage.createEmpty()
  trayInstance = new Tray(icon)
  trayInstance.setToolTip('Agent Kit')

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Panel', click: () => panelWindow?.isVisible() ? panelWindow.hide() : showPanel() },
    { label: 'Settings', click: () => showSettings() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])

  trayInstance.on('click', () => {
    if (panelWindow?.isVisible()) {
      panelWindow.hide()
    } else {
      showPanel()
    }
  })

  trayInstance.on('right-click', () => {
    trayInstance?.popUpContextMenu(contextMenu)
  })

  return trayInstance
}

/**
 * Create the tray panel window (360x480 frameless dropdown).
 */
export function createTrayPanel(tray: Tray): BrowserWindow {
  panelWindow = new BrowserWindow({
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
      sandbox: true
    }
  })

  // Load the panel renderer HTML
  if (process.env['ELECTRON_RENDERER_URL']) {
    panelWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/panel/index.html`)
  } else {
    panelWindow.loadFile(path.join(__dirname, '../renderer/panel/index.html'))
  }

  // Hide panel when it loses focus
  panelWindow.on('blur', () => {
    panelWindow?.hide()
  })

  return panelWindow
}

/**
 * Create the clipboard popup floating window (320x60 frameless transparent).
 */
export function createPopupWindow(tray: Tray): BrowserWindow {
  popupWindow = new BrowserWindow({
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
      sandbox: true
    }
  })

  // Load the popup renderer HTML
  if (process.env['ELECTRON_RENDERER_URL']) {
    popupWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/popup/index.html`)
  } else {
    popupWindow.loadFile(path.join(__dirname, '../renderer/popup/index.html'))
  }

  return popupWindow
}

/**
 * Position a window near the system tray icon.
 * Above tray on Windows (taskbar at bottom), below menu bar on macOS.
 */
function positionNearTray(tray: Tray, win: BrowserWindow): void {
  const trayBounds = tray.getBounds()
  const winBounds = win.getBounds()
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })

  // Determine if the taskbar is at the bottom of the screen
  const taskbarAtBottom = trayBounds.y > display.bounds.height / 2

  const panelX = Math.round(trayBounds.x + trayBounds.width / 2 - winBounds.width / 2)
  const panelY = taskbarAtBottom
    ? trayBounds.y - winBounds.height // Above tray on Windows
    : trayBounds.y + trayBounds.height // Below menu bar on macOS

  // Clamp to screen bounds
  const clampedX = Math.max(display.bounds.x, Math.min(panelX, display.bounds.x + display.bounds.width - winBounds.width))
  const clampedY = Math.max(display.bounds.y, panelY)

  win.setPosition(clampedX, clampedY)
}

/**
 * Show the panel window positioned near the tray.
 */
function showPanel(): void {
  if (!panelWindow || !trayInstance) return
  positionNearTray(trayInstance, panelWindow)
  panelWindow.show()
  panelWindow.focus()
}

/**
 * Show the popup with phone number data.
 */
export function showPopup(e164: string, displayNumber: string): void {
  if (!popupWindow || !trayInstance) return
  positionNearTray(trayInstance, popupWindow)
  popupWindow.webContents.send('popup:show', e164, displayNumber)
  popupWindow.show()
}

/**
 * Hide the popup window.
 */
export function hidePopup(): void {
  if (popupWindow) {
    popupWindow.hide()
  }
}

/**
 * Show or create the settings window.
 */
function showSettings(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show()
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 450,
    height: 500,
    resizable: false,
    title: 'Agent Kit Settings',
    webPreferences: {
      preload: path.join(__dirname, '../preload/settings.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    settingsWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/settings/index.html`)
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../renderer/settings/index.html'))
  }

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}

/**
 * Get the panel window reference (for IPC).
 */
export function getPanelWindow(): BrowserWindow | null {
  return panelWindow
}

/**
 * Get the popup window reference (for IPC).
 */
export function getPopupWindow(): BrowserWindow | null {
  return popupWindow
}
