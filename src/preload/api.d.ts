import type {
  ChatSummary,
  LlamaStreamEvent,
  Locale,
  ModelState,
  ShortcutMap,
  StoredMessage,
  Theme,
} from '@shared/types'

declare global {
  interface ElectronApi {
    isMac: boolean
    getIsFullScreen: () => Promise<boolean>
    onFullScreenChange: (
      callback: (isFullScreen: boolean) => void,
    ) => () => void
    sendPrompt: (prompt: string, chatId: string) => Promise<void>
    stopGeneration: () => Promise<void>
    loadModel: (model: string) => Promise<void>
    unloadModel: () => Promise<void>
    streamResponse: (callback: (event: LlamaStreamEvent) => void) => () => void
    notifyAppReady: () => void
    getTheme: () => Promise<Theme>
    setTheme: (theme: Theme) => Promise<void>
    getLocale: () => Promise<Locale>
    setLocale: (locale: Locale) => Promise<Locale>
    getModelState: () => Promise<ModelState>
    setSelectedModel: (model: string | null) => Promise<string | null>
    listChats: () => Promise<ChatSummary[]>
    createChat: (chatId: string) => Promise<ChatSummary>
    getChatMessages: (chatId: string) => Promise<StoredMessage[]>
    deleteChat: (chatId: string) => Promise<void>
    getSendWithModifierEnter: () => Promise<boolean>
    setSendWithModifierEnter: (enabled: boolean) => Promise<boolean>
    getShortcuts: () => Promise<ShortcutMap>
    setShortcuts: (shortcuts: ShortcutMap) => Promise<ShortcutMap>
    openLogs: () => Promise<void>
    deleteLogs: () => Promise<void>
  }

  interface Window {
    electronApi: ElectronApi
  }
}

export {}
