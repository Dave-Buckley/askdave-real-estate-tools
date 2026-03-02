import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Panel
  closePanel: () => ipcRenderer.send('panel:close'),

  // Actions
  dial: (e164: string) => ipcRenderer.send('action:dial', e164),
  openWhatsApp: (e164: string, mode: 'web' | 'desktop') =>
    ipcRenderer.send('action:whatsapp', e164, mode),
  sendWhatsAppMessage: (e164: string, message: string) =>
    ipcRenderer.send('action:whatsapp-with-message', e164, message),

  // Settings
  openSettings: () => ipcRenderer.send('popup:open-settings'),

  // Store
  getSettings: () => ipcRenderer.invoke('store:getSettings'),
  saveSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.invoke('store:saveSettings', settings),
  getTemplates: () => ipcRenderer.invoke('store:getTemplates'),
  saveTemplates: (templates: unknown[]) =>
    ipcRenderer.invoke('store:saveTemplates', templates),
  addTemplate: (template: unknown) =>
    ipcRenderer.invoke('store:addTemplate', template),
  deleteTemplate: (id: string) =>
    ipcRenderer.invoke('store:deleteTemplate', id),
  updateTemplate: (template: unknown) =>
    ipcRenderer.invoke('store:updateTemplate', template),

  // Contacts
  getContact: (e164: string) => ipcRenderer.invoke('contacts:get', e164),
  upsertContact: (e164: string, data: Record<string, unknown>) =>
    ipcRenderer.invoke('contacts:upsert', e164, data),
  addRole: (e164: string, role: string) => ipcRenderer.invoke('contacts:add-role', e164, role),
  removeRole: (e164: string, role: string) => ipcRenderer.invoke('contacts:remove-role', e164, role),
  listContacts: () => ipcRenderer.invoke('contacts:list'),
  deleteContact: (e164: string) => ipcRenderer.invoke('contacts:delete', e164),

  // OneNote
  openInOneNote: (data: { name: string; displayNumber: string; roles: string[]; e164: string }) =>
    ipcRenderer.invoke('onenote:open', data) as Promise<{ success: boolean; error?: string; pageId?: string }>,

  // Calendar
  bookCalendar: (data: { name: string; displayNumber: string; roles: string[]; e164: string }, type: 'viewing' | 'consultation') =>
    ipcRenderer.invoke('calendar:book', data, type),
  createFollowUp: (data: { name: string; displayNumber: string; roles: string[]; e164: string }, days: number) =>
    ipcRenderer.invoke('calendar:follow-up', data, days) as Promise<{ success: boolean; error?: string; eventDate?: string }>,

  // Name sync
  setName: (e164: string, name: string) => ipcRenderer.send('name:changed', e164, name),
  onNameUpdated: (cb: (e164: string, name: string) => void) =>
    ipcRenderer.on('name:updated', (_e, e164, name) => cb(e164, name)),

  // Events from main
  onPhoneDetected: (cb: (e164: string, displayNumber: string) => void) =>
    ipcRenderer.on('phone:detected', (_e, e164, displayNumber) =>
      cb(e164, displayNumber)
    ),
  onTemplatesUpdated: (cb: (templates: unknown[]) => void) =>
    ipcRenderer.on('templates:updated', (_e, templates) => cb(templates)),
  removePhoneDetectedListener: () =>
    ipcRenderer.removeAllListeners('phone:detected')
})
