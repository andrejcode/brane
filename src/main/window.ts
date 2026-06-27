import {
  app,
  BrowserWindow,
  type BrowserWindowConstructorOptions,
} from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { IpcChannels } from '@shared/types'
import { getStoreValue, setStoreValue } from './store'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function saveWindowState(window: BrowserWindow) {
  // getNormalBounds() returns the restorable (un-maximized) bounds, so we keep
  // the previous size to restore to even while the window is maximized.
  const { width, height, x, y } = window.getNormalBounds()

  // While fullscreen, isMaximized() reports false, so reading it would clobber
  // the real maximized state. Keep whatever we previously stored instead.
  const isMaximized = window.isFullScreen()
    ? getStoreValue('window').isMaximized
    : window.isMaximized()

  setStoreValue('window', { width, height, x, y, isMaximized })
}

export function createWindow() {
  const isDev = !app.isPackaged
  const windowState = getStoreValue('window')

  const windowOptions: BrowserWindowConstructorOptions = {
    width: windowState.width,
    height: windowState.height,
  }

  if (windowState.x != null && windowState.y != null) {
    windowOptions.x = windowState.x
    windowOptions.y = windowState.y
  }

  const mainWindow = new BrowserWindow({
    // Hide title bar on macOS and position traffic lights
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hidden', trafficLightPosition: { x: 16, y: 16 } }
      : {}),
    ...windowOptions,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
    },
  })

  if (windowState.isMaximized) {
    mainWindow.maximize()
  }

  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send(IpcChannels.windowFullscreenChanged, true)
  })

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send(IpcChannels.windowFullscreenChanged, false)
  })

  // Persist the window position/size as the user moves and resizes it.
  // resize/move fire rapidly during a drag, so debounce the writes.
  let saveTimeout: NodeJS.Timeout | null = null
  const scheduleSaveWindowState = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    saveTimeout = setTimeout(() => saveWindowState(mainWindow), 300)
  }

  mainWindow.on('resize', scheduleSaveWindowState)
  mainWindow.on('move', scheduleSaveWindowState)

  mainWindow.on('close', () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    saveWindowState(mainWindow)
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    void mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    )
  }

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  return mainWindow
}
