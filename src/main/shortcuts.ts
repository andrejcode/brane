import { ipcMain } from 'electron'
import { IpcChannels, normalizeShortcuts } from '@shared/types'
import { getStoreValue, setStoreValue } from './store'

export function registerShortcutsHandlers() {
  ipcMain.handle(IpcChannels.getShortcuts, () => {
    return normalizeShortcuts(getStoreValue('shortcuts'))
  })

  ipcMain.handle(IpcChannels.setShortcuts, (_event, value: unknown) => {
    const shortcuts = normalizeShortcuts(value)
    setStoreValue('shortcuts', shortcuts)
    return shortcuts
  })
}
