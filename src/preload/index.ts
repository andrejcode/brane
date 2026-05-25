import { contextBridge, ipcRenderer } from 'electron'

const electronApi: ElectronApi = {
  ping: () => ipcRenderer.invoke('ping'),
}

contextBridge.exposeInMainWorld('electronApi', electronApi)
