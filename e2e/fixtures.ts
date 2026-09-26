import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { _electron as electron } from '@playwright/test'
import BetterSqlite3 from 'better-sqlite3'

const ELECTRON_EXECUTABLE_NAMES: Partial<Record<NodeJS.Platform, string>> = {
  darwin: 'Electron.app/Contents/MacOS/Electron',
  linux: 'electron',
  win32: 'electron.exe',
}

const electronExecutableName = ELECTRON_EXECUTABLE_NAMES[process.platform]

if (!electronExecutableName) {
  throw new Error(`Unsupported E2E platform: ${process.platform}`)
}

const ELECTRON_EXECUTABLE = path.resolve(
  'node_modules/electron/dist',
  electronExecutableName,
)
const APP_DIRECTORY = path.resolve('.')

export interface E2eWorkspace {
  rootDir: string
  homeDir: string
  userDataDir: string
  braneDir: string
  modelsDir: string
  databasePath: string
}

export function createE2eWorkspace(name: string): E2eWorkspace {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), `brane-${name}-`))
  const homeDir = path.join(rootDir, 'home')
  const userDataDir = path.join(rootDir, 'user-data')
  const braneDir = path.join(homeDir, '.brane')
  const modelsDir = path.join(braneDir, 'models')

  fs.mkdirSync(modelsDir, { recursive: true })
  fs.mkdirSync(userDataDir, { recursive: true })

  return {
    rootDir,
    homeDir,
    userDataDir,
    braneDir,
    modelsDir,
    databasePath: path.join(braneDir, 'brane.db'),
  }
}

export function removeE2eWorkspace(workspace: E2eWorkspace) {
  fs.rmSync(workspace.rootDir, { force: true, recursive: true })
}

export function launchBrane(workspace: E2eWorkspace) {
  return electron.launch({
    executablePath: ELECTRON_EXECUTABLE,
    args: [APP_DIRECTORY, `--user-data-dir=${workspace.userDataDir}`],
    env: {
      ...process.env,
      BRANE_E2E: '1',
      HOME: workspace.homeDir,
      USERPROFILE: workspace.homeDir,
    },
  })
}

export async function initializeE2eDatabase(workspace: E2eWorkspace) {
  const electronApp = await launchBrane(workspace)

  try {
    await electronApp.firstWindow()
  } finally {
    await electronApp.close()
  }
}

interface SeedChatOptions {
  id: string
  title: string
  modelFile?: string
  userMessage?: string
  assistantMessage?: string
}

export function seedChat(
  workspace: E2eWorkspace,
  {
    id,
    title,
    modelFile = 'fixture-model.gguf',
    userMessage = 'Fixture user message',
    assistantMessage = 'Fixture assistant response',
  }: SeedChatOptions,
) {
  const modelPath = path.join(workspace.modelsDir, modelFile)
  fs.writeFileSync(modelPath, 'fixture model bytes')

  const database = new BetterSqlite3(workspace.databasePath)
  const timestamp = Date.now()

  try {
    database.pragma('foreign_keys = ON')
    database
      .prepare(
        `INSERT INTO chats
          (id, title, model_file, model_size_bytes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        title,
        modelFile,
        fs.statSync(modelPath).size,
        timestamp,
        timestamp,
      )

    const insertMessage = database.prepare(
      `INSERT INTO messages
        (id, chat_id, role, position, content, reasoning, finish_reason,
          context_used, context_size, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )

    insertMessage.run(
      `${id}-user`,
      id,
      'user',
      0,
      userMessage,
      null,
      null,
      null,
      null,
      timestamp,
      timestamp,
    )
    insertMessage.run(
      `${id}-assistant`,
      id,
      'assistant',
      1,
      assistantMessage,
      null,
      'stop',
      12,
      2048,
      timestamp,
      timestamp,
    )
  } finally {
    database.close()
  }
}

export function electronExecutableExists() {
  return fs.existsSync(ELECTRON_EXECUTABLE)
}
