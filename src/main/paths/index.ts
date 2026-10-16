import { app } from 'electron'
import os from 'node:os'
import path from 'node:path'

const braneDir = path.join(os.homedir(), '.brane')

export const modelsDir = path.join(braneDir, 'models')

interface ResolveDataDirOptions {
  appPath: string
  isPackaged: boolean
  override: string | undefined
}

export function resolveDataDir({
  appPath,
  isPackaged,
  override,
}: ResolveDataDirOptions) {
  if (override !== undefined) {
    return override
  }

  return isPackaged ? braneDir : path.join(appPath, '.brane-dev')
}

export const dataDir = resolveDataDir({
  appPath: app?.getAppPath() ?? process.cwd(),
  isPackaged: app?.isPackaged ?? false,
  override: process.env['BRANE_DATA_DIR'],
})

export const logsDir = path.join(dataDir, 'logs')

export const databasePath = path.join(dataDir, 'brane.db')
