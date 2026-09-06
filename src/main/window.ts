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
import { logger } from './logger'
import { getStoreValue, setStoreValue } from './store'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Matches the renderer's neutral-800 / neutral-50 backgrounds so the native
// window surface never flashes a mismatched color before the UI paints.
const DARK_BACKGROUND = '#262626'
const LIGHT_BACKGROUND = '#fafafa'
const READY_FALLBACK_MS = 3000

function getLinuxWindowIconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(app.getAppPath(), 'assets/icon.png')
}

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
  logger.info('Creating main window')
  const isDev = !app.isPackaged
  const shouldOpenDevTools = isDev && process.env['BRANE_E2E'] !== '1'
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
    ...(process.platform === 'linux' ? { icon: getLinuxWindowIconPath() } : {}),
    ...windowOptions,
    minWidth: 800,
    minHeight: 600,
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors
      ? DARK_BACKGROUND
      : LIGHT_BACKGROUND,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: shouldOpenDevTools,
    },
  })

  if (windowState.isMaximized) {
    mainWindow.maximize()
    mainWindow.hide()
  }

  const showMainWindow = () => {
    if (!mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      clearTimeout(fallbackTimer)
      mainWindow.show()
    }
  }

  const handleAppReady = (event: IpcMainEvent) => {
    if (event.sender === mainWindow.webContents) {
      logger.info('Renderer reported ready')
      showMainWindow()
    }
  }
  ipcMain.on(IpcChannels.appReady, handleAppReady)

  const fallbackTimer = setTimeout(() => {
    if (mainWindow.isDestroyed() || mainWindow.isVisible()) {
      return
    }

    logger.warn('Window readiness timed out; showing it anyway')
    showMainWindow()
  }, READY_FALLBACK_MS)

  mainWindow.on('closed', () => {
    clearTimeout(fallbackTimer)
    ipcMain.removeListener(IpcChannels.appReady, handleAppReady)
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    logger.error(
      `Renderer process gone (reason: ${details.reason}, exitCode: ${details.exitCode})`,
    )
  })

  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      logger.error(
        `Renderer failed to load ${validatedURL} (${errorCode}: ${errorDescription})`,
      )
    },
  )

  mainWindow.webContents.on('did-finish-load', () => {
    logger.info(`Renderer finished loading ${mainWindow.webContents.getURL()}`)
  })

  mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
    logger.error(`Preload failed at ${preloadPath}`, error)
  })

  mainWindow.webContents.on('console-message', (event) => {
    if (event.level === 'warning' || event.level === 'error') {
      logger[event.level === 'error' ? 'error' : 'warn'](
        `Renderer console: ${event.message} (${event.sourceId}:${event.lineNumber})`,
      )
    }
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

  if (shouldOpenDevTools) {
    mainWindow.webContents.openDevTools()
  }

  return mainWindow
}
