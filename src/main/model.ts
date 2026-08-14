import { ipcMain } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import {
  IpcChannels,
  type ModelAvailability,
  type ModelState,
} from '@shared/types'
import { logger } from './logger'
import { modelsDir } from './paths'
import { getStoreValue, setStoreValue } from './store'

const MODEL_EXTENSION = '.gguf'

function toModelNames(entries: fs.Dirent[]): string[] {
  return entries
    .filter(
      (entry) =>
        entry.isFile() && entry.name.toLowerCase().endsWith(MODEL_EXTENSION),
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

// Lists the available model filenames with .gguf extension in the models directory
export function listModels(): string[] {
  try {
    return toModelNames(fs.readdirSync(modelsDir, { withFileTypes: true }))
  } catch {
    return []
  }
}

// Async counterpart of `listModels`, used for the renderer-facing read so a
// large models directory never blocks the main process event loop.
async function listModelsAsync(): Promise<string[]> {
  try {
    return toModelNames(
      await fs.promises.readdir(modelsDir, { withFileTypes: true }),
    )
  } catch {
    return []
  }
}

// Validates the persisted selection against a known list of models, clearing it
// from the store when it no longer exists on disk.
function resolveSelectedModel(models: string[]): string | null {
  const stored = getStoreValue('selectedModel')

  if (typeof stored === 'string' && models.includes(stored)) {
    return stored
  }

  if (stored !== null) {
    setStoreValue('selectedModel', null)
  }

  return null
}

function modelExists(name: string): boolean {
  return listModels().includes(name)
}

// Returns the persisted selected model, but only if it still exists on disk
export function getSelectedModel(): string | null {
  return resolveSelectedModel(listModels())
}

// Reads the model list and the validated selection from a single directory
// scan, so the renderer can refresh both with one IPC round-trip.
export async function getModelState(): Promise<ModelState> {
  const models = await listModelsAsync()

  return { models, selectedModel: resolveSelectedModel(models) }
}

export function getSelectedModelPath(): string | null {
  const selected = getSelectedModel()

  return selected === null ? null : path.join(modelsDir, selected)
}

// Resolves a specific model name to its path, or null if it no longer exists.
export function getModelPath(name: string): string | null {
  return modelExists(name) ? path.join(modelsDir, name) : null
}

export function getModelFileSize(name: string): number | null {
  try {
    const stats = fs.statSync(path.join(modelsDir, name))

    return stats.isFile() ? stats.size : null
  } catch {
    return null
  }
}

export function getModelAvailability(
  name: string,
  sizeBytes: number,
): ModelAvailability {
  const currentSize = getModelFileSize(name)

  if (currentSize === null) {
    return 'missing'
  }

  return currentSize === sizeBytes ? 'available' : 'replaced'
}

interface RegisterModelHandlersOptions {
  onSelectedModelChange: () => void
}

export function registerModelHandlers({
  onSelectedModelChange,
}: RegisterModelHandlersOptions) {
  ipcMain.handle(IpcChannels.getModelState, () => getModelState())

  ipcMain.handle(IpcChannels.setSelectedModel, (_event, model: unknown) => {
    // null clears the selection (e.g. when the model is unloaded).
    if (model !== null && (typeof model !== 'string' || !modelExists(model))) {
      logger.warn('Rejected model selection: model not found', model)
      throw new Error('Model not found')
    }

    logger.info(
      model === null ? 'Model selection cleared' : `Model selected: ${model}`,
    )

    setStoreValue('selectedModel', model)
    onSelectedModelChange()

    return model
  })
}
