import type { LlamaStreamEvent, Theme } from '@shared/types'

declare global {
  interface ElectronApi {
    isMac: boolean
    getIsFullScreen: () => Promise<boolean>
    onFullScreenChange: (
      callback: (isFullScreen: boolean) => void,
    ) => () => void
    sendPrompt: (prompt: string) => Promise<void>
    streamResponse: (callback: (event: LlamaStreamEvent) => void) => () => void
    getTheme: () => Promise<Theme>
    setTheme: (theme: Theme) => Promise<void>
  }

  interface Window {
    electronApi: ElectronApi
  }
}

export {}
