import os from 'node:os'
import path from 'node:path'

// Root directory for all Brane data on disk. Every other path in the app must
// derive from this so we never write to an inconsistent location.
export const baseDir = path.join(os.homedir(), '.brane')

export const logsDir = path.join(baseDir, 'logs')

export const modelsDir = path.join(baseDir, 'models')

export const databasePath = path.join(baseDir, 'brane.db')
