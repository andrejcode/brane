import type { LlamaStreamEvent, Theme } from '@shared/types'

declare global {
  interface ElectronApi {
    isMac: boolean
    getIsFullScreen: () => Promise<boolean>
    onFullScreenChange: (
      callback: (isFullScreen: boolean) => void,
    ) => () => void
    sendPrompt: (prompt: string) => Promise<void>
    stopGeneration: () => Promise<void>
    streamResponse: (callback: (event: LlamaStreamEvent) => void) => () => void
    getTheme: () => Promise<Theme>
    setTheme: (theme: Theme) => Promise<void>
    listModels: () => Promise<string[]>
    getSelectedModel: () => Promise<string | null>
    setSelectedModel: (model: string) => Promise<string | null>
  }

  interface Window {
    electronApi: ElectronApi
  }
}

export {}
