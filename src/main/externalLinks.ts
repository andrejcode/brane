import { ipcMain, shell } from 'electron'
import { IpcChannels } from '@shared/types'
import { logger } from './logger'

function parseExternalUrl(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

export function registerExternalLinkHandlers() {
  ipcMain.handle(IpcChannels.openExternal, async (_event, value: unknown) => {
    const url = parseExternalUrl(value)

    if (!url) {
      logger.warn('Rejected invalid external URL')
      throw new Error('This link cannot be opened.')
    }

    try {
      await shell.openExternal(url.href)
    } catch (error) {
      logger.error('Failed to open external URL', error)
      throw new Error('The link could not be opened.')
    }
  })
}
