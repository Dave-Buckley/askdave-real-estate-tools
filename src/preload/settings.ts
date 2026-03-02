import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('settingsAPI', {
  getSettings: () => ipcRenderer.invoke('store:getSettings'),
  saveSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.invoke('store:saveSettings', settings)
})
