import { app, ipcMain, shell, clipboard, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { store, DEFAULT_ROLE_TEMPLATES } from './store'
import { openDialler, openWhatsApp, buildWhatsAppURL } from './actions'
import { setSkipNextClipboardChange, suppressDetection } from './clipboard'
import { getPanelWindow, showSettings, showPanel, expandPanel } from './tray'
import { Template, ContactRole, FormTemplateOverride, CardProgress } from '../shared/types'
import { openContactPage, openNotebookSection, pushNotesToOneNote } from './onenote'
import { openCalendarBooking, createFollowUp } from './calendar'
import { getContact, upsertContact, addRole, removeRole, listContacts, deleteContact } from './contacts'
import type { Contact, ContactRole as ContactRoleType } from '../shared/types'
import { fetchNews, getCachedNews, getLastFetched } from './news'
import { startServer, stopServer, getServerState, onStateChange, getReceivedAudio } from './transcriber-server'

/**
 * Broadcast updated templates to all renderer windows so they stay in sync.
 */
function broadcastTemplates(templates: Template[]): void {
  const panel = getPanelWindow()
  if (panel && !panel.isDestroyed()) {
    panel.webContents.send('templates:updated', templates)
  }
}

/**
 * Register all IPC handlers for main-to-renderer communication.
 */
export function registerIPCHandlers(): void {
  // --- One-way: renderer -> main ---

  ipcMain.on('action:dial', (_event, e164: string) => {
    openDialler(e164)
  })

  ipcMain.on('action:whatsapp', (_event, e164: string, mode: 'web' | 'desktop') => {
    openWhatsApp(e164, mode)
  })

  ipcMain.on('action:whatsapp-with-message', (_event, e164: string, message: string, mode: 'web' | 'desktop') => {
    const url = buildWhatsAppURL(e164, message, mode)
    shell.openExternal(url)
  })

  ipcMain.on('panel:close', () => {
    const panel = getPanelWindow()
    if (panel) panel.hide()
    suppressDetection(15000) // 15s quiet then allow re-detection
  })

  ipcMain.on('panel:minimize', () => {
    const panel = getPanelWindow()
    if (panel) panel.minimize()
    suppressDetection(15000)
  })

  ipcMain.on('panel:maximize', () => {
    const panel = getPanelWindow()
    if (!panel) return
    if (panel.isMaximized()) {
      panel.unmaximize()
    } else {
      panel.maximize()
    }
  })

  ipcMain.on('panel:copy-number', (_event, e164: string) => {
    setSkipNextClipboardChange()
    clipboard.writeText(e164)
  })

  ipcMain.on('panel:expand', () => {
    expandPanel()
  })

  // Action done — suppress clipboard re-detection (panel stays visible)
  ipcMain.on('panel:action-done', () => {
    suppressDetection()
  })

  // Name sync — broadcast to all panel windows except sender
  ipcMain.on('name:changed', (event, e164: string, name: string) => {
    const panel = getPanelWindow()
    if (panel && !panel.isDestroyed() && panel.webContents !== event.sender) {
      panel.webContents.send('name:updated', e164, name)
    }
  })

  // --- Two-way: renderer -> main -> renderer ---

  ipcMain.handle('store:getSettings', () => {
    return store.store
  })

  ipcMain.handle('store:saveSettings', (_event, settings: Partial<Record<string, unknown>>) => {
    for (const [key, value] of Object.entries(settings)) {
      store.set(key as keyof typeof store.store, value as never)
    }
  })

  ipcMain.handle('store:getTemplates', () => {
    return store.get('templates')
  })

  ipcMain.handle('store:saveTemplates', (_event, templates: Template[]) => {
    store.set('templates', templates)
    broadcastTemplates(templates)
    return templates
  })

  ipcMain.handle('store:addTemplate', (_event, template: Template) => {
    const templates = store.get('templates')
    templates.push(template)
    store.set('templates', templates)
    broadcastTemplates(templates)
    return templates
  })

  ipcMain.handle('store:deleteTemplate', (_event, id: string) => {
    const templates = store.get('templates').filter((t: Template) => t.id !== id)
    store.set('templates', templates)
    broadcastTemplates(templates)
    return templates
  })

  ipcMain.handle('store:updateTemplate', (_event, template: Template) => {
    const templates = store.get('templates').map((t: Template) =>
      t.id === template.id ? template : t
    )
    store.set('templates', templates)
    broadcastTemplates(templates)
    return templates
  })

  ipcMain.handle('store:getRoleTemplates', () => {
    return store.get('oneNoteRoleTemplates') ?? DEFAULT_ROLE_TEMPLATES
  })

  ipcMain.handle('store:saveRoleTemplate', (_event, role: ContactRole, template: { label: string; questions: string[]; documents: string[] }) => {
    const current = store.get('oneNoteRoleTemplates') ?? DEFAULT_ROLE_TEMPLATES
    const updated = { ...current, [role]: template }
    store.set('oneNoteRoleTemplates', updated)
    return updated
  })

  // --- Form template overrides ---

  ipcMain.handle('store:getFormOverrides', () => {
    return store.get('formOverrides') ?? {}
  })

  ipcMain.handle('store:saveFormOverride', (_event, formId: string, override: FormTemplateOverride) => {
    const current = store.get('formOverrides') ?? {}
    const updated = { ...current, [formId]: override }
    store.set('formOverrides', updated)
    return updated
  })

  ipcMain.handle('store:resetFormOverride', (_event, formId: string) => {
    const current = store.get('formOverrides') ?? {}
    const { [formId]: _, ...rest } = current
    store.set('formOverrides', rest)
    return rest
  })

  ipcMain.on('panel:open-settings', () => {
    showSettings()
  })

  // --- OneNote ---

  ipcMain.handle('onenote:open', async (_event, data: { name: string; displayNumber: string; roles: ContactRole[]; e164: string; unit?: string; email?: string }) => {
    const result = await openContactPage(data)
    return result  // { success, error?, pageId? }
  })

  ipcMain.handle('onenote:open-section', async () => {
    return await openNotebookSection()
  })

  ipcMain.handle('onenote:push-notes', async (_event, data: {
    e164: string; name: string; displayNumber: string; notes: string;
    role?: ContactRole; unit?: string; email?: string
  }) => {
    return await pushNotesToOneNote(data)
  })

  // --- Calendar ---

  ipcMain.handle('calendar:book', async (_event, data: { name: string; displayNumber: string; roles: ContactRole[]; e164: string; unit?: string; email?: string }, type: 'viewing' | 'consultation', templateBody?: string) => {
    await openCalendarBooking(data, type, templateBody)
  })

  ipcMain.handle('calendar:follow-up', async (_event, data: { name: string; displayNumber: string; roles: string[]; e164: string }, days: number) => {
    return await createFollowUp(data, days)
  })

  // --- Contacts ---

  ipcMain.handle('contacts:get', (_event, e164: string) => {
    return getContact(e164)
  })

  ipcMain.handle('contacts:upsert', (_event, e164: string, data: Partial<Contact>) => {
    return upsertContact(e164, data)
  })

  ipcMain.handle('contacts:add-role', (_event, e164: string, role: ContactRoleType) => {
    return addRole(e164, role)
  })

  ipcMain.handle('contacts:remove-role', (_event, e164: string, role: ContactRoleType) => {
    return removeRole(e164, role)
  })

  ipcMain.handle('contacts:list', () => {
    return listContacts()
  })

  ipcMain.handle('contacts:delete', (_event, e164: string) => {
    deleteContact(e164)
  })

  // --- News ---

  ipcMain.handle('news:get', async () => {
    const STALE_MS = 30 * 60 * 1000
    if (Date.now() - getLastFetched() < STALE_MS && getCachedNews().length > 0) {
      return { items: getCachedNews(), lastFetched: getLastFetched() }
    }
    const items = await fetchNews()
    return { items, lastFetched: getLastFetched() }
  })

  // --- Forms ---

  ipcMain.handle('forms:get-dir', () => {
    // In production: resources/forms/ next to app.asar
    // In dev: build/forms/ in project root
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'forms')
    }
    return path.join(app.getAppPath(), 'build', 'forms')
  })

  ipcMain.handle('forms:save-as', async (_event, subFolder: string, fileName: string) => {
    const formsRoot = app.isPackaged
      ? path.join(process.resourcesPath, 'forms')
      : path.join(app.getAppPath(), 'build', 'forms')
    const sourcePath = path.join(formsRoot, subFolder, fileName)

    const panel = getPanelWindow()
    const { canceled, filePath } = await dialog.showSaveDialog(panel!, {
      defaultPath: fileName,
      filters: [{ name: 'All Files', extensions: ['*'] }]
    })
    if (canceled || !filePath) return { success: false }

    fs.copyFileSync(sourcePath, filePath)
    shell.showItemInFolder(filePath)
    return { success: true, path: filePath }
  })

  // --- Flashcard progress ---

  ipcMain.handle('flashcard:getProgress', () => {
    return store.get('flashcardProgress') ?? {}
  })

  ipcMain.handle('flashcard:saveProgress', (_event, cardId: string, progress: CardProgress) => {
    const current = store.get('flashcardProgress') ?? {}
    const updated = { ...current, [cardId]: progress }
    store.set('flashcardProgress', updated)
    return updated
  })

  // --- Client Folders ---

  ipcMain.handle('client-folder:get-root', () => {
    const stored = store.get('completedFormsDir')
    if (stored) return stored
    // Default: Documents/Real Estate/Completed Forms
    return path.join(app.getPath('documents'), 'Real Estate', 'Completed Forms')
  })

  ipcMain.handle('client-folder:pick-root', async () => {
    const panel = getPanelWindow()
    const { canceled, filePaths } = await dialog.showOpenDialog(panel!, {
      title: 'Select Completed Forms Root Folder',
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: store.get('completedFormsDir') || path.join(app.getPath('documents'), 'Real Estate', 'Completed Forms')
    })
    if (canceled || !filePaths[0]) return { success: false }
    store.set('completedFormsDir', filePaths[0])
    return { success: true, path: filePaths[0] }
  })

  ipcMain.handle('client-folder:create', (_event, category: string, clientName: string) => {
    const root = store.get('completedFormsDir') || path.join(app.getPath('documents'), 'Real Estate', 'Completed Forms')
    const folderPath = path.join(root, category, clientName)
    const exists = fs.existsSync(folderPath)
    if (!exists) {
      fs.mkdirSync(folderPath, { recursive: true })
    }
    shell.openPath(folderPath)
    return { success: true, path: folderPath, created: !exists }
  })

  ipcMain.handle('client-folder:check', (_event, category: string, clientName: string) => {
    const root = store.get('completedFormsDir') || path.join(app.getPath('documents'), 'Real Estate', 'Completed Forms')
    const folderPath = path.join(root, category, clientName)
    return { exists: fs.existsSync(folderPath), path: folderPath }
  })

  // --- Shell ---

  ipcMain.handle('shell:open-external', (_event, url: string) => {
    shell.openExternal(url)
  })

  ipcMain.handle('shell:show-item', (_event, filePath: string) => {
    shell.showItemInFolder(filePath)
  })

  // --- Transcriber (WiFi server) ---

  ipcMain.handle('transcriber:start-server', async () => {
    try {
      const { port, url } = await startServer()
      // Register state change callback to relay to renderer
      onStateChange((status) => {
        const panel = getPanelWindow()
        if (panel && !panel.isDestroyed()) {
          panel.webContents.send('transcriber:state', status)
        }
      })
      return { success: true, url, port }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('transcriber:stop-server', () => {
    stopServer()
    return { success: true }
  })

  ipcMain.handle('transcriber:get-state', () => {
    return getServerState()
  })

  ipcMain.handle('transcriber:get-audio', () => {
    return getReceivedAudio()
  })
}
