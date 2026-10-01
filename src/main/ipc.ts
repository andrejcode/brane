import { BrowserWindow, ipcMain } from 'electron'
import { IpcChannels } from '@shared/types'
import { registerAppearanceHandlers } from './appearance'
import { registerApplicationMenu } from './applicationMenu'
import { registerChatsHandlers } from './chats'
import { registerChatSettingsHandlers } from './chatSettings'
import { registerExternalLinkHandlers } from './externalLinks'
import { registerLlamaHandlers, unloadLlamaModel } from './llama'
import { registerLocaleHandlers } from './locale'
import { logger } from './logger'
import { registerLogsHandlers } from './logs'
import { registerModelHandlers } from './model'
import { registerShortcutsHandlers } from './shortcuts'
import { registerSidebarHandlers } from './sidebar'

export function registerIpcHandlers() {
  ipcMain.handle(IpcChannels.windowIsFullScreen, (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isFullScreen() ?? false
  })

  registerAppearanceHandlers()
  registerApplicationMenu()
  registerLocaleHandlers()
  registerChatSettingsHandlers()
  registerChatsHandlers()
  registerSidebarHandlers()
  registerShortcutsHandlers()
  registerLogsHandlers()
  registerExternalLinkHandlers()
  registerLlamaHandlers()
  registerModelHandlers({
    onSelectedModelChange: () => {
      void unloadLlamaModel().catch((error: unknown) => {
        logger.error('Failed to reset the llama session', error)
      })
    },
  })
}
