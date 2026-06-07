import { app, BrowserWindow, ipcMain } from 'electron'
import started from 'electron-squirrel-startup'
import { IpcChannels } from '@shared/types'
import { registerLlamaHandlers } from './llama'
import { initializeTheme, registerThemeHandlers } from './theme'
import { createWindow } from './window'

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (started) {
  app.quit()
}

void app.whenReady().then(() => {
  initializeTheme()

  ipcMain.handle(IpcChannels.windowIsFullScreen, (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isFullScreen() ?? false
  })

  registerThemeHandlers()
  registerLlamaHandlers()

  createWindow()

  app.on('activate', () => {
    // Open a window if none are open (macOS)
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // Quit the app when all windows are closed (Windows & Linux)
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
