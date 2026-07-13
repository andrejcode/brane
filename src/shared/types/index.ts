export const IpcChannels = {
  llamaSendPrompt: 'llama:send-prompt',
  llamaStopGeneration: 'llama:stop-generation',
  llamaStreamResponse: 'llama:stream-response',
  llamaLoadModel: 'llama:load-model',
  llamaUnloadModel: 'llama:unload-model',

  windowFullscreenChanged: 'window:fullscreen-changed',
  windowIsFullScreen: 'window:is-full-screen',

  appReady: 'app:ready',

  getTheme: 'theme:get',
  setTheme: 'theme:set',

  getLocale: 'locale:get',
  setLocale: 'locale:set',

  getModelState: 'model:get-state',
  setSelectedModel: 'model:set-selected',

  getSendWithModifierEnter: 'chat-settings:get-send-with-modifier-enter',
  setSendWithModifierEnter: 'chat-settings:set-send-with-modifier-enter',

  openLogs: 'logs:open',
  deleteLogs: 'logs:delete',
} as const

export type Theme = 'light' | 'dark' | 'system'

export const LOCALES = ['en', 'de', 'hr', 'sr'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

// The available models and the persisted selection (validated against disk),
// fetched together in a single round-trip.
export interface ModelState {
  models: string[]
  selectedModel: string | null
}

// Models emit their output in segments. A `thought` segment is the model's
// reasoning; its absence means the chunk is part of the user-facing answer.
// `comment` segments are dropped in the main process and never reach here.
export type LlamaResponseSegment = 'thought'

export type LlamaStreamEvent =
  | {
      type: 'chunk'
      text: string
      segment?: LlamaResponseSegment
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
