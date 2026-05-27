import type { LlamaStreamEvent } from '@shared/types'

declare global {
  interface ElectronApi {
    sendPrompt: (prompt: string) => Promise<void>
    streamResponse: (callback: (event: LlamaStreamEvent) => void) => () => void
  }

  interface Window {
    electronApi: ElectronApi
  }
}

export {}
