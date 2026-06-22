import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IpcChannels, type LlamaStreamEvent } from '@shared/types'
import { registerLlamaHandlers } from '../index'

type IpcHandler = (...args: unknown[]) => unknown

const { ipcHandlers, promptWithMeta } = vi.hoisted(() => ({
  ipcHandlers: new Map<string, IpcHandler>(),
  promptWithMeta: vi.fn(),
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
    ).rejects.toThrow('Prompt must be a non-empty string')
  })
})
