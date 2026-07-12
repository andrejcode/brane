import { app, BrowserWindow, ipcMain } from 'electron'
import started from 'electron-squirrel-startup'
import { IpcChannels } from '@shared/types'
import { registerChatSettingsHandlers } from './chatSettings'
import { registerLlamaHandlers, unloadLlamaModel } from './llama'
import { initializeLocale, registerLocaleHandlers } from './locale'
import { cleanupOldLogs, logger } from './logger'
import { registerLogsHandlers } from './logs'
import { registerModelHandlers } from './model'
import { initializeTheme, registerThemeHandlers } from './theme'
import { createWindow } from './window'

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (started) {
  app.quit()
}

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception in main process', error)
})

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection in main process', reason)
})

void app.whenReady().then(() => {
  logger.info(`App ready (v${app.getVersion()}, ${process.platform})`)

  void cleanupOldLogs().catch((error: unknown) => {
    logger.error('Failed to clean up old logs', error)
  })

  initializeTheme()
  initializeLocale()

  ipcMain.handle(IpcChannels.windowIsFullScreen, (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isFullScreen() ?? false
  })

  registerThemeHandlers()
  registerLocaleHandlers()
  registerChatSettingsHandlers()
  registerLogsHandlers()
  registerLlamaHandlers()
  registerModelHandlers({
    onSelectedModelChange: () => {
      void unloadLlamaModel().catch((error: unknown) => {
        logger.error('Failed to reset the llama session', error)
      })
    },
  })

  createWindow()

  app.on('activate', () => {
    // Open a window if none are open (macOS)
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  logger.info('All windows closed')
  // Quit the app when all windows are closed (Windows & Linux)
  if (process.platform !== 'darwin') {
    app.quit()
    return
  }

  // On macOS the process stays alive after the window closes, so the model would
  // otherwise sit resident in memory. Free it; it reloads on reactivate.
  void unloadLlamaModel().catch((error: unknown) => {
    logger.error('Failed to unload the model after window close', error)
  })
})

// Dispose the model gracefully before exiting. Defer the quit until teardown
// finishes so native resources are released cleanly rather than on hard exit.
let isQuitting = false
app.on('before-quit', (event) => {
  if (isQuitting) {
    return
  }

  isQuitting = true
  event.preventDefault()

  void unloadLlamaModel()
    .catch((error: unknown) => {
      logger.error('Failed to unload the model during quit', error)
    })
    .finally(() => {
      app.quit()
    })
})
