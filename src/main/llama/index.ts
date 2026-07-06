import { ipcMain, type WebContents } from 'electron'
import {
  getLlama,
  LlamaChatSession,
  type Llama,
  type LlamaChatResponseChunk,
  type LlamaModel,
} from 'node-llama-cpp'
import { getErrorMessage } from '@shared/getErrorMessage'
import { IpcChannels, type LlamaStreamEvent } from '@shared/types'
import { logger } from '../logger'
import { getSelectedModelPath } from '../model'

let sessionPromise: Promise<LlamaChatSession> | undefined
let loadedModel: LlamaModel | undefined
let isGenerating = false
let activeAbortController: AbortController | undefined
let activeGeneration: Promise<void> | undefined

function getSession() {
  // Don't cache a rejected promise: if loading the model/context fails, clear
  // it so the next prompt can retry instead of reusing the failed attempt.
  sessionPromise ??= createSession().catch((error: unknown) => {
    sessionPromise = undefined
    throw error
  })

  return sessionPromise
}

// Tears down the active session and disposes the model. Awaits the dispose so
// callers can guarantee the model is fully unloaded before loading another one,
// since holding two models resident at once can exhaust the hardware.
// TODO: Separate the session and model disposal into two functions.
export async function resetLlamaSession() {
  sessionPromise = undefined

  const modelToDispose = loadedModel
  loadedModel = undefined

  if (modelToDispose) {
    logger.info(`Disposing model: ${modelToDispose.filename}`)
    await modelToDispose.dispose()
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

async function loadModel(llama: Llama) {
  const modelPath = getSelectedModelPath()

  if (modelPath === null) {
    logger.warn('Prompt attempted with no model selected')
    throw new Error('No model selected. Please select a model in settings.')
  }

  logger.info(`Loading model: ${modelPath}`)

  try {
    const model = await llama.loadModel({ modelPath })

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
    logger.error(`Failed to load model: ${modelPath}`, error)
    throw new Error(
      'Failed to load the selected model. Make sure the model file exists and is a valid model.',
    )
  }
}

async function createContext(model: LlamaModel) {
  try {
    return await model.createContext()
  } catch (error) {
    logger.error('Failed to create model context', error)
    throw new Error(
      'Failed to create a model context. The model may require more memory than is available.',
    )
  }
}

async function createSession() {
  const llama = await initLlama()
  const model = await loadModel(llama)
  loadedModel = model
  const context = await createContext(model)

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
}

function sendStreamEvent(webContents: WebContents, event: LlamaStreamEvent) {
  if (webContents.isDestroyed()) {
    return
  }

  webContents.send(IpcChannels.llamaStreamResponse, event)
}

function formatResponseChunk(chunk: LlamaChatResponseChunk) {
  let text = ''

  if (chunk.type === 'segment' && chunk.segmentStartTime != null) {
    text += ` [segment start: ${chunk.segmentType}] `
  }

  text += chunk.text

  if (chunk.type === 'segment' && chunk.segmentEndTime != null) {
    text += ` [segment end: ${chunk.segmentType}] `
  }

  return text
}

async function streamPrompt(
  sender: WebContents,
  prompt: string,
  abortController: AbortController,
) {
  logger.info(`Prompt received (${prompt.length} chars), generating response`)

  try {
    const responseChunks: string[] = []
    const session = await getSession()
    const response = await session.promptWithMeta(prompt, {
      signal: abortController.signal,
      stopOnAbortSignal: true,
      onResponseChunk(chunk) {
        const text = formatResponseChunk(chunk)

        responseChunks.push(text)
        sendStreamEvent(sender, {
          type: 'chunk',
          text,
        })
      },
    })

    const responseText = responseChunks.join('') || response.responseText
    logger.info(
      `Response complete (${responseText.length} chars, stopReason: ${response.stopReason})`,
    )

    sendStreamEvent(sender, {
      type: 'done',
      response: responseText,
      stopped: response.stopReason === 'abort',
    })
  } catch (error) {
    // Aborting before generation starts streaming rejects instead of
    // resolving with a partial response, so treat it as a normal stop.
    if (abortController.signal.aborted) {
      logger.info('Generation aborted')
      sendStreamEvent(sender, {
        type: 'done',
        response: '',
        stopped: true,
      })
    } else {
      logger.error('Generation failed', error)
      sendStreamEvent(sender, {
        type: 'error',
        message: getErrorMessage(error),
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
    async (event, prompt: unknown) => {
      if (typeof prompt !== 'string' || prompt.trim().length === 0) {
        logger.warn('Rejected prompt: not a non-empty string')
        throw new Error('Prompt must be a non-empty string.')
      }

      if (isGenerating) {
        logger.warn('Rejected prompt: a response is already streaming')
        throw new Error('A response is already streaming.')
      }

      isGenerating = true
      const abortController = new AbortController()
      activeAbortController = abortController
      activeGeneration = streamPrompt(event.sender, prompt, abortController)

      try {
        await activeGeneration
      } finally {
        activeGeneration = undefined
      }
    },
  )

  ipcMain.handle(IpcChannels.llamaStopGeneration, () => {
    logger.info('Stop generation requested')
    activeAbortController?.abort()
  })

  // Warms the session up front so the first prompt isn't delayed by loading.
  ipcMain.handle(IpcChannels.llamaLoadModel, async () => {
    logger.info('Model load requested')
    await getSession()
  })

  // Unloading mid-stream aborts the generation first and waits for it to unwind
  // so the model isn't disposed while native code is still using it.
  ipcMain.handle(IpcChannels.llamaUnloadModel, async () => {
    logger.info('Model unload requested')
    activeAbortController?.abort()
    await activeGeneration
    await resetLlamaSession()
  })
}
