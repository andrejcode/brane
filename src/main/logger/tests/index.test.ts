import fs from 'node:fs'
import path from 'node:path'
import { cleanupOldLogs, logger } from '../index'

// Built from the `process` global (available before imports initialize) so the
// mock factory, which vitest hoists above the imports, can reference it safely.
const { testLogsDir } = vi.hoisted(() => ({
  testLogsDir: `${process.cwd()}/.tmp-logger-test-${Date.now()}-${Math.random().toString(16).slice(2)}`,
}))

vi.mock('../../paths', () => ({
  logsDir: testLogsDir,
}))

const DAY_MS = 24 * 60 * 60 * 1000

function writeLog(name: string, ageMs = 0) {
  const filePath = path.join(testLogsDir, name)
  fs.writeFileSync(filePath, 'entry\n')

  if (ageMs > 0) {
    const time = new Date(Date.now() - ageMs)
    fs.utimesSync(filePath, time, time)
  }

  return filePath
}

function readAllLogs() {
  return fs
    .readdirSync(testLogsDir)
    .filter((entry) => entry.endsWith('.log'))
    .map((entry) => fs.readFileSync(path.join(testLogsDir, entry), 'utf8'))
    .join('')
}

beforeEach(() => {
  fs.rmSync(testLogsDir, { recursive: true, force: true })
  fs.mkdirSync(testLogsDir, { recursive: true })
})

afterEach(() => {
  vi.restoreAllMocks()
  fs.rmSync(testLogsDir, { recursive: true, force: true })
})

describe('cleanupOldLogs', () => {
  it('removes .log files older than the max age', async () => {
    writeLog('old.log', 8 * DAY_MS)

    await cleanupOldLogs()

    expect(fs.existsSync(path.join(testLogsDir, 'old.log'))).toBe(false)
  })

  it('keeps .log files newer than the max age', async () => {
    writeLog('recent.log', 1 * DAY_MS)

    await cleanupOldLogs()

    expect(fs.existsSync(path.join(testLogsDir, 'recent.log'))).toBe(true)
  })

  it('keeps a file exactly at the max age and removes one just over it', async () => {
    const now = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)

    writeLog('at-max-age.log', 7 * DAY_MS)
    writeLog('just-over.log', 7 * DAY_MS + 1)

    await cleanupOldLogs()

    expect(fs.existsSync(path.join(testLogsDir, 'at-max-age.log'))).toBe(true)
    expect(fs.existsSync(path.join(testLogsDir, 'just-over.log'))).toBe(false)
  })

  it('ignores files without a .log extension even when old', async () => {
    writeLog('notes.txt', 30 * DAY_MS)

    await cleanupOldLogs()

    expect(fs.existsSync(path.join(testLogsDir, 'notes.txt'))).toBe(true)
  })

  it('resolves without throwing when the logs directory does not exist', async () => {
    fs.rmSync(testLogsDir, { recursive: true, force: true })

    await expect(cleanupOldLogs()).resolves.toBeUndefined()
  })

  it('tolerates a file that vanishes mid-cleanup', async () => {
    writeLog('old.log', 8 * DAY_MS)
    vi.spyOn(fs.promises, 'stat').mockRejectedValue(new Error('ENOENT'))

    await expect(cleanupOldLogs()).resolves.toBeUndefined()
  })
})

describe('logger', () => {
  it('writes a formatted line with the level and message to a log file', () => {
    logger.info('hello world')

    expect(readAllLogs()).toContain('[INFO] hello world')
  })

  it('serializes an Error argument with its stack', () => {
    logger.error('boom happened', new Error('kaboom'))

    const contents = readAllLogs()
    expect(contents).toContain('[ERROR] boom happened')
    expect(contents).toContain('kaboom')
  })

  it('serializes non-string arguments as JSON', () => {
    logger.debug('payload', { model: 'a.gguf', size: 3 })

    expect(readAllLogs()).toContain('{"model":"a.gguf","size":3}')
  })

  it('never throws when writing to disk fails', () => {
    vi.spyOn(fs, 'appendFileSync').mockImplementation(() => {
      throw new Error('EACCES')
    })

    expect(() => logger.warn('still safe')).not.toThrow()
  })
})
