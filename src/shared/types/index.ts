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

  listChats: 'chats:list',
  createChat: 'chats:create',
  getChatMessages: 'chats:get-messages',
  deleteChat: 'chats:delete',

  getSendWithModifierEnter: 'chat-settings:get-send-with-modifier-enter',
  setSendWithModifierEnter: 'chat-settings:set-send-with-modifier-enter',

  getShortcuts: 'shortcuts:get',
  setShortcuts: 'shortcuts:set',

  openLogs: 'logs:open',
  deleteLogs: 'logs:delete',
} as const

export type Theme = 'light' | 'dark' | 'system'

export const LOCALES = ['en', 'de', 'hr', 'sr'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const SHORTCUT_ACTIONS = [
  'toggleSettings',
  'toggleModels',
  'toggleSidebar',
] as const

export type ShortcutAction = (typeof SHORTCUT_ACTIONS)[number]

// A key combination. `mod` is the platform's primary modifier (Cmd on macOS,
// Ctrl on Windows/Linux) so a single stored binding works on every platform.
export interface ShortcutBinding {
  key: string
  mod: boolean
  shift: boolean
  alt: boolean
}

export type ShortcutMap = Record<ShortcutAction, ShortcutBinding>

export const DEFAULT_SHORTCUTS: ShortcutMap = {
  toggleSettings: { key: ',', mod: true, shift: false, alt: false },
  toggleModels: { key: 'm', mod: true, shift: true, alt: false },
  toggleSidebar: { key: 'b', mod: true, shift: false, alt: false },
}

function isValidBinding(value: unknown): value is ShortcutBinding {
  if (!value || typeof value !== 'object') {
    return false
  }

  const binding = value as Record<string, unknown>
  return (
    typeof binding['key'] === 'string' &&
    binding['key'].length > 0 &&
    typeof binding['mod'] === 'boolean' &&
    typeof binding['shift'] === 'boolean' &&
    typeof binding['alt'] === 'boolean'
  )
}

export function normalizeShortcuts(value: unknown): ShortcutMap {
  const source =
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

  const result = {} as ShortcutMap
  for (const action of SHORTCUT_ACTIONS) {
    const candidate = source[action]
    result[action] = isValidBinding(candidate)
      ? {
          key: candidate.key.toLowerCase(),
          mod: candidate.mod,
          shift: candidate.shift,
          alt: candidate.alt,
        }
      : { ...DEFAULT_SHORTCUTS[action] }
  }

  return result
}

// The available models and the persisted selection (validated against disk),
// fetched together in a single round-trip.
export interface ModelState {
  models: string[]
  selectedModel: string | null
}

// Whether a chat's model file can still back a new turn. `replaced` means a file
// with that name exists but no longer matches what the chat was created with.
export type ModelAvailability = 'available' | 'missing' | 'replaced'

export const MESSAGE_ROLES = ['user', 'assistant'] as const

export type MessageRole = (typeof MESSAGE_ROLES)[number]

// `stopped` and `error` mean the stored assistant content is partial.
export const FINISH_REASONS = ['done', 'stopped', 'error'] as const

export type FinishReason = (typeof FINISH_REASONS)[number]

// A row for the chat list. `title` stays null until a chat is named. Timestamps
// cross as epoch milliseconds rather than `Date`.
export interface ChatSummary {
  id: string
  title: string | null
  modelFile: string
  modelAvailability: ModelAvailability
  updatedAt: number
}

export interface StoredMessage {
  id: string
  role: MessageRole
  content: string
  reasoning: string | null
  finishReason: FinishReason | null
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
