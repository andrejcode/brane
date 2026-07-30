import fs from 'node:fs'
import { IpcChannels } from '@shared/types'
import {
  getModelState,
  getSelectedModel,
  getSelectedModelPath,
  listModels,
  registerModelHandlers,
} from '../model'

type IpcHandler = (...args: unknown[]) => unknown

const { storeValues, ipcHandlers } = vi.hoisted(() => ({
  storeValues: new Map<string, unknown>(),
  ipcHandlers: new Map<string, IpcHandler>(),
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: IpcHandler) => {
      ipcHandlers.set(channel, handler)
    },
  },
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

function mockDirAsync(names: string[]) {
  const entries = names.map((name) => ({
    name,
    isFile: () => !name.endsWith('/'),
  }))

  return vi
    .spyOn(fs.promises, 'readdir')
    .mockResolvedValue(
      entries as unknown as Awaited<ReturnType<typeof fs.promises.readdir>>,
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

describe('getModelState', () => {
  it('returns the sorted models and the validated selection together', async () => {
    storeValues.set('selectedModel', 'a.gguf')
    mockDirAsync(['b.gguf', 'a.gguf', 'notes.txt'])

    await expect(getModelState()).resolves.toEqual({
      models: ['a.gguf', 'b.gguf'],
      selectedModel: 'a.gguf',
    })
  })

  it('clears a stale selection that is no longer on disk', async () => {
    storeValues.set('selectedModel', 'gone.gguf')
    mockDirAsync(['a.gguf'])

    const state = await getModelState()

    expect(state.selectedModel).toBeNull()
    expect(storeValues.get('selectedModel')).toBeNull()
  })

  it('scans the directory only once per call', async () => {
    storeValues.set('selectedModel', 'a.gguf')
    const readdir = mockDirAsync(['a.gguf'])

    await getModelState()

    expect(readdir).toHaveBeenCalledTimes(1)
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

describe('registerModelHandlers setSelectedModel', () => {
  function getSetSelectedModelHandler(
    onSelectedModelChange: () => void,
  ): IpcHandler {
    ipcHandlers.clear()
    registerModelHandlers({ onSelectedModelChange })

    const handler = ipcHandlers.get(IpcChannels.setSelectedModel)

    if (!handler) {
      throw new Error('setSelectedModel handler was not registered')
    }

    return handler
  }

  it('persists a valid model and notifies the listener', () => {
    mockDir(['a.gguf'])
    const onChange = vi.fn()
    const handler = getSetSelectedModelHandler(onChange)

    expect(handler({}, 'a.gguf')).toBe('a.gguf')
    expect(storeValues.get('selectedModel')).toBe('a.gguf')
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('clears the selection and notifies when set to null', () => {
    mockDir(['a.gguf'])
    storeValues.set('selectedModel', 'a.gguf')
    const onChange = vi.fn()
    const handler = getSetSelectedModelHandler(onChange)

    expect(handler({}, null)).toBeNull()
    expect(storeValues.get('selectedModel')).toBeNull()
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('rejects an unknown model', () => {
    mockDir(['a.gguf'])
    const handler = getSetSelectedModelHandler(vi.fn())

    expect(() => handler({}, 'missing.gguf')).toThrow('Model not found')
  })
})
