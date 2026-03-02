import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('popupAPI', {
  dial: (e164: string) => ipcRenderer.send('popup:dial', e164),
  copyNumber: (e164: string) => ipcRenderer.send('popup:copy-number', e164),
  openWhatsApp: (e164: string) => ipcRenderer.send('popup:whatsapp', e164),
  openWhatsAppWithMessage: (e164: string, message: string) =>
    ipcRenderer.send('popup:whatsapp-with-message', e164, message),
  dismiss: () => ipcRenderer.send('popup:dismiss'),

  // Template CRUD
  getTemplates: () => ipcRenderer.invoke('store:getTemplates'),
  addTemplate: (template: unknown) => ipcRenderer.invoke('store:addTemplate', template),
  updateTemplate: (template: unknown) => ipcRenderer.invoke('store:updateTemplate', template),
  deleteTemplate: (id: string) => ipcRenderer.invoke('store:deleteTemplate', id),

  // Settings
  getSettings: () => ipcRenderer.invoke('store:getSettings'),
  saveSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.invoke('store:saveSettings', settings),
  openSettings: () => ipcRenderer.send('popup:open-settings'),

  // Window control
  minimize: () => ipcRenderer.send('popup:minimize'),
  restore: () => ipcRenderer.send('popup:restore'),
  showPanel: () => ipcRenderer.send('popup:show-panel'),

  // OneNote & Calendar
  openInOneNote: (data: { name: string; displayNumber: string; roles: string[]; e164: string }) =>
    ipcRenderer.invoke('onenote:open', data) as Promise<{ success: boolean; error?: string; pageId?: string }>,
  bookCalendar: (data: { name: string; displayNumber: string; roles: string[]; e164: string }, type: 'viewing' | 'consultation') =>
    ipcRenderer.invoke('calendar:book', data, type),
  createFollowUp: (data: { name: string; displayNumber: string; roles: string[]; e164: string }, days: number) =>
    ipcRenderer.invoke('calendar:follow-up', data, days) as Promise<{ success: boolean; error?: string; eventDate?: string }>,

  // Contacts
  getContact: (e164: string) => ipcRenderer.invoke('contacts:get', e164),
  upsertContact: (e164: string, data: Record<string, unknown>) =>
    ipcRenderer.invoke('contacts:upsert', e164, data),
  addRole: (e164: string, role: string) => ipcRenderer.invoke('contacts:add-role', e164, role),
  removeRole: (e164: string, role: string) => ipcRenderer.invoke('contacts:remove-role', e164, role),

  // Name sync
  setName: (e164: string, name: string) => ipcRenderer.send('name:changed', e164, name),
  onNameUpdated: (cb: (e164: string, name: string) => void) =>
    ipcRenderer.on('name:updated', (_e, e164, name) => cb(e164, name)),

  // Events
  onShow: (cb: (e164: string, displayNumber: string) => void) =>
    ipcRenderer.on('popup:show', (_e, e164, displayNumber) =>
      cb(e164, displayNumber)
    ),
  onTemplatesUpdated: (cb: (templates: unknown[]) => void) =>
    ipcRenderer.on('templates:updated', (_e, templates) => cb(templates)),
  onSettingsUpdated: (cb: (settings: unknown) => void) =>
    ipcRenderer.on('settings:updated', (_e, settings) => cb(settings)),
  onMinimized: (cb: () => void) =>
    ipcRenderer.on('popup:minimized', () => cb()),
  onRestored: (cb: () => void) =>
    ipcRenderer.on('popup:restored', () => cb())
})
