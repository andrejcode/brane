import { ipcMain, type WebContents } from 'electron'
import {
  getLlama,
  LlamaChatSession,
  type LlamaChatResponseChunk,
  type LlamaModel,
} from 'node-llama-cpp'
import { IpcChannels, type LlamaStreamEvent } from '@shared/types'
import { getSelectedModelPath } from '../model'

let sessionPromise: Promise<LlamaChatSession> | undefined
let loadedModel: LlamaModel | undefined
let isGenerating = false
let activeAbortController: AbortController | undefined

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

async function createSession() {
  const modelPath = getSelectedModelPath()

  if (modelPath === null) {
    throw new Error('No model selected')
  }

  const llama = await getLlama()
  const model = await llama.loadModel({ modelPath })
  loadedModel = model
  const context = await model.createContext()
  const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
  })

  return session
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'An unknown error occurred'
}

export function registerLlamaHandlers() {
  ipcMain.handle(
    IpcChannels.llamaSendPrompt,
    async (event, prompt: unknown) => {
      if (typeof prompt !== 'string' || prompt.trim().length === 0) {
        throw new Error('Prompt must be a non-empty string')
      }

      if (isGenerating) {
        throw new Error('A response is already streaming')
      }

      isGenerating = true
      const abortController = new AbortController()
      activeAbortController = abortController

      try {
        const responseChunks: string[] = []
        const session = await getSession()
        const response = await session.promptWithMeta(prompt, {
          signal: abortController.signal,
          stopOnAbortSignal: true,
          onResponseChunk(chunk) {
            const text = formatResponseChunk(chunk)

            responseChunks.push(text)
            sendStreamEvent(event.sender, {
              type: 'chunk',
              text,
            })
          },
        })

        sendStreamEvent(event.sender, {
          type: 'done',
          response: responseChunks.join('') || response.responseText,
          stopped: response.stopReason === 'abort',
        })
      } catch (error) {
        // Aborting before generation starts streaming rejects instead of
        // resolving with a partial response, so treat it as a normal stop.
        if (abortController.signal.aborted) {
          sendStreamEvent(event.sender, {
            type: 'done',
            response: '',
            stopped: true,
          })
        } else {
          sendStreamEvent(event.sender, {
            type: 'error',
            message: getErrorMessage(error),
          })
        }
      } finally {
        activeAbortController = undefined
        isGenerating = false
      }
    },
  )

  ipcMain.handle(IpcChannels.llamaStopGeneration, () => {
    activeAbortController?.abort()
  })
}
