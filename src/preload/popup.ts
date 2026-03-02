import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('popupAPI', {
  dial: (e164: string) => ipcRenderer.send('popup:dial', e164),
  openWhatsApp: (e164: string) => ipcRenderer.send('popup:whatsapp', e164),
  dismiss: () => ipcRenderer.send('popup:dismiss'),
  onShow: (cb: (e164: string, displayNumber: string) => void) =>
    ipcRenderer.on('popup:show', (_e, e164, displayNumber) =>
      cb(e164, displayNumber)
    )
})
