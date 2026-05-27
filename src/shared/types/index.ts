export const IpcChannels = {
  llamaSendPrompt: 'llama:send-prompt',
  llamaStreamResponse: 'llama:stream-response',
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
