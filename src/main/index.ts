import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import started from 'electron-squirrel-startup'
import { IpcChannels } from '@shared/types'
import { registerLlamaHandlers } from './llama'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (started) {
  app.quit()
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    // Hide title bar on macOS and position traffic lights
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hidden', trafficLightPosition: { x: 16, y: 16 } }
      : {}),
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send(IpcChannels.windowFullscreenChanged, true)
  })

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send(IpcChannels.windowFullscreenChanged, false)
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    void mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    )
  }

  mainWindow.webContents.openDevTools()
}

void app.whenReady().then(() => {
  ipcMain.handle(IpcChannels.windowIsFullScreen, (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isFullScreen() ?? false
  })

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
