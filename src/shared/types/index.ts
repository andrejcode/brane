export const IpcChannels = {
  llamaSendPrompt: 'llama:send-prompt',
  llamaStopGeneration: 'llama:stop-generation',
  llamaStreamResponse: 'llama:stream-response',

  windowFullscreenChanged: 'window:fullscreen-changed',
  windowIsFullScreen: 'window:is-full-screen',

  getTheme: 'theme:get',
  setTheme: 'theme:set',

  listModels: 'model:list',
  getSelectedModel: 'model:get-selected',
  setSelectedModel: 'model:set-selected',
} as const

export type Theme = 'light' | 'dark' | 'system'

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
