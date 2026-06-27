export const IpcChannels = {
  llamaSendPrompt: 'llama:send-prompt',
  llamaStopGeneration: 'llama:stop-generation',
  llamaStreamResponse: 'llama:stream-response',

  windowFullscreenChanged: 'window:fullscreen-changed',
  windowIsFullScreen: 'window:is-full-screen',

  appReady: 'app:ready',

  getTheme: 'theme:get',
  setTheme: 'theme:set',

  getModelState: 'model:get-state',
  setSelectedModel: 'model:set-selected',
} as const

export type Theme = 'light' | 'dark' | 'system'

// The available models and the persisted selection (validated against disk),
// fetched together in a single round-trip.
export interface ModelState {
  models: string[]
  selectedModel: string | null
}

export type LlamaStreamEvent =
  | {
      type: 'chunk'
      text: string
    }
  | {
      type: 'done'
      response: string
      stopped?: boolean
    }
  | {
      type: 'error'
      message: string
    }
