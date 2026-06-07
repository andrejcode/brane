export const IpcChannels = {
  llamaSendPrompt: 'llama:send-prompt',
  llamaStreamResponse: 'llama:stream-response',

  windowFullscreenChanged: 'window:fullscreen-changed',
  windowIsFullScreen: 'window:is-full-screen',

  getTheme: 'theme:get',
  setTheme: 'theme:set',
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
    }
  | {
      type: 'error'
      message: string
    }
