import { IpcChannels, type LlamaStreamEvent } from '@shared/types'
import {
  createElectronMock,
  getIpcHandler,
  resetElectronMock,
} from '@test/main/electron'
import { registerLlamaHandlers } from '../index'

const {
  promptWithMeta,
  dispose,
  loadModelMock,
  createContextMock,
  appendMessage,
  listMessages,
  setChatHistory,
  resetChatHistory,
} = vi.hoisted(() => ({
  promptWithMeta: vi.fn(),
  dispose: vi.fn(() => Promise.resolve()),
  loadModelMock: vi.fn(),
  createContextMock: vi.fn(),
  appendMessage: vi.fn(),
  listMessages: vi.fn(() => []),
  setChatHistory: vi.fn(),
  resetChatHistory: vi.fn(),
}))

vi.mock('electron', () => createElectronMock())

vi.mock('../../model', () => ({
  getSelectedModelPath: vi.fn(() => '/fake/models/model.gguf'),
  getModelPath: vi.fn(() => '/fake/models/model.gguf'),
}))

vi.mock('../../db/chats', () => ({ appendMessage, listMessages }))

vi.mock('node-llama-cpp', () => ({
  getLlama: vi.fn(() => Promise.resolve({ loadModel: loadModelMock })),
  LlamaChatSession: class {
    promptWithMeta = promptWithMeta
    setChatHistory = setChatHistory
    resetChatHistory = resetChatHistory
  },
}))

const CHAT_ID = 'chat-1'

function sendPrompt(event: unknown, prompt = 'hi', chatId = CHAT_ID) {
  return getIpcHandler(IpcChannels.llamaSendPrompt)(event, prompt, chatId)
}

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
  appendMessage.mockReset()
  listMessages.mockReset()
  listMessages.mockReturnValue([])
  setChatHistory.mockReset()
  resetChatHistory.mockReset()
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
    await sendPrompt(event, 'hi')

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
    await sendPrompt(event, 'hi')

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
    await sendPrompt(event, 'hi')

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
    await sendPrompt(event, 'hi')

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

  it('rejects a prompt that does not belong to a chat', async () => {
    const { event } = createEvent()

    await expect(sendPrompt(event, 'hi', '')).rejects.toThrow(
      'Prompt must belong to a chat.',
    )
  })

  it('aborts an in-flight generation when a second prompt arrives', async () => {
    promptWithMeta
      .mockImplementationOnce(
        (_prompt: string, options: { signal: AbortSignal }) =>
          new Promise((resolve) => {
            options.signal.addEventListener('abort', () => {
              resolve({ responseText: 'partial', stopReason: 'abort' })
            })
          }),
      )
      .mockResolvedValueOnce({
        responseText: 'second answer',
        stopReason: 'eogToken',
      })

    const { event, send } = createEvent()
    const first = sendPrompt(event, 'first')

    await vi.waitFor(() => {
      expect(promptWithMeta).toHaveBeenCalledTimes(1)
    })

    await sendPrompt(event, 'second')
    await first

    expect(promptWithMeta).toHaveBeenCalledTimes(2)
    expect(getStreamEvents(send)).toContainEqual({
      type: 'done',
      response: 'second answer',
      stopped: false,
    })
  })

  it('stores the prompt and the finished answer', async () => {
    promptWithMeta.mockResolvedValueOnce({
      responseText: 'hello',
      stopReason: 'eogToken',
    })

    const { event } = createEvent()
    await sendPrompt(event, 'hi')

    expect(appendMessage).toHaveBeenNthCalledWith(1, {
      chatId: CHAT_ID,
      role: 'user',
      content: 'hi',
    })
    expect(appendMessage).toHaveBeenNthCalledWith(2, {
      chatId: CHAT_ID,
      role: 'assistant',
      content: 'hello',
      reasoning: null,
      finishReason: 'done',
    })
  })

  it('stores a stopped answer with whatever streamed', async () => {
    promptWithMeta.mockResolvedValueOnce({
      responseText: 'partial',
      stopReason: 'abort',
    })

    const { event } = createEvent()
    await sendPrompt(event, 'hi')

    expect(appendMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ content: 'partial', finishReason: 'stopped' }),
    )
  })

  it('stores the thoughts a turn produced alongside its answer', async () => {
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
          text: 'pondering',
        })
        options.onResponseChunk({ text: 'answer' })

        return Promise.resolve({
          responseText: 'answer',
          stopReason: 'eogToken',
        })
      },
    )

    const { event } = createEvent()
    await sendPrompt(event, 'hi')

    expect(appendMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ content: 'answer', reasoning: 'pondering' }),
    )
  })

  it('skips storing an answer when nothing was generated', async () => {
    promptWithMeta.mockResolvedValueOnce({
      responseText: '',
      stopReason: 'abort',
    })

    const { event } = createEvent()
    await sendPrompt(event, 'hi')

    expect(appendMessage).toHaveBeenCalledTimes(1)
    expect(appendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'user' }),
    )
  })

  it('keeps answering when the turn cannot be stored', async () => {
    appendMessage.mockImplementation(() => {
      throw new Error('database is gone')
    })
    promptWithMeta.mockResolvedValueOnce({
      responseText: 'hello',
      stopReason: 'eogToken',
    })

    const { event, send } = createEvent()
    await sendPrompt(event, 'hi')

    expect(getStreamEvents(send)).toContainEqual({
      type: 'done',
      response: 'hello',
      stopped: false,
    })
  })

  it('seeds the session with a stored conversation, leaving thoughts out', async () => {
    listMessages.mockReturnValue([
      { role: 'user', content: 'earlier question' },
      { role: 'assistant', content: 'earlier answer', reasoning: 'pondering' },
    ] as unknown as [])
    promptWithMeta.mockResolvedValueOnce({
      responseText: 'hello',
      stopReason: 'eogToken',
    })

    const { event } = createEvent()
    await sendPrompt(event, 'hi')

    expect(setChatHistory).toHaveBeenCalledWith([
      { type: 'user', text: 'earlier question' },
      { type: 'model', response: ['earlier answer'] },
    ])
  })

  it('seeds only once for consecutive turns in the same chat', async () => {
    listMessages.mockReturnValue([
      { role: 'user', content: 'earlier question' },
    ] as unknown as [])
    promptWithMeta.mockResolvedValue({
      responseText: 'hello',
      stopReason: 'eogToken',
    })

    const { event } = createEvent()
    await sendPrompt(event, 'first')
    await sendPrompt(event, 'second')

    expect(setChatHistory).toHaveBeenCalledTimes(1)
  })

  it('clears the context when switching to a chat with no history', async () => {
    listMessages.mockReturnValueOnce([
      { role: 'user', content: 'earlier question' },
    ] as unknown as [])
    promptWithMeta.mockResolvedValue({
      responseText: 'hello',
      stopReason: 'eogToken',
    })

    const { event } = createEvent()
    await sendPrompt(event, 'hi', 'chat-with-history')
    await sendPrompt(event, 'hi', 'fresh-chat')

    expect(resetChatHistory).toHaveBeenCalledTimes(1)
  })

  it('clears the context when stored history cannot be read', async () => {
    listMessages.mockImplementation(() => {
      throw new Error('database is gone')
    })
    promptWithMeta.mockResolvedValueOnce({
      responseText: 'hello',
      stopReason: 'eogToken',
    })

    const { event } = createEvent()
    await sendPrompt(event, 'hi')

    expect(resetChatHistory).toHaveBeenCalledTimes(1)
    expect(setChatHistory).not.toHaveBeenCalled()
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
    await sendPrompt(event, 'hi')

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
    await sendPrompt(event, 'hello')

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
    const prompt = sendPrompt(event, 'hello')

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
