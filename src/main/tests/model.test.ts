import fs from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getSelectedModel, getSelectedModelPath, listModels } from '../model'

const { storeValues } = vi.hoisted(() => ({
  storeValues: new Map<string, unknown>(),
}))

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
}))

vi.mock('../store', () => ({
  getStoreValue: (key: string) => storeValues.get(key),
  setStoreValue: (key: string, value: unknown) => {
    storeValues.set(key, value)
  },
}))

function mockDir(names: string[]) {
  const entries = names.map((name) => ({
    name,
    isFile: () => !name.endsWith('/'),
  }))

  vi.spyOn(fs, 'readdirSync').mockReturnValue(
    entries as unknown as ReturnType<typeof fs.readdirSync>,
  )
}

beforeEach(() => {
  storeValues.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('listModels', () => {
  it('returns only .gguf files, sorted, ignoring other files', () => {
    mockDir(['b.gguf', 'notes.txt', 'a.gguf', 'image.png', 'sub/'])

    expect(listModels()).toEqual(['a.gguf', 'b.gguf'])
  })

  it('matches the .gguf extension case-insensitively', () => {
    mockDir(['Model.GGUF'])

    expect(listModels()).toEqual(['Model.GGUF'])
  })

  it('returns an empty list when the directory cannot be read', () => {
    vi.spyOn(fs, 'readdirSync').mockImplementation(() => {
      throw new Error('ENOENT')
    })

    expect(listModels()).toEqual([])
  })
})

describe('getSelectedModel', () => {
  it('returns the stored model when it still exists on disk', () => {
    storeValues.set('selectedModel', 'a.gguf')
    mockDir(['a.gguf'])

    expect(getSelectedModel()).toBe('a.gguf')
  })

  it('clears and returns null when the stored model no longer exists', () => {
    storeValues.set('selectedModel', 'gone.gguf')
    mockDir(['a.gguf'])

    expect(getSelectedModel()).toBeNull()
    expect(storeValues.get('selectedModel')).toBeNull()
  })

  it('returns null when nothing is stored', () => {
    storeValues.set('selectedModel', null)
    mockDir(['a.gguf'])

    expect(getSelectedModel()).toBeNull()
  })
})

describe('getSelectedModelPath', () => {
  it('joins the models directory with the selected model', () => {
    storeValues.set('selectedModel', 'a.gguf')
    mockDir(['a.gguf'])

    expect(getSelectedModelPath()).toMatch(
      /[/\\]\.brane[/\\]models[/\\]a\.gguf$/,
    )
  })

  it('returns null when no model is selected', () => {
    storeValues.set('selectedModel', null)
    mockDir([])

    expect(getSelectedModelPath()).toBeNull()
  })
})
