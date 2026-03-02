import { app } from 'electron'

app.whenReady().then(() => {
  console.log('App ready')
})

app.on('window-all-closed', () => {
  // Tray app — do not quit when all windows close
})
