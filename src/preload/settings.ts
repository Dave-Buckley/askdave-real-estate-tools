import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('settingsAPI', {
  getSettings: () => ipcRenderer.invoke('store:getSettings'),
  saveSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.invoke('store:saveSettings', settings),
  pickCompletedFormsDir: () =>
    ipcRenderer.invoke('client-folder:pick-root') as Promise<{ success: boolean; path?: string }>,
  getCompletedFormsDir: () =>
    ipcRenderer.invoke('client-folder:get-root') as Promise<string>
})
