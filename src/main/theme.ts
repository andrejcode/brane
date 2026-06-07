import { ipcMain, nativeTheme } from 'electron'
import { IpcChannels, type Theme } from '@shared/types'
import { getStoreValue, setStoreValue } from './store'

function isValidTheme(value: unknown): value is Theme {
  return (
    typeof value === 'string' && ['light', 'dark', 'system'].includes(value)
  )
}

export function initializeTheme() {
  const theme = getStoreValue('theme')
  if (isValidTheme(theme)) {
    nativeTheme.themeSource = theme
  } else {
    nativeTheme.themeSource = 'system'
    setStoreValue('theme', 'system')
  }
}

export function registerThemeHandlers() {
  ipcMain.handle(IpcChannels.getTheme, () => {
    return getStoreValue('theme')
  })

  ipcMain.handle(IpcChannels.setTheme, (_event, theme: Theme) => {
    if (isValidTheme(theme)) {
      nativeTheme.themeSource = theme
      setStoreValue('theme', theme)
    } else {
      nativeTheme.themeSource = 'system'
      setStoreValue('theme', 'system')
    }
  })
}
