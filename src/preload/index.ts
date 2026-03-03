import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Panel window controls
  closePanel: () => ipcRenderer.send('panel:close'),
  minimizePanel: () => ipcRenderer.send('panel:minimize'),
  maximizePanel: () => ipcRenderer.send('panel:maximize'),

  // Actions
  actionDone: () => ipcRenderer.send('panel:action-done'),
  copyNumber: (e164: string) => ipcRenderer.send('panel:copy-number', e164),
  dial: (e164: string) => ipcRenderer.send('action:dial', e164),
  openWhatsApp: (e164: string, mode: 'web' | 'desktop') =>
    ipcRenderer.send('action:whatsapp', e164, mode),
  sendWhatsAppMessage: (e164: string, message: string, mode: 'web' | 'desktop') =>
    ipcRenderer.send('action:whatsapp-with-message', e164, message, mode),

  // Settings
  openSettings: () => ipcRenderer.send('panel:open-settings'),

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

  // Form template overrides
  getFormOverrides: () => ipcRenderer.invoke('store:getFormOverrides'),
  saveFormOverride: (formId: string, override: { whatsappMessage?: string; emailSubject?: string; emailBody?: string }) =>
    ipcRenderer.invoke('store:saveFormOverride', formId, override),
  resetFormOverride: (formId: string) =>
    ipcRenderer.invoke('store:resetFormOverride', formId),

  // Role templates (OneNote)
  getRoleTemplates: () => ipcRenderer.invoke('store:getRoleTemplates'),
  saveRoleTemplate: (role: string, template: { label: string; questions: string[]; documents: string[] }) =>
    ipcRenderer.invoke('store:saveRoleTemplate', role, template),

  // Contacts
  getContact: (e164: string) => ipcRenderer.invoke('contacts:get', e164),
  upsertContact: (e164: string, data: Record<string, unknown>) =>
    ipcRenderer.invoke('contacts:upsert', e164, data),
  addRole: (e164: string, role: string) => ipcRenderer.invoke('contacts:add-role', e164, role),
  removeRole: (e164: string, role: string) => ipcRenderer.invoke('contacts:remove-role', e164, role),
  listContacts: () => ipcRenderer.invoke('contacts:list'),
  deleteContact: (e164: string) => ipcRenderer.invoke('contacts:delete', e164),

  // OneNote
  openInOneNote: (data: { name: string; displayNumber: string; roles: string[]; e164: string; unit?: string; email?: string }) =>
    ipcRenderer.invoke('onenote:open', data) as Promise<{ success: boolean; error?: string; pageId?: string }>,
  openOneNoteSection: () =>
    ipcRenderer.invoke('onenote:open-section') as Promise<{ success: boolean; error?: string }>,

  // Calendar
  bookCalendar: (data: { name: string; displayNumber: string; roles: string[]; e164: string; unit?: string; email?: string }, type: 'viewing' | 'consultation', templateBody?: string) =>
    ipcRenderer.invoke('calendar:book', data, type, templateBody),
  createFollowUp: (data: { name: string; displayNumber: string; roles: string[]; e164: string }, days: number) =>
    ipcRenderer.invoke('calendar:follow-up', data, days) as Promise<{ success: boolean; error?: string; eventDate?: string }>,

  // Name sync
  setName: (e164: string, name: string) => ipcRenderer.send('name:changed', e164, name),
  onNameUpdated: (cb: (e164: string, name: string) => void) =>
    ipcRenderer.on('name:updated', (_e, e164, name) => cb(e164, name)),

  // Panel mode
  onModeChange: (cb: (mode: 'compact' | 'expanded') => void) =>
    ipcRenderer.on('panel:set-mode', (_e, mode) => cb(mode)),
  expandPanel: () => ipcRenderer.send('panel:expand'),

  // Events from main
  onPhoneDetected: (cb: (e164: string, displayNumber: string) => void) =>
    ipcRenderer.on('phone:detected', (_e, e164, displayNumber) =>
      cb(e164, displayNumber)
    ),
  onEmailDetected: (cb: (email: string) => void) =>
    ipcRenderer.on('email:detected', (_e, email) => cb(email)),
  onContactExtracted: (cb: (info: { e164?: string; displayNumber?: string; email?: string; name?: string; unit?: string }) => void) =>
    ipcRenderer.on('contact:extracted', (_e, info) => cb(info)),
  onTemplatesUpdated: (cb: (templates: unknown[]) => void) =>
    ipcRenderer.on('templates:updated', (_e, templates) => cb(templates)),
  removePhoneDetectedListener: () =>
    ipcRenderer.removeAllListeners('phone:detected'),
  removeEmailDetectedListener: () =>
    ipcRenderer.removeAllListeners('email:detected'),

  // Phone Link events
  onIncomingCall: (cb: (data: { e164: string; displayNumber: string; contactName: string | null }) => void) =>
    ipcRenderer.on('phone-link:incoming-call', (_e, data) => cb(data)),
  onCallEnded: (cb: (data: { e164: string; displayNumber: string; contactName: string | null }) => void) =>
    ipcRenderer.on('phone-link:call-ended', (_e, data) => cb(data)),

  // News
  getNews: () =>
    ipcRenderer.invoke('news:get') as Promise<{ items: Array<{ title: string; link: string; pubDate: string; source: string }>; lastFetched: number }>,

  // Forms
  getFormsDir: () => ipcRenderer.invoke('forms:get-dir') as Promise<string>,
  saveFormAs: (subFolder: string, fileName: string) =>
    ipcRenderer.invoke('forms:save-as', subFolder, fileName) as Promise<{ success: boolean; path?: string }>,

  // Shell
  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('shell:show-item', filePath)
})
