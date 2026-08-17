import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/types'
import { getStoreValue, setStoreValue } from './store'

export function registerSidebarHandlers() {
  ipcMain.handle(IpcChannels.getSidebarOpen, () => {
    return getStoreValue('isSidebarOpen')
  })

  ipcMain.handle(IpcChannels.setSidebarOpen, (_event, isOpen: unknown) => {
    const value = isOpen === true
    setStoreValue('isSidebarOpen', value)
    return value
  })
}
