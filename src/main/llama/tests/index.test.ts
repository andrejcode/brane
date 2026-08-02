import { IpcChannels, type LlamaStreamEvent } from '@shared/types'
import {
  createElectronMock,
  getIpcHandler,
  resetElectronMock,
} from '@test/main/electron'
import { registerLlamaHandlers } from '../index'

const { promptWithMeta, dispose, loadModelMock, createContextMock } =
  vi.hoisted(() => ({
    promptWithMeta: vi.fn(),
    dispose: vi.fn(() => Promise.resolve()),
    loadModelMock: vi.fn(),
    createContextMock: vi.fn(),
  }))

vi.mock('electron', () => createElectronMock())

vi.mock('../../model', () => ({
  getSelectedModelPath: vi.fn(() => '/fake/models/model.gguf'),
  getModelPath: vi.fn(() => '/fake/models/model.gguf'),
}))

vi.mock('node-llama-cpp', () => ({
  getLlama: vi.fn(() => Promise.resolve({ loadModel: loadModelMock })),
  LlamaChatSession: class {
    promptWithMeta = promptWithMeta
  },
}))

function createFakeModel() {
  return {
    filename: 'model.gguf',
    size: 4 * 1024 ** 3,
    trainContextSize: 4096,
    gpuLayers: 32,
    fileInsights: { totalLayers: 32 },
    getWarnings: () => [],
    createContext: createContextMock,
    dispose,
  }
}

function createEvent() {
  const send = vi.fn()
  const event = { sender: { isDestroyed: () => false, send } }

  return { event, send }
}

function getStreamEvents(send: ReturnType<typeof vi.fn>): LlamaStreamEvent[] {
  return send.mock.calls
    .filter(([channel]) => channel === IpcChannels.llamaStreamResponse)
    .map(([, payload]) => payload as LlamaStreamEvent)
}

beforeEach(() => {
  resetElectronMock()
  promptWithMeta.mockReset()
  loadModelMock.mockReset()
  createContextMock.mockReset()
  dispose.mockClear()
  createContextMock.mockResolvedValue({ getSequence: () => ({}) })
  loadModelMock.mockImplementation(() => Promise.resolve(createFakeModel()))
  registerLlamaHandlers()
})

afterEach(async () => {
  // The llama module keeps the loaded model/session in module state, so reset it
  // between tests to keep them independent.
  await getIpcHandler(IpcChannels.llamaUnloadModel)()
  vi.clearAllMocks()
})

describe('llama send-prompt handler', () => {
  it('sends a done event with the response on normal completion', async () => {
    promptWithMeta.mockResolvedValueOnce({
      responseText: 'hello',
      stopReason: 'eogToken',
    })

    const { event, send } = createEvent()
    await getIpcHandler(IpcChannels.llamaSendPrompt)(event, 'hi')

    expect(getStreamEvents(send)).toContainEqual({
      type: 'done',
      response: 'hello',
      stopped: false,
    })
  })

  it('marks a mid-stream abort as a stop instead of an error', async () => {
    promptWithMeta.mockResolvedValueOnce({
      responseText: 'partial',
      stopReason: 'abort',
    })

    const { event, send } = createEvent()
    await getIpcHandler(IpcChannels.llamaSendPrompt)(event, 'hi')

    expect(getStreamEvents(send)).toContainEqual({
      type: 'done',
      response: 'partial',
      stopped: true,
    })
  })

  it('treats an abort before streaming as a normal stop, not an error', async () => {
    // Aborting before any chunk is generated makes node-llama-cpp reject,
    // so simulate that by aborting from inside the pending generation.
    promptWithMeta.mockImplementationOnce(async () => {
      await getIpcHandler(IpcChannels.llamaStopGeneration)()
      throw new Error('This operation was aborted')
    })

    const { event, send } = createEvent()
    await getIpcHandler(IpcChannels.llamaSendPrompt)(event, 'hi')

    const events = getStreamEvents(send)

    expect(events).toContainEqual({
      type: 'done',
      response: '',
      stopped: true,
    })
    expect(events.some((streamEvent) => streamEvent.type === 'error')).toBe(
      false,
    )
  })

  it('sends an error event with a friendly message when generation fails without an abort', async () => {
    promptWithMeta.mockRejectedValueOnce(new Error('boom'))

    const { event, send } = createEvent()
    await getIpcHandler(IpcChannels.llamaSendPrompt)(event, 'hi')

    expect(getStreamEvents(send)).toContainEqual({
      type: 'error',
      message: 'The model failed to generate a response. Please try again.',
    })
  })

  it('rejects an empty prompt', async () => {
    const { event } = createEvent()

    await expect(
      getIpcHandler(IpcChannels.llamaSendPrompt)(event, '   '),
    ).rejects.toThrow('Prompt must be a non-empty string.')
  })

  it('rejects a second prompt while a response is already streaming', async () => {
    let finishPrompt!: (value: {
      responseText: string
      stopReason: string
    }) => void

    promptWithMeta.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishPrompt = resolve
        }),
    )

    const { event } = createEvent()
    const first = getIpcHandler(IpcChannels.llamaSendPrompt)(event, 'first')

    await vi.waitFor(() => {
      expect(promptWithMeta).toHaveBeenCalled()
    })

    await expect(
      getIpcHandler(IpcChannels.llamaSendPrompt)(event, 'second'),
    ).rejects.toThrow('A response is already streaming.')

    finishPrompt({ responseText: 'done', stopReason: 'eogToken' })
    await first
  })

  it('streams text chunks, tags thoughts, and drops comments', async () => {
    promptWithMeta.mockImplementationOnce(
      (
        _prompt: string,
        options: {
          onResponseChunk: (chunk: {
            type?: string
            segmentType?: string
            text: string
          }) => void
        },
      ) => {
        options.onResponseChunk({
          type: 'segment',
          segmentType: 'thought',
          text: 'reasoning',
        })
        options.onResponseChunk({
          type: 'segment',
          segmentType: 'comment',
          text: 'hidden',
        })
        options.onResponseChunk({ text: 'Hello' })
        options.onResponseChunk({ text: ' world' })

        return Promise.resolve({
          responseText: 'fallback',
          stopReason: 'eogToken',
        })
      },
    )

    const { event, send } = createEvent()
    await getIpcHandler(IpcChannels.llamaSendPrompt)(event, 'hi')

    expect(getStreamEvents(send)).toEqual([
      { type: 'chunk', text: 'reasoning', segment: 'thought' },
      { type: 'chunk', text: 'Hello' },
      { type: 'chunk', text: ' world' },
      { type: 'done', response: 'Hello world', stopped: false },
    ])
  })
})

describe('llama load/unload handlers', () => {
  it('loads the model without sending a prompt', async () => {
    await expect(
      getIpcHandler(IpcChannels.llamaLoadModel)({}, 'model.gguf'),
    ).resolves.toBeUndefined()
  })

  it('rejects a load with a clear message when no model is provided', async () => {
    await expect(
      getIpcHandler(IpcChannels.llamaLoadModel)({}, undefined),
    ).rejects.toThrow('No model selected. Please select a model in settings.')
  })

  it('reuses the loaded session for a subsequent prompt', async () => {
    promptWithMeta.mockResolvedValueOnce({
      responseText: 'hi',
      stopReason: 'eogToken',
    })

    await getIpcHandler(IpcChannels.llamaLoadModel)({}, 'model.gguf')

    const { event, send } = createEvent()
    await getIpcHandler(IpcChannels.llamaSendPrompt)(event, 'hello')

    expect(loadModelMock).toHaveBeenCalledTimes(1)
    expect(getStreamEvents(send)).toContainEqual({
      type: 'done',
      response: 'hi',
      stopped: false,
    })
  })

  it('unloads without throwing when no generation is in flight', async () => {
    await getIpcHandler(IpcChannels.llamaLoadModel)({}, 'model.gguf')

    await expect(
      getIpcHandler(IpcChannels.llamaUnloadModel)(),
    ).resolves.toBeUndefined()
    expect(dispose).toHaveBeenCalled()
  })

  it('aborts the in-flight generation and unloads while streaming', async () => {
    // Resolve with an abort stop reason as soon as the abort signal fires, the
    // way node-llama-cpp settles a streamed prompt that was stopped mid-flight.
    promptWithMeta.mockImplementationOnce(
      (_prompt: string, options: { signal: AbortSignal }) =>
        new Promise((resolve) => {
          options.signal.addEventListener('abort', () => {
            resolve({ responseText: 'partial', stopReason: 'abort' })
          })
        }),
    )

    const { event, send } = createEvent()
    const prompt = getIpcHandler(IpcChannels.llamaSendPrompt)(event, 'hello')

    // Generation only begins once the session resolves, so wait for it to start
    // before unloading.
    await vi.waitFor(() => {
      expect(promptWithMeta).toHaveBeenCalled()
    })

    await getIpcHandler(IpcChannels.llamaUnloadModel)()
    await prompt

    expect(getStreamEvents(send)).toContainEqual({
      type: 'done',
      response: 'partial',
      stopped: true,
    })
    expect(dispose).toHaveBeenCalled()
  })

  it('cancels an in-flight load and lets a later load succeed', async () => {
    // A load that only settles once its abort signal fires, mirroring how
    // node-llama-cpp rejects loadModel when loadSignal aborts.
    loadModelMock.mockImplementationOnce(
      (options: { loadSignal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options.loadSignal.addEventListener('abort', () => {
            reject(new Error('The load was aborted'))
          })
        }),
    )

    const canceledLoad = getIpcHandler(IpcChannels.llamaLoadModel)(
      {},
      'model.gguf',
    )
    await vi.waitFor(() => {
      expect(loadModelMock).toHaveBeenCalledTimes(1)
    })

    await getIpcHandler(IpcChannels.llamaUnloadModel)()
    await expect(canceledLoad).rejects.toThrow()

    // The next load uses the default resolving mock and should complete.
    await expect(
      getIpcHandler(IpcChannels.llamaLoadModel)({}, 'model.gguf'),
    ).resolves.toBeUndefined()
    expect(loadModelMock).toHaveBeenCalledTimes(2)
  })

  it('disposes the model when a load is canceled during context creation', async () => {
    createContextMock.mockImplementationOnce(
      (options: { createSignal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options.createSignal.addEventListener('abort', () => {
            reject(new Error('The context creation was aborted'))
          })
        }),
    )

    const canceledLoad = getIpcHandler(IpcChannels.llamaLoadModel)(
      {},
      'model.gguf',
    )
    await vi.waitFor(() => {
      expect(createContextMock).toHaveBeenCalled()
    })

    await getIpcHandler(IpcChannels.llamaUnloadModel)()
    await expect(canceledLoad).rejects.toThrow()
    // The model finished loading before the cancel, so it must be disposed.
    expect(dispose).toHaveBeenCalled()
  })
})
