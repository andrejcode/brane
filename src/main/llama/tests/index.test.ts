import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IpcChannels, type LlamaStreamEvent } from '@shared/types'
import { registerLlamaHandlers } from '../index'

type IpcHandler = (...args: unknown[]) => unknown

const { ipcHandlers, promptWithMeta, dispose } = vi.hoisted(() => ({
  ipcHandlers: new Map<string, IpcHandler>(),
  promptWithMeta: vi.fn(),
  dispose: vi.fn(() => Promise.resolve()),
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: IpcHandler) => {
      ipcHandlers.set(channel, handler)
    },
  },
}))

vi.mock('../../model', () => ({
  getSelectedModelPath: vi.fn(() => '/fake/models/model.gguf'),
}))

vi.mock('node-llama-cpp', () => ({
  getLlama: vi.fn(() =>
    Promise.resolve({
      loadModel: vi.fn(() =>
        Promise.resolve({
          createContext: vi.fn(() =>
            Promise.resolve({
              getSequence: vi.fn(() => ({})),
            }),
          ),
          dispose,
        }),
      ),
    }),
  ),
  LlamaChatSession: class {
    promptWithMeta = promptWithMeta
  },
}))

function getHandler(channel: string): IpcHandler {
  const handler = ipcHandlers.get(channel)

  if (!handler) {
    throw new Error(`No handler registered for ${channel}`)
  }

  return handler
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
  promptWithMeta.mockReset()
  registerLlamaHandlers()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('llama send-prompt handler', () => {
  it('sends a done event with the response on normal completion', async () => {
    promptWithMeta.mockResolvedValueOnce({
      responseText: 'hello',
      stopReason: 'eogToken',
    })

    const { event, send } = createEvent()
    await getHandler(IpcChannels.llamaSendPrompt)(event, 'hi')

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
    await getHandler(IpcChannels.llamaSendPrompt)(event, 'hi')

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
      await getHandler(IpcChannels.llamaStopGeneration)()
      throw new Error('This operation was aborted')
    })

    const { event, send } = createEvent()
    await getHandler(IpcChannels.llamaSendPrompt)(event, 'hi')

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

  it('sends an error event with the raw message when generation fails without an abort', async () => {
    promptWithMeta.mockRejectedValueOnce(new Error('boom'))

    const { event, send } = createEvent()
    await getHandler(IpcChannels.llamaSendPrompt)(event, 'hi')

    expect(getStreamEvents(send)).toContainEqual({
      type: 'error',
      message: 'boom',
    })
  })

  it('rejects an empty prompt', async () => {
    const { event } = createEvent()

    await expect(
      getHandler(IpcChannels.llamaSendPrompt)(event, '   '),
    ).rejects.toThrow('Prompt must be a non-empty string.')
  })
})

describe('llama load/unload handlers', () => {
  it('loads the model without sending a prompt', async () => {
    await expect(
      getHandler(IpcChannels.llamaLoadModel)(),
    ).resolves.toBeUndefined()
  })

  it('reuses the loaded session for a subsequent prompt', async () => {
    promptWithMeta.mockResolvedValueOnce({
      responseText: 'hi',
      stopReason: 'eogToken',
    })

    await getHandler(IpcChannels.llamaLoadModel)()

    const { event, send } = createEvent()
    await getHandler(IpcChannels.llamaSendPrompt)(event, 'hello')

    expect(getStreamEvents(send)).toContainEqual({
      type: 'done',
      response: 'hi',
      stopped: false,
    })
  })

  it('unloads without throwing when no generation is in flight', async () => {
    await getHandler(IpcChannels.llamaLoadModel)()

    await expect(
      getHandler(IpcChannels.llamaUnloadModel)(),
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
    const prompt = getHandler(IpcChannels.llamaSendPrompt)(event, 'hello')

    // Generation only begins once the session resolves, so wait for it to start
    // before unloading.
    await vi.waitFor(() => {
      expect(promptWithMeta).toHaveBeenCalled()
    })

    await getHandler(IpcChannels.llamaUnloadModel)()
    await prompt

    expect(getStreamEvents(send)).toContainEqual({
      type: 'done',
      response: 'partial',
      stopped: true,
    })
    expect(dispose).toHaveBeenCalled()
  })
})
