import {
  app,
  BrowserWindow,
  type BrowserWindowConstructorOptions,
  type IpcMainEvent,
  ipcMain,
  nativeTheme,
} from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { IpcChannels } from '@shared/types'
import { getStoreValue, setStoreValue } from './store'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Matches the renderer's neutral-800 / neutral-50 backgrounds so the native
// window surface never flashes a mismatched color before the UI paints.
const DARK_BACKGROUND = '#262626'
const LIGHT_BACKGROUND = '#fafafa'

// If the renderer never signals readiness (e.g. it crashes during startup),
// show the window anyway so we can't get stuck with a permanently hidden window.
const READY_FALLBACK_MS = 3000

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
    // Start hidden and render offscreen so the first frame the user sees is the
    // fully loaded, correctly-themed UI rather than an empty/white window.
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors
      ? DARK_BACKGROUND
      : LIGHT_BACKGROUND,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
    },
  })

  // Apply the saved maximized state while the window is still hidden. maximize()
  // implicitly shows the window, so we immediately hide it again in the same
  // tick: the window never paints, so there's no empty-window flash and no
  // visible resize from the restored size to maximized when we later reveal it.
  if (windowState.isMaximized) {
    mainWindow.maximize()
    mainWindow.hide()
  }

  // Reveal the window only once the renderer reports it has finished loading its
  // initial state (selected model, theme, etc.), so no placeholder frame shows.
  const showMainWindow = () => {
    if (!mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show()
    }
  }

  const handleAppReady = (event: IpcMainEvent) => {
    if (event.sender === mainWindow.webContents) {
      showMainWindow()
    }
  }
  ipcMain.on(IpcChannels.appReady, handleAppReady)

  const fallbackTimer = setTimeout(showMainWindow, READY_FALLBACK_MS)

  mainWindow.on('closed', () => {
    clearTimeout(fallbackTimer)
    ipcMain.removeListener(IpcChannels.appReady, handleAppReady)
  })

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
