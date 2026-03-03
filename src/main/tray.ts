import path from 'path'
import { Tray, BrowserWindow, screen, Menu, nativeImage, app } from 'electron'
import { existsSync } from 'fs'

const COMPACT_WIDTH = 320
const COMPACT_HEIGHT = 260
const FULL_WIDTH = 380
const FULL_HEIGHT = 680

let trayInstance: Tray | null = null
let panelWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null
let isQuitting = false

/**
 * Create the system tray icon with a context menu.
 */
export function createTray(): Tray {
  // Load tray icon — prefer .ico on Windows for crisp multi-resolution rendering
  const resourcePath = process.resourcesPath ?? path.join(app.getAppPath(), '..', '..')

  const candidates = [
    // Prefer .ico on Windows (native format, best quality at all DPI scales)
    path.join(resourcePath, 'icons', 'icon.ico'),
    path.join(process.cwd(), 'build', 'icons', 'icon.ico'),
    // Fallback to PNG
    path.join(resourcePath, 'icons', 'icon_32.png'),
    path.join(resourcePath, 'icons', 'icon_16.png'),
    path.join(process.cwd(), 'build', 'icons', 'icon_32.png'),
    path.join(process.cwd(), 'build', 'icons', 'icon_16.png')
  ]

  let icon = nativeImage.createEmpty()
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      const img = nativeImage.createFromPath(candidate)
      // Only resize PNGs; .ico files contain their own multi-res data
      icon = candidate.endsWith('.ico') ? img : img.resize({ width: 16, height: 16 })
      break
    }
  }
  trayInstance = new Tray(icon)
  trayInstance.setToolTip('Ask Dave Real Estate Tools')

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Panel', click: () => panelWindow?.isVisible() ? panelWindow.hide() : showPanel() },
    { label: 'Settings', click: () => showSettings() },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit() } }
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
 * Create the panel window (resizable, minimizable, shows in taskbar).
 */
export function createTrayPanel(tray: Tray): BrowserWindow {
  panelWindow = new BrowserWindow({
    width: FULL_WIDTH,
    height: FULL_HEIGHT,
    minWidth: COMPACT_WIDTH,
    minHeight: COMPACT_HEIGHT,
    maxWidth: 600,
    maxHeight: 900,
    title: 'Ask Dave Real Estate Tools',
    icon: (() => {
      // Use the 256px icon (white A on black) for window/taskbar
      const resourcePath = process.resourcesPath ?? path.join(app.getAppPath(), '..', '..')
      const prodIcon = path.join(resourcePath, 'icons', 'icon_256.png')
      const devIcon = path.join(process.cwd(), 'build', 'icons', 'icon_256.png')
      const iconFile = existsSync(prodIcon) ? prodIcon : existsSync(devIcon) ? devIcon : ''
      return iconFile ? nativeImage.createFromPath(iconFile) : undefined
    })(),
    frame: false,
    thickFrame: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    skipTaskbar: false,
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

  // Close (X button) → hide to tray. Only truly close when quitting.
  panelWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      panelWindow?.hide()
    }
  })

  return panelWindow
}

// Allow quitting from app.quit()
app.on('before-quit', () => {
  isQuitting = true
})

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
 * Force-show a window even from hidden/minimized state.
 * Uses setAlwaysOnTop trick to bypass Windows focus-stealing prevention.
 */
function forceShow(win: BrowserWindow): void {
  if (win.isMinimized()) win.restore()
  win.show()
  // Temporarily pin on top to guarantee visibility on Windows
  win.setAlwaysOnTop(true)
  win.focus()
  win.setAlwaysOnTop(false)
}

/**
 * Show the panel window positioned near the tray (full size).
 */
export function showPanel(): void {
  if (!panelWindow || !trayInstance) return
  panelWindow.setResizable(true)
  panelWindow.setMinimumSize(320, 400)
  panelWindow.setSize(FULL_WIDTH, FULL_HEIGHT)
  panelWindow.webContents.send('panel:set-mode', 'expanded')
  positionNearTray(trayInstance, panelWindow)
  forceShow(panelWindow)
}

/**
 * Position a window near the mouse cursor, clamped to screen bounds.
 * Uses explicit width/height instead of getBounds() since bounds may be stale.
 */
function positionNearCursor(win: BrowserWindow, width: number, height: number): void {
  const cursor = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursor)
  const area = display.workArea

  // Position slightly offset from cursor (below-right)
  let x = cursor.x + 12
  let y = cursor.y + 12

  // If it would go off the right edge, put it to the left of cursor
  if (x + width > area.x + area.width) {
    x = cursor.x - width - 12
  }
  // If it would go off the bottom edge, put it above cursor
  if (y + height > area.y + area.height) {
    y = cursor.y - height - 12
  }

  // Clamp to work area
  x = Math.max(area.x, Math.min(x, area.x + area.width - width))
  y = Math.max(area.y, Math.min(y, area.y + area.height - height))

  win.setPosition(Math.round(x), Math.round(y))
}

/**
 * Show the panel window in compact mode near the mouse cursor.
 * Used when a phone number is detected from clipboard.
 * Always repositions (even if already visible) so it tracks cursor.
 */
export function showPanelNearCursor(): void {
  if (!panelWindow) return
  panelWindow.setResizable(true)
  panelWindow.setMinimumSize(COMPACT_WIDTH, COMPACT_HEIGHT)
  panelWindow.setSize(COMPACT_WIDTH, COMPACT_HEIGHT)
  panelWindow.webContents.send('panel:set-mode', 'compact')
  positionNearCursor(panelWindow, COMPACT_WIDTH, COMPACT_HEIGHT)
  forceShow(panelWindow)
}

/**
 * Expand the panel from compact to full size, keeping current position
 * and clamping to screen bounds.
 */
export function expandPanel(): void {
  if (!panelWindow) return
  const [x, y] = panelWindow.getPosition()
  panelWindow.setResizable(true)
  panelWindow.setMinimumSize(320, 400)
  panelWindow.setSize(FULL_WIDTH, FULL_HEIGHT)
  panelWindow.webContents.send('panel:set-mode', 'expanded')

  // Re-clamp to screen bounds after resize
  const display = screen.getDisplayNearestPoint({ x, y })
  const area = display.workArea
  const clampedX = Math.max(area.x, Math.min(x, area.x + area.width - FULL_WIDTH))
  const clampedY = Math.max(area.y, Math.min(y, area.y + area.height - FULL_HEIGHT))
  panelWindow.setPosition(Math.round(clampedX), Math.round(clampedY))
}

/**
 * Show or create the settings window.
 */
export function showSettings(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show()
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 450,
    height: 650,
    resizable: true,
    title: 'Ask Dave Real Estate Tools Settings',
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
