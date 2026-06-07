import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IpcChannels, type LlamaStreamEvent, type Theme } from '@shared/types'

const electronApi: ElectronApi = {
  isMac: process.platform === 'darwin',
  getIsFullScreen: async () => {
    const isFullScreen: unknown = await ipcRenderer.invoke(
      IpcChannels.windowIsFullScreen,
    )

    return isFullScreen === true
  },
  onFullScreenChange: (callback: (isFullScreen: boolean) => void) => {
    const listener = (_event: IpcRendererEvent, isFullScreen: boolean) => {
      callback(isFullScreen)
    }

    ipcRenderer.on(IpcChannels.windowFullscreenChanged, listener)

    return () => {
      ipcRenderer.removeListener(IpcChannels.windowFullscreenChanged, listener)
    }
  },
  sendPrompt: async (prompt: string) => {
    await ipcRenderer.invoke(IpcChannels.llamaSendPrompt, prompt)
  },
  streamResponse: (callback: (event: LlamaStreamEvent) => void) => {
    const listener = (
      _event: IpcRendererEvent,
      streamEvent: LlamaStreamEvent,
    ) => {
      callback(streamEvent)
    }

    ipcRenderer.on(IpcChannels.llamaStreamResponse, listener)

    return () => {
      ipcRenderer.removeListener(IpcChannels.llamaStreamResponse, listener)
    }
  },
  getTheme: async () => {
    const theme: unknown = await ipcRenderer.invoke(IpcChannels.getTheme)
    return theme as Theme
  },
  setTheme: async (theme: Theme) => {
    await ipcRenderer.invoke(IpcChannels.setTheme, theme)
  },
}

contextBridge.exposeInMainWorld('electronApi', electronApi)
