import { ipcMain, shell, clipboard } from 'electron'
import { store } from './store'
import { openDialler, openWhatsApp, buildWhatsAppURL } from './actions'
import { setSkipNextClipboardChange } from './clipboard'
import { hidePopup, getPanelWindow, getPopupWindow, showSettings, showPanel } from './tray'
import { Template, ContactRole, AuthState } from '../shared/types'
import { openContactPage } from './onenote'
import { openCalendarBooking, createFollowUp } from './calendar'
import { microsoftSignIn, microsoftSignOut, microsoftGetAccount } from './auth/microsoft'
import { googleSignIn, googleSignOut, isGoogleConnected, googleGetEmail } from './auth/google'
import { getContact, upsertContact, addRole, removeRole, listContacts, deleteContact } from './contacts'
import type { Contact, ContactRole as ContactRoleType } from '../shared/types'

/**
 * Broadcast updated templates to all renderer windows so they stay in sync.
 */
function broadcastTemplates(templates: Template[]): void {
  const panel = getPanelWindow()
  const popup = getPopupWindow()
  if (panel && !panel.isDestroyed()) {
    panel.webContents.send('templates:updated', templates)
  }
  if (popup && !popup.isDestroyed()) {
    popup.webContents.send('templates:updated', templates)
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

  ipcMain.on('action:whatsapp-with-message', (_event, e164: string, message: string) => {
    const url = buildWhatsAppURL(e164, message)
    shell.openExternal(url)
  })

  ipcMain.on('panel:close', () => {
    const panel = getPanelWindow()
    if (panel) panel.hide()
  })

  ipcMain.on('popup:dismiss', () => {
    hidePopup()
  })

  ipcMain.on('popup:copy-number', (_event, e164: string) => {
    setSkipNextClipboardChange()
    clipboard.writeText(e164)
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

  ipcMain.on('popup:whatsapp-with-message', (_event, e164: string, message: string) => {
    const url = buildWhatsAppURL(e164, message)
    shell.openExternal(url)
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
    // Broadcast settings update to popup so inline dropdown stays in sync
    const popup = getPopupWindow()
    if (popup && !popup.isDestroyed()) {
      popup.webContents.send('settings:updated', store.store)
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

  // --- Popup window control ---

  ipcMain.on('popup:minimize', () => {
    const popup = getPopupWindow()
    if (!popup) return
    popup.minimize()
  })

  ipcMain.on('popup:restore', () => {
    const popup = getPopupWindow()
    if (!popup) return
    popup.restore()
    popup.focus()
  })

  ipcMain.on('popup:open-settings', () => {
    showSettings()
  })

  ipcMain.on('popup:show-panel', () => {
    showPanel()
  })

  // --- Name sync between popup and panel ---

  ipcMain.on('name:changed', (event, e164: string, name: string) => {
    const panel = getPanelWindow()
    const popup = getPopupWindow()
    const senderWebContents = event.sender
    if (panel && !panel.isDestroyed() && panel.webContents !== senderWebContents) {
      panel.webContents.send('name:updated', e164, name)
    }
    if (popup && !popup.isDestroyed() && popup.webContents !== senderWebContents) {
      popup.webContents.send('name:updated', e164, name)
    }
  })

  // --- OneNote ---

  ipcMain.handle('onenote:open', async (_event, data: { name: string; displayNumber: string; roles: ContactRole[]; e164: string }) => {
    const result = await openContactPage(data)
    return result  // { success, error?, pageId? }
  })

  // --- Calendar ---

  ipcMain.handle('calendar:book', async (_event, data: { name: string; displayNumber: string; roles: ContactRole[]; e164: string }, type: 'viewing' | 'consultation') => {
    await openCalendarBooking(data, type)
  })

  ipcMain.handle('calendar:follow-up', async (_event, data: { name: string; displayNumber: string; roles: string[]; e164: string }, days: number) => {
    return await createFollowUp(data, days)
  })

  // --- Auth ---

  ipcMain.handle('auth:get-state', async (): Promise<AuthState> => {
    const msAccount = await microsoftGetAccount()
    return {
      microsoftConnected: !!msAccount,
      microsoftAccount: msAccount?.username ?? null,
      googleConnected: isGoogleConnected(),
      googleAccount: isGoogleConnected() ? await googleGetEmail() : null
    }
  })

  ipcMain.handle('auth:microsoft-sign-in', async () => {
    await microsoftSignIn()
    const account = await microsoftGetAccount()
    return { connected: true, account: account?.username ?? null }
  })

  ipcMain.handle('auth:microsoft-sign-out', async () => {
    await microsoftSignOut()
    return { connected: false, account: null }
  })

  ipcMain.handle('auth:google-sign-in', async () => {
    await googleSignIn()
    const email = await googleGetEmail()
    return { connected: true, account: email }
  })

  ipcMain.handle('auth:google-sign-out', async () => {
    googleSignOut()
    return { connected: false, account: null }
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
}
