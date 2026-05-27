import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IpcChannels, type LlamaStreamEvent } from '@shared/types'

const electronApi: ElectronApi = {
  sendPrompt: async (prompt) => {
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
}

contextBridge.exposeInMainWorld('electronApi', electronApi)
