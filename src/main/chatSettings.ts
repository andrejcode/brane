import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/types'
import { getStoreValue, setStoreValue } from './store'

export function registerChatSettingsHandlers() {
  ipcMain.handle(IpcChannels.getSendWithModifierEnter, () => {
    return getStoreValue('sendWithModifierEnter')
  })

  ipcMain.handle(
    IpcChannels.setSendWithModifierEnter,
    (_event, enabled: unknown) => {
      const value = enabled === true
      setStoreValue('sendWithModifierEnter', value)
      return value
    },
  )
}
