import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Actions
  dial: (e164: string) => ipcRenderer.send('action:dial', e164),
  openWhatsApp: (e164: string, mode: 'web' | 'desktop') =>
    ipcRenderer.send('action:whatsapp', e164, mode),
  sendWhatsAppMessage: (e164: string, message: string) =>
    ipcRenderer.send('action:whatsapp-with-message', e164, message),

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

  // Events from main
  onPhoneDetected: (cb: (e164: string, displayNumber: string) => void) =>
    ipcRenderer.on('phone:detected', (_e, e164, displayNumber) =>
      cb(e164, displayNumber)
    ),
  removePhoneDetectedListener: () =>
    ipcRenderer.removeAllListeners('phone:detected')
})
