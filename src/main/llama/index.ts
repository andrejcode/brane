import { ipcMain, type WebContents } from 'electron'
import {
  getLlama,
  LlamaChatSession,
  type ChatHistoryItem,
  type Llama,
  type LlamaChatResponseChunk,
  type LlamaModel,
} from 'node-llama-cpp'
import {
  IpcChannels,
  type FinishReason,
  type LlamaResponseSegment,
  type LlamaStreamEvent,
} from '@shared/types'
import { appendMessage, listMessages } from '../db/chats'
import { logger } from '../logger'
import { getModelPath, getSelectedModelPath } from '../model'

let sessionPromise: Promise<LlamaChatSession> | undefined
let loadedModel: LlamaModel | undefined
let loadAbortController: AbortController | undefined
let pendingTeardown: Promise<void> | undefined
let isGenerating = false
let activeAbortController: AbortController | undefined
let activeGeneration: Promise<void> | undefined
// Which chat the live session's context belongs to, so switching chats reseeds it
// while further turns in the same chat keep the context already in memory.
let primedChatId: string | undefined

async function getSession(modelPath: string | null) {
  // Never load a new model while the previous one is still being disposed.
  if (pendingTeardown) {
    await pendingTeardown
  }

  if (sessionPromise === undefined) {
    const abortController = new AbortController()
    loadAbortController = abortController

    // Don't cache a rejected promise: if loading the model/context fails (or is
    // canceled), clear it so the next attempt can retry from scratch.
    sessionPromise = createSession(modelPath, abortController.signal)
      .catch((error: unknown) => {
        sessionPromise = undefined
        throw error
      })
      .finally(() => {
        if (loadAbortController === abortController) {
          loadAbortController = undefined
        }
      })
  }

  return sessionPromise
}

// Awaits the dispose so the model is fully freed before another is loaded; two
// resident models can exhaust the hardware.
async function resetLlamaSession() {
  sessionPromise = undefined
  primedChatId = undefined

  const modelToDispose = loadedModel
  loadedModel = undefined

  if (modelToDispose) {
    logger.info(`Disposing model: ${modelToDispose.filename}`)
    await modelToDispose.dispose()
  }
}

// Aborts any in-flight generation and model load, then disposes. Serialized
// through `pendingTeardown` so a concurrent load waits for it to finish.
export async function unloadLlamaModel() {
  activeAbortController?.abort()
  loadAbortController?.abort()

  const teardown = (async () => {
    await activeGeneration
    // A canceled load rejects after disposing its own partial model; wait for it
    // to settle before the final reset.
    await sessionPromise?.catch(() => {})
    await resetLlamaSession()
  })()
  pendingTeardown = teardown

  try {
    await teardown
  } finally {
    if (pendingTeardown === teardown) {
      pendingTeardown = undefined
    }
  }
}

async function initLlama() {
  try {
    return await getLlama()
  } catch (error) {
    logger.error('Failed to initialize the llama runtime', error)
    throw new Error('Failed to initialize the llama runtime. Please try again.')
  }
}

async function loadModel(
  llama: Llama,
  modelPath: string | null,
  signal: AbortSignal,
) {
  if (modelPath === null) {
    logger.warn('Model load attempted with no model selected')
    throw new Error('No model selected. Please select a model in settings.')
  }

  logger.info(`Loading model: ${modelPath}`)

  try {
    const model = await llama.loadModel({ modelPath, loadSignal: signal })

    logger.info(
      `Model loaded: ${model.filename ?? modelPath}\n`,
      `Size: ${(model.size / 1024 ** 3).toFixed(2)} GiB\n`,
      `Context size: ${model.trainContextSize}\n`,
      `GPU layers: ${model.gpuLayers}/${model.fileInsights.totalLayers}`,
    )

    for (const warning of model.getWarnings()) {
      logger.warn(`Model warning: ${warning}`)
    }

    return model
  } catch (error) {
    // A canceled load isn't a failure; let the abort propagate untouched.
    if (signal.aborted) {
      logger.info(`Model load canceled: ${modelPath}`)
      throw error
    }

    logger.error(`Failed to load model: ${modelPath}`, error)
    throw new Error(
      'Failed to load the selected model. Make sure the model file exists and is a valid model.',
    )
  }
}

async function createContext(model: LlamaModel, signal: AbortSignal) {
  try {
    return await model.createContext({ createSignal: signal })
  } catch (error) {
    if (signal.aborted) {
      logger.info('Model context creation canceled')
      throw error
    }

    logger.error('Failed to create model context', error)
    throw new Error(
      'Failed to create a model context. The model may require more memory than is available.',
    )
  }
}

async function createSession(modelPath: string | null, signal: AbortSignal) {
  const llama = await initLlama()

  let model: LlamaModel | undefined

  try {
    model = await loadModel(llama, modelPath, signal)
    loadedModel = model

    const context = await createContext(model, signal)

    try {
      const session = new LlamaChatSession({
        contextSequence: context.getSequence(),
      })
      logger.info('Chat session ready')
      return session
    } catch (error) {
      logger.error('Failed to start a chat session', error)
      throw new Error('Failed to start a chat session. Please try again.')
    }
  } catch (error) {
    // If the model loaded before we failed or were canceled, dispose it here so
    // we never leak a resident model that nothing else tracks.
    if (model !== undefined) {
      loadedModel = undefined
      await model.dispose()
    }

    throw error
  }
}

function sendStreamEvent(webContents: WebContents, event: LlamaStreamEvent) {
  if (webContents.isDestroyed()) {
    return
  }

  webContents.send(IpcChannels.llamaStreamResponse, event)
}

interface ClassifiedChunk {
  text: string
  segment?: LlamaResponseSegment
}

// Returns null for chunks that should be dropped entirely. `comment` segments
// are only produced by a few models and aren't shown to the user, so we skip
// them rather than relying on the renderer to parse them back out of the text.
function classifyResponseChunk(
  chunk: LlamaChatResponseChunk,
): ClassifiedChunk | null {
  if (chunk.type === 'segment' && chunk.segmentType === 'comment') {
    return null
  }

  if (chunk.type === 'segment' && chunk.segmentType === 'thought') {
    return { text: chunk.text, segment: 'thought' }
  }

  return { text: chunk.text }
}

// Thoughts are deliberately left out: they're stored for display but replaying
// them would spend context on the model's own reasoning.
function toChatHistory(chatId: string): ChatHistoryItem[] {
  return listMessages(chatId).flatMap<ChatHistoryItem>((message) => {
    if (message.role === 'user') {
      return [{ type: 'user', text: message.content }]
    }

    return message.content.length === 0
      ? []
      : [{ type: 'model', response: [message.content] }]
  })
}

// Loads a stored conversation into the session before its next turn. Failing to
// read history must still clear the context, or this chat would inherit the
// previous one's.
function primeSession(session: LlamaChatSession, chatId: string) {
  if (primedChatId === chatId) {
    return
  }

  let history: ChatHistoryItem[] = []

  try {
    history = toChatHistory(chatId)
  } catch (error) {
    logger.error(`Failed to read history for chat ${chatId}`, error)
  }

  if (history.length === 0) {
    session.resetChatHistory()
  } else {
    session.setChatHistory(history)
    logger.info(`Primed chat ${chatId} with ${history.length} stored turns`)
  }

  primedChatId = chatId
}

// Persistence is best-effort: a chat that can't be written down is still worth
// answering, so failures are logged rather than surfaced as generation errors.
function persistTurn(
  chatId: string,
  message: Parameters<typeof appendMessage>[0],
) {
  try {
    appendMessage(message)
  } catch (error) {
    logger.error(`Failed to store a message for chat ${chatId}`, error)
  }
}

function persistAssistantTurn(
  chatId: string,
  content: string,
  reasoning: string,
  finishReason: FinishReason,
) {
  // Nothing was generated, so there's no turn worth keeping. Matches the
  // renderer dropping its empty placeholder.
  if (content.length === 0 && reasoning.length === 0) {
    return
  }

  persistTurn(chatId, {
    chatId,
    role: 'assistant',
    content,
    reasoning: reasoning.length === 0 ? null : reasoning,
    finishReason,
  })
}

async function streamPrompt(
  sender: WebContents,
  prompt: string,
  chatId: string,
  abortController: AbortController,
) {
  logger.info(`Prompt received (${prompt.length} chars), generating response`)

  const responseChunks: string[] = []
  const thoughtChunks: string[] = []

  try {
    const session = await getSession(getSelectedModelPath())

    primeSession(session, chatId)
    persistTurn(chatId, { chatId, role: 'user', content: prompt })

    const response = await session.promptWithMeta(prompt, {
      signal: abortController.signal,
      stopOnAbortSignal: true,
      onResponseChunk(chunk) {
        const classified = classifyResponseChunk(chunk)

        if (classified === null) {
          return
        }

        if (classified.segment === undefined) {
          // Keep thoughts out of the final response text; only the user-facing
          // answer is accumulated for the `done` fallback.
          responseChunks.push(classified.text)
          sendStreamEvent(sender, { type: 'chunk', text: classified.text })
          return
        }

        thoughtChunks.push(classified.text)
        sendStreamEvent(sender, {
          type: 'chunk',
          text: classified.text,
          segment: classified.segment,
        })
      },
    })

    const responseText = responseChunks.join('') || response.responseText
    const stopped = response.stopReason === 'abort'
    logger.info(
      `Response complete (${responseText.length} chars, stopReason: ${response.stopReason})`,
    )

    persistAssistantTurn(
      chatId,
      responseText,
      thoughtChunks.join(''),
      stopped ? 'stopped' : 'done',
    )
    sendStreamEvent(sender, {
      type: 'done',
      response: responseText,
      stopped,
    })
  } catch (error) {
    // Aborting before generation starts streaming rejects instead of
    // resolving with a partial response, so treat it as a normal stop.
    if (abortController.signal.aborted) {
      logger.info('Generation aborted')
      persistAssistantTurn(
        chatId,
        responseChunks.join(''),
        thoughtChunks.join(''),
        'stopped',
      )
      sendStreamEvent(sender, {
        type: 'done',
        response: '',
        stopped: true,
      })
    } else {
      logger.error('Generation failed', error)
      persistAssistantTurn(
        chatId,
        responseChunks.join(''),
        thoughtChunks.join(''),
        'error',
      )
      sendStreamEvent(sender, {
        type: 'error',
        message: 'The model failed to generate a response. Please try again.',
      })
    }
  } finally {
    activeAbortController = undefined
    isGenerating = false
  }
}

export function registerLlamaHandlers() {
  ipcMain.handle(
    IpcChannels.llamaSendPrompt,
    async (event, prompt: unknown, chatId: unknown) => {
      if (typeof prompt !== 'string' || prompt.trim().length === 0) {
        logger.warn('Rejected prompt: not a non-empty string')
        throw new Error('Prompt must be a non-empty string.')
      }

      if (typeof chatId !== 'string' || chatId.length === 0) {
        logger.warn('Rejected prompt: missing chat id')
        throw new Error('Prompt must belong to a chat.')
      }

      // New chat (or a rapid re-send) may abort while the previous turn is still
      // settling; wait it out instead of rejecting so the model stays single-flight.
      if (isGenerating) {
        logger.info(
          'Aborting in-flight generation before starting a new prompt',
        )
        activeAbortController?.abort()
        await activeGeneration
      }

      isGenerating = true
      const abortController = new AbortController()
      activeAbortController = abortController
      const generation = streamPrompt(
        event.sender,
        prompt,
        chatId,
        abortController,
      )
      activeGeneration = generation

      try {
        await generation
      } finally {
        // A newer prompt may already own this slot after abort-and-replace.
        if (activeGeneration === generation) {
          activeGeneration = undefined
        }
      }
    },
  )

  ipcMain.handle(IpcChannels.llamaStopGeneration, () => {
    logger.info('Stop generation requested')
    activeAbortController?.abort()
  })

  // Warms the session up front so the first prompt isn't delayed by loading.
  // The exact model is passed in rather than read from the store, so a rapid
  // reselect can't leave this loading a model the user already switched away from.
  ipcMain.handle(IpcChannels.llamaLoadModel, async (_event, model: unknown) => {
    logger.info('Model load requested')
    const modelPath = typeof model === 'string' ? getModelPath(model) : null
    await getSession(modelPath)
  })

  // Also serves as "cancel": unloading aborts an in-flight load, not just a
  // running generation.
  ipcMain.handle(IpcChannels.llamaUnloadModel, async () => {
    logger.info('Model unload requested')
    await unloadLlamaModel()
  })
}
