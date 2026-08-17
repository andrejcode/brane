import { vi } from 'vitest'
import {
  type ChatSummary,
  DEFAULT_SHORTCUTS,
  type Locale,
  type LlamaStreamEvent,
  type ModelState,
  type ShortcutMap,
  type StoredMessage,
  type Theme,
} from '@shared/types'

export interface MockElectronApi {
  electronApi: ElectronApi
  sendPrompt: ReturnType<typeof vi.fn>
  stopGeneration: ReturnType<typeof vi.fn>
  loadModel: ReturnType<typeof vi.fn>
  unloadModel: ReturnType<typeof vi.fn>
  listChats: ReturnType<typeof vi.fn>
  createChat: ReturnType<typeof vi.fn>
  getChatMessages: ReturnType<typeof vi.fn>
  deleteChat: ReturnType<typeof vi.fn>
  getIsFullScreen: ReturnType<typeof vi.fn>
  streamResponse: ReturnType<typeof vi.fn>
  onFullScreenChange: ReturnType<typeof vi.fn>
  notifyAppReady: ReturnType<typeof vi.fn>
  getTheme: ReturnType<typeof vi.fn>
  setTheme: ReturnType<typeof vi.fn>
  getLocale: ReturnType<typeof vi.fn>
  setLocale: ReturnType<typeof vi.fn>
  getModelState: ReturnType<typeof vi.fn>
  setSelectedModel: ReturnType<typeof vi.fn>
  getSendWithModifierEnter: ReturnType<typeof vi.fn>
  setSendWithModifierEnter: ReturnType<typeof vi.fn>
  getShortcuts: ReturnType<typeof vi.fn>
  setShortcuts: ReturnType<typeof vi.fn>
  openLogs: ReturnType<typeof vi.fn>
  deleteLogs: ReturnType<typeof vi.fn>
  onModelStateChange: ReturnType<typeof vi.fn>
  streamUnsubscribe: ReturnType<typeof vi.fn>
  fullScreenUnsubscribe: ReturnType<typeof vi.fn>
  modelStateUnsubscribe: ReturnType<typeof vi.fn>
  emitStream: (event: LlamaStreamEvent) => void
  emitFullScreenChange: (isFullScreen: boolean) => void
  emitModelStateChange: (state: ModelState) => void
}

export interface MockElectronApiOptions {
  isMac?: boolean
  isFullScreen?: boolean
  theme?: Theme
  locale?: Locale
  models?: string[]
  selectedModel?: string | null
  sendWithModifierEnter?: boolean
  shortcuts?: ShortcutMap
  chats?: ChatSummary[]
  chatMessages?: StoredMessage[]
}

// Installs a fake `window.electronApi` so renderer components that talk to the
// preload bridge can be tested without a real Electron runtime. The returned
// `emit*` helpers let tests drive the IPC callbacks the components subscribe to.
export function installMockElectronApi(
  options: MockElectronApiOptions = {},
): MockElectronApi {
  const {
    isMac = false,
    isFullScreen = false,
    theme = 'system',
    locale = 'en',
    models = [],
    selectedModel = null,
    sendWithModifierEnter = false,
    shortcuts = DEFAULT_SHORTCUTS,
    chats = [],
    chatMessages = [],
  } = options

  const streamListeners = new Set<(event: LlamaStreamEvent) => void>()
  const fullScreenListeners = new Set<(isFullScreen: boolean) => void>()
  const modelStateListeners = new Set<(state: ModelState) => void>()

  const streamUnsubscribe = vi.fn()
  const fullScreenUnsubscribe = vi.fn()
  const modelStateUnsubscribe = vi.fn()

  const sendPrompt = vi.fn((): Promise<void> => Promise.resolve())
  const stopGeneration = vi.fn((): Promise<void> => Promise.resolve())
  const loadModel = vi.fn((): Promise<void> => Promise.resolve())
  const unloadModel = vi.fn((): Promise<void> => Promise.resolve())
  const getIsFullScreen = vi.fn(
    (): Promise<boolean> => Promise.resolve(isFullScreen),
  )
  const notifyAppReady = vi.fn()
  const getTheme = vi.fn((): Promise<Theme> => Promise.resolve(theme))
  const setTheme = vi.fn((): Promise<void> => Promise.resolve())
  const getLocale = vi.fn((): Promise<Locale> => Promise.resolve(locale))
  const setLocale = vi.fn(
    (next: Locale): Promise<Locale> => Promise.resolve(next),
  )
  const getModelState = vi.fn(() => Promise.resolve({ models, selectedModel }))
  const setSelectedModel = vi.fn(
    (model: string | null): Promise<string | null> => Promise.resolve(model),
  )
  const getSendWithModifierEnter = vi.fn(
    (): Promise<boolean> => Promise.resolve(sendWithModifierEnter),
  )
  const setSendWithModifierEnter = vi.fn(
    (enabled: boolean): Promise<boolean> => Promise.resolve(enabled),
  )
  const getShortcuts = vi.fn(
    (): Promise<ShortcutMap> => Promise.resolve(shortcuts),
  )
  const setShortcuts = vi.fn(
    (next: ShortcutMap): Promise<ShortcutMap> => Promise.resolve(next),
  )
  const openLogs = vi.fn((): Promise<void> => Promise.resolve())
  const deleteLogs = vi.fn((): Promise<void> => Promise.resolve())
  const listChats = vi.fn((): Promise<ChatSummary[]> => Promise.resolve(chats))
  const createChat = vi.fn(
    (chatId: string): Promise<ChatSummary> =>
      Promise.resolve({
        id: chatId,
        title: null,
        modelFile: selectedModel ?? 'test-model.gguf',
        modelAvailability: 'available',
        updatedAt: 0,
      }),
  )
  const getChatMessages = vi.fn(
    (): Promise<StoredMessage[]> => Promise.resolve(chatMessages),
  )
  const deleteChat = vi.fn((): Promise<void> => Promise.resolve())

  const streamResponse = vi.fn(
    (callback: (event: LlamaStreamEvent) => void): (() => void) => {
      streamListeners.add(callback)

      return () => {
        streamListeners.delete(callback)
        streamUnsubscribe()
      }
    },
  )

  const onFullScreenChange = vi.fn(
    (callback: (value: boolean) => void): (() => void) => {
      fullScreenListeners.add(callback)

      return () => {
        fullScreenListeners.delete(callback)
        fullScreenUnsubscribe()
      }
    },
  )

  const onModelStateChange = vi.fn(
    (callback: (state: ModelState) => void): (() => void) => {
      modelStateListeners.add(callback)

      return () => {
        modelStateListeners.delete(callback)
        modelStateUnsubscribe()
      }
    },
  )

  const electronApi: ElectronApi = {
    isMac,
    getIsFullScreen,
    onFullScreenChange,
    sendPrompt,
    stopGeneration,
    loadModel,
    unloadModel,
    streamResponse,
    notifyAppReady,
    getTheme,
    setTheme,
    getLocale,
    setLocale,
    getModelState,
    onModelStateChange,
    setSelectedModel,
    listChats,
    createChat,
    getChatMessages,
    deleteChat,
    getSendWithModifierEnter,
    setSendWithModifierEnter,
    getShortcuts,
    setShortcuts,
    openLogs,
    deleteLogs,
  }

  window.electronApi = electronApi

  return {
    electronApi,
    sendPrompt,
    stopGeneration,
    loadModel,
    unloadModel,
    getIsFullScreen,
    streamResponse,
    onFullScreenChange,
    notifyAppReady,
    getTheme,
    setTheme,
    getLocale,
    setLocale,
    getModelState,
    setSelectedModel,
    listChats,
    createChat,
    getChatMessages,
    deleteChat,
    getSendWithModifierEnter,
    setSendWithModifierEnter,
    getShortcuts,
    setShortcuts,
    openLogs,
    deleteLogs,
    onModelStateChange,
    streamUnsubscribe,
    fullScreenUnsubscribe,
    modelStateUnsubscribe,
    emitStream: (event) => {
      for (const listener of streamListeners) {
        listener(event)
      }
    },
    emitFullScreenChange: (value) => {
      for (const listener of fullScreenListeners) {
        listener(value)
      }
    },
    emitModelStateChange: (state) => {
      for (const listener of modelStateListeners) {
        listener(state)
      }
    },
  }
}

export function clearMockElectronApi() {
  Reflect.deleteProperty(window, 'electronApi')
}
