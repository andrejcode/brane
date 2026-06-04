export const IpcChannels = {
  llamaSendPrompt: 'llama:send-prompt',
  llamaStreamResponse: 'llama:stream-response',
  windowFullscreenChanged: 'window:fullscreen-changed',
  windowIsFullScreen: 'window:is-full-screen',
} as const

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
