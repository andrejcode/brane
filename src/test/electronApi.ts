import { vi } from 'vitest'
import type { LlamaStreamEvent } from '@shared/types'

export interface MockElectronApi {
  electronApi: ElectronApi
  sendPrompt: ReturnType<typeof vi.fn>
  getIsFullScreen: ReturnType<typeof vi.fn>
  streamResponse: ReturnType<typeof vi.fn>
  onFullScreenChange: ReturnType<typeof vi.fn>
  streamUnsubscribe: ReturnType<typeof vi.fn>
  fullScreenUnsubscribe: ReturnType<typeof vi.fn>
  emitStream: (event: LlamaStreamEvent) => void
  emitFullScreenChange: (isFullScreen: boolean) => void
}

export interface MockElectronApiOptions {
  isMac?: boolean
  isFullScreen?: boolean
}

// Installs a fake `window.electronApi` so renderer components that talk to the
// preload bridge can be tested without a real Electron runtime. The returned
// `emit*` helpers let tests drive the IPC callbacks the components subscribe to.
export function installMockElectronApi(
  options: MockElectronApiOptions = {},
): MockElectronApi {
  const { isMac = false, isFullScreen = false } = options

  const streamListeners = new Set<(event: LlamaStreamEvent) => void>()
  const fullScreenListeners = new Set<(isFullScreen: boolean) => void>()

  const streamUnsubscribe = vi.fn()
  const fullScreenUnsubscribe = vi.fn()

  const sendPrompt = vi.fn((): Promise<void> => Promise.resolve())
  const getIsFullScreen = vi.fn(
    (): Promise<boolean> => Promise.resolve(isFullScreen),
  )

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

  const electronApi: ElectronApi = {
    isMac,
    getIsFullScreen,
    onFullScreenChange,
    sendPrompt,
    streamResponse,
  }

  window.electronApi = electronApi

  return {
    electronApi,
    sendPrompt,
    getIsFullScreen,
    streamResponse,
    onFullScreenChange,
    streamUnsubscribe,
    fullScreenUnsubscribe,
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
  }
}

export function clearMockElectronApi() {
  Reflect.deleteProperty(window, 'electronApi')
}
