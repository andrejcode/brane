import type { LlamaStreamEvent, ModelState, Theme } from '@shared/types'

declare global {
  interface ElectronApi {
    isMac: boolean
    getIsFullScreen: () => Promise<boolean>
    onFullScreenChange: (
      callback: (isFullScreen: boolean) => void,
    ) => () => void
    sendPrompt: (prompt: string) => Promise<void>
    stopGeneration: () => Promise<void>
    loadModel: (model: string) => Promise<void>
    unloadModel: () => Promise<void>
    streamResponse: (callback: (event: LlamaStreamEvent) => void) => () => void
    notifyAppReady: () => void
    getTheme: () => Promise<Theme>
    setTheme: (theme: Theme) => Promise<void>
    getModelState: () => Promise<ModelState>
    setSelectedModel: (model: string | null) => Promise<string | null>
    getSendWithModifierEnter: () => Promise<boolean>
    setSendWithModifierEnter: (enabled: boolean) => Promise<boolean>
    openLogs: () => Promise<void>
    deleteLogs: () => Promise<void>
  }

  interface Window {
    electronApi: ElectronApi
  }
}

export {}
