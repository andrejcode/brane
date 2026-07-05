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

// Tears down the active session so the next prompt loads a fresh one. Used when
// the selected model changes; the previous model is disposed to free its memory.
export function resetLlamaSession() {
  sessionPromise = undefined

  const modelToDispose = loadedModel
  loadedModel = undefined

  if (modelToDispose) {
    void modelToDispose.dispose()
  }
}

async function initLlama() {
  try {
    return await getLlama()
  } catch {
    throw new Error('Failed to initialize the llama runtime. Please try again.')
  }
}

async function loadModel(llama: Llama) {
  const modelPath = getSelectedModelPath()

  if (modelPath === null) {
    throw new Error('No model selected. Please select a model in settings.')
  }

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
  } catch {
    throw new Error(
      'Failed to load the selected model. Make sure the model file exists and is a valid model.',
    )
  }
}

async function createContext(model: LlamaModel) {
  try {
    return await model.createContext()
  } catch {
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
    return new LlamaChatSession({
      contextSequence: context.getSequence(),
    })
  } catch {
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

    sendStreamEvent(sender, {
      type: 'done',
      response: responseChunks.join('') || response.responseText,
      stopped: response.stopReason === 'abort',
    })
  } catch (error) {
    // Aborting before generation starts streaming rejects instead of
    // resolving with a partial response, so treat it as a normal stop.
    if (abortController.signal.aborted) {
      sendStreamEvent(sender, {
        type: 'done',
        response: '',
        stopped: true,
      })
    } else {
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
        throw new Error('Prompt must be a non-empty string.')
      }

      if (isGenerating) {
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
    activeAbortController?.abort()
  })

  // Warms the session up front so the first prompt isn't delayed by loading.
  ipcMain.handle(IpcChannels.llamaLoadModel, async () => {
    await getSession()
  })

  // Unloading mid-stream aborts the generation first and waits for it to unwind
  // so the model isn't disposed while native code is still using it.
  ipcMain.handle(IpcChannels.llamaUnloadModel, async () => {
    activeAbortController?.abort()
    await activeGeneration
    resetLlamaSession()
  })
}
