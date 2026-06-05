import { ipcMain, type WebContents } from 'electron'
import path from 'node:path'
import {
  getLlama,
  LlamaChatSession,
  type LlamaChatResponseChunk,
} from 'node-llama-cpp'
import { IpcChannels, type LlamaStreamEvent } from '@shared/types'

let sessionPromise: Promise<LlamaChatSession> | undefined
let isGenerating = false

function getSession() {
  sessionPromise ??= createSession()

  return sessionPromise
}

async function createSession() {
  const llama = await getLlama()
  const model = await llama.loadModel({
    // Available models:
    // Qwen3-4B-Q5_K_M.gguf
    // Qwen3-0.6B-Q8_0.gguf
    modelPath: path.join(process.cwd(), 'models', 'Qwen3-4B-Q5_K_M.gguf'),
  })
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

      try {
        const responseChunks: string[] = []
        const session = await getSession()
        const response = await session.promptWithMeta(prompt, {
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
        })
      } catch (error) {
        sendStreamEvent(event.sender, {
          type: 'error',
          message: getErrorMessage(error),
        })
      } finally {
        isGenerating = false
      }
    },
  )
}
