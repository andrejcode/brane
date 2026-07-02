import fs from 'node:fs'
import path from 'node:path'
import { logsDir } from '../paths'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_LOG_AGE_MS = 7 * 24 * 60 * 60 * 1000

const consoleMethods: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
}

let logsDirReady = false
let currentFilePath: string | null = null

function ensureLogsDir() {
  if (logsDirReady) {
    return
  }

  fs.mkdirSync(logsDir, { recursive: true })
  logsDirReady = true
}

function createLogFilePath() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  let candidate = path.join(logsDir, `brane-${stamp}.log`)

  // Rollovers within the same millisecond would collide on the timestamp.
  let counter = 1
  while (fs.existsSync(candidate)) {
    candidate = path.join(logsDir, `brane-${stamp}-${counter}.log`)
    counter += 1
  }

  return candidate
}

function getActiveFilePath() {
  if (currentFilePath === null) {
    currentFilePath = createLogFilePath()
    return currentFilePath
  }

  try {
    if (fs.statSync(currentFilePath).size >= MAX_FILE_SIZE_BYTES) {
      currentFilePath = createLogFilePath()
    }
  } catch {
    currentFilePath = createLogFilePath()
  }

  return currentFilePath
}

function serializeArg(arg: unknown) {
  if (typeof arg === 'string') {
    return arg
  }

  if (arg instanceof Error) {
    return arg.stack ?? `${arg.name}: ${arg.message}`
  }

  try {
    return JSON.stringify(arg)
  } catch {
    return String(arg)
  }
}

function write(level: LogLevel, args: unknown[]) {
  const message = args.map(serializeArg).join(' ')
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}\n`

  consoleMethods[level](line.trimEnd())

  // Logging must never crash the app, so swallow any filesystem failure.
  try {
    ensureLogsDir()
    fs.appendFileSync(getActiveFilePath(), line)
  } catch {
    // Console output above is the fallback.
  }
}

export async function cleanupOldLogs() {
  let entries: string[]

  try {
    entries = await fs.promises.readdir(logsDir)
  } catch {
    return
  }

  const now = Date.now()

  await Promise.all(
    entries
      .filter((entry) => entry.endsWith('.log'))
      .map(async (entry) => {
        const filePath = path.join(logsDir, entry)

        try {
          const stats = await fs.promises.stat(filePath)
          if (now - stats.mtimeMs > MAX_LOG_AGE_MS) {
            await fs.promises.rm(filePath)
          }
        } catch {
          // Ignore files that vanish mid-cleanup.
        }
      }),
  )
}

export const logger: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: (...args) => write('debug', args),
  info: (...args) => write('info', args),
  warn: (...args) => write('warn', args),
  error: (...args) => write('error', args),
}
