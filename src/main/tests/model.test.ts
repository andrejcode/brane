import fs from 'node:fs'
import { IpcChannels } from '@shared/types'
import {
  createElectronMock,
  getIpcHandler,
  resetElectronMock,
} from '@test/main/electron'
import { createStoreMock, resetStoreMock, storeValues } from '@test/main/store'
import {
  getModelAvailability,
  getModelFileSize,
  getModelState,
  getSelectedModel,
  getSelectedModelPath,
  listModels,
  registerModelHandlers,
} from '../model'

vi.mock('electron', () => createElectronMock())

vi.mock('../store', () => createStoreMock())

function mockDir(names: string[]) {
  const entries = names.map((name) => ({
    name,
    isFile: () => !name.endsWith('/'),
  }))

  vi.spyOn(fs, 'readdirSync').mockReturnValue(
    entries as unknown as ReturnType<typeof fs.readdirSync>,
  )
}

function mockStat({ size, isFile = true }: { size: number; isFile?: boolean }) {
  return vi.spyOn(fs, 'statSync').mockReturnValue({
    size,
    isFile: () => isFile,
  } as unknown as fs.Stats)
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
  resetStoreMock()
  resetElectronMock()
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

describe('getModelFileSize', () => {
  it('returns the size of an existing model file', () => {
    mockStat({ size: 4096 })

    expect(getModelFileSize('a.gguf')).toBe(4096)
  })

  it('returns null when the path is not a file', () => {
    mockStat({ size: 4096, isFile: false })

    expect(getModelFileSize('a.gguf')).toBeNull()
  })

  it('returns null when the file cannot be read', () => {
    vi.spyOn(fs, 'statSync').mockImplementation(() => {
      throw new Error('ENOENT')
    })

    expect(getModelFileSize('a.gguf')).toBeNull()
  })
})

describe('getModelAvailability', () => {
  it('reports a chat model that is unchanged as available', () => {
    mockStat({ size: 4096 })

    expect(getModelAvailability('a.gguf', 4096)).toBe('available')
  })

  it('reports a same-named model of a different size as replaced', () => {
    mockStat({ size: 8192 })

    expect(getModelAvailability('a.gguf', 4096)).toBe('replaced')
  })

  it('reports a deleted model as missing', () => {
    vi.spyOn(fs, 'statSync').mockImplementation(() => {
      throw new Error('ENOENT')
    })

    expect(getModelAvailability('a.gguf', 4096)).toBe('missing')
  })
})

describe('registerModelHandlers setSelectedModel', () => {
  function getSetSelectedModelHandler(onSelectedModelChange: () => void) {
    registerModelHandlers({ onSelectedModelChange })
    return getIpcHandler(IpcChannels.setSelectedModel)
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
