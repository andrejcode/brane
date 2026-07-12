import { ipcMain, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { IpcChannels } from '@shared/types'
import { logger } from './logger'
import { logsDir } from './paths'

async function deleteLogFiles() {
  let entries: string[]

  try {
    entries = await fs.promises.readdir(logsDir)
  } catch {
    return
  }

  await Promise.all(
    entries
      .filter((entry) => entry.endsWith('.log'))
      .map(async (entry) => {
        try {
          await fs.promises.rm(path.join(logsDir, entry))
        } catch {
          // Ignore files that vanish mid-delete.
        }
      }),
  )
}

export function registerLogsHandlers() {
  ipcMain.handle(IpcChannels.openLogs, async () => {
    fs.mkdirSync(logsDir, { recursive: true })

    // shell.openPath resolves with an error string ('' on success) rather than
    // rejecting, so surface a non-empty result as a thrown error.
    const error = await shell.openPath(logsDir)
    if (error) {
      logger.error('Failed to open logs directory', error)
      throw new Error(error)
    }
  })

  ipcMain.handle(IpcChannels.deleteLogs, async () => {
    try {
      await deleteLogFiles()
    } catch (error) {
      logger.error('Failed to delete logs', error)
      throw new Error('Failed to delete logs. Please try again.')
    }
  })
}
