import { ipcMain, shell } from 'electron'
import { store } from './store'
import { openDialler, openWhatsApp, buildWhatsAppURL } from './actions'
import { hidePopup } from './tray'
import { Template } from '../shared/types'

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

  ipcMain.on('action:whatsapp-with-message', (_event, e164: string, message: string) => {
    const url = buildWhatsAppURL(e164, message)
    shell.openExternal(url)
  })

  ipcMain.on('popup:dismiss', () => {
    hidePopup()
  })

  ipcMain.on('popup:dial', (_event, e164: string) => {
    openDialler(e164)
    hidePopup()
  })

  ipcMain.on('popup:whatsapp', (_event, e164: string) => {
    const mode = store.get('whatsappMode')
    openWhatsApp(e164, mode)
    hidePopup()
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
    return templates
  })

  ipcMain.handle('store:addTemplate', (_event, template: Template) => {
    const templates = store.get('templates')
    templates.push(template)
    store.set('templates', templates)
    return templates
  })

  ipcMain.handle('store:deleteTemplate', (_event, id: string) => {
    const templates = store.get('templates').filter((t: Template) => t.id !== id)
    store.set('templates', templates)
    return templates
  })

  ipcMain.handle('store:updateTemplate', (_event, template: Template) => {
    const templates = store.get('templates').map((t: Template) =>
      t.id === template.id ? template : t
    )
    store.set('templates', templates)
    return templates
  })
}
