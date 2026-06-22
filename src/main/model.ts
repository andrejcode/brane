import { ipcMain } from 'electron'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { IpcChannels } from '@shared/types'
import { getStoreValue, setStoreValue } from './store'

export const modelsDir = path.join(os.homedir(), '.brane', 'models')

const MODEL_EXTENSION = '.gguf'

// Lists the available model filenames with .gguf extension in the models directory
export function listModels(): string[] {
  try {
    return fs
      .readdirSync(modelsDir, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isFile() && entry.name.toLowerCase().endsWith(MODEL_EXTENSION),
      )
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b))
  } catch {
    return []
  }
}

function modelExists(name: string): boolean {
  return listModels().includes(name)
}

// Returns the persisted selected model, but only if it still exists on disk
export function getSelectedModel(): string | null {
  const stored = getStoreValue('selectedModel')

  if (typeof stored === 'string' && modelExists(stored)) {
    return stored
  }

  if (stored !== null) {
    setStoreValue('selectedModel', null)
  }

  return null
}

export function getSelectedModelPath(): string | null {
  const selected = getSelectedModel()

  return selected === null ? null : path.join(modelsDir, selected)
}

interface RegisterModelHandlersOptions {
  onSelectedModelChange: () => void
}

export function registerModelHandlers({
  onSelectedModelChange,
}: RegisterModelHandlersOptions) {
  ipcMain.handle(IpcChannels.listModels, () => listModels())

  ipcMain.handle(IpcChannels.getSelectedModel, () => getSelectedModel())

  ipcMain.handle(IpcChannels.setSelectedModel, (_event, model: unknown) => {
    if (typeof model !== 'string' || !modelExists(model)) {
      throw new Error('Model not found')
    }

    setStoreValue('selectedModel', model)
    onSelectedModelChange()

    return model
  })
}
