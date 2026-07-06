import { app, BrowserWindow, ipcMain } from 'electron'
import started from 'electron-squirrel-startup'
import { IpcChannels } from '@shared/types'
import { registerLlamaHandlers, resetLlamaSession } from './llama'
import { cleanupOldLogs, logger } from './logger'
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

  ipcMain.handle(IpcChannels.windowIsFullScreen, (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isFullScreen() ?? false
  })

  registerThemeHandlers()
  registerLlamaHandlers()
  registerModelHandlers({
    onSelectedModelChange: () => {
      void resetLlamaSession().catch((error: unknown) => {
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
  }
})
