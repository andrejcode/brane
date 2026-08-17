import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import {
  type ChatSummary,
  IpcChannels,
  type LlamaStreamEvent,
  type Locale,
  type ModelState,
  normalizeShortcuts,
  type ShortcutMap,
  type StoredMessage,
  type Theme,
} from '@shared/types'

function normalizeModelState(value: unknown): ModelState {
  if (value && typeof value === 'object' && 'models' in value) {
    const { models, selectedModel } = value as ModelState

    return {
      models: Array.isArray(models) ? models : [],
      selectedModel: typeof selectedModel === 'string' ? selectedModel : null,
    }
  }

  return { models: [], selectedModel: null }
}

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
  sendPrompt: async (prompt: string, chatId: string) => {
    await ipcRenderer.invoke(IpcChannels.llamaSendPrompt, prompt, chatId)
  },
  stopGeneration: async () => {
    await ipcRenderer.invoke(IpcChannels.llamaStopGeneration)
  },
  loadModel: async (model: string) => {
    await ipcRenderer.invoke(IpcChannels.llamaLoadModel, model)
  },
  unloadModel: async () => {
    await ipcRenderer.invoke(IpcChannels.llamaUnloadModel)
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
  notifyAppReady: () => {
    ipcRenderer.send(IpcChannels.appReady)
  },
  getTheme: async () => {
    const theme: unknown = await ipcRenderer.invoke(IpcChannels.getTheme)
    return theme as Theme
  },
  setTheme: async (theme: Theme) => {
    await ipcRenderer.invoke(IpcChannels.setTheme, theme)
  },
  getLocale: async () => {
    const locale: unknown = await ipcRenderer.invoke(IpcChannels.getLocale)
    return locale as Locale
  },
  setLocale: async (locale: Locale) => {
    const saved: unknown = await ipcRenderer.invoke(
      IpcChannels.setLocale,
      locale,
    )
    return saved as Locale
  },
  getModelState: async () => {
    const state: unknown = await ipcRenderer.invoke(IpcChannels.getModelState)

    return normalizeModelState(state)
  },
  onModelStateChange: (callback: (state: ModelState) => void) => {
    const listener = (_event: IpcRendererEvent, state: unknown) => {
      callback(normalizeModelState(state))
    }

    ipcRenderer.on(IpcChannels.modelStateChanged, listener)

    return () => {
      ipcRenderer.removeListener(IpcChannels.modelStateChanged, listener)
    }
  },
  setSelectedModel: async (model: string | null) => {
    const saved: unknown = await ipcRenderer.invoke(
      IpcChannels.setSelectedModel,
      model,
    )
    return typeof saved === 'string' ? saved : null
  },
  listChats: async () => {
    const chats: unknown = await ipcRenderer.invoke(IpcChannels.listChats)
    return Array.isArray(chats) ? (chats as ChatSummary[]) : []
  },
  createChat: async (chatId: string) => {
    const chat: unknown = await ipcRenderer.invoke(
      IpcChannels.createChat,
      chatId,
    )
    return chat as ChatSummary
  },
  getChatMessages: async (chatId: string) => {
    const messages: unknown = await ipcRenderer.invoke(
      IpcChannels.getChatMessages,
      chatId,
    )
    return Array.isArray(messages) ? (messages as StoredMessage[]) : []
  },
  deleteChat: async (chatId: string) => {
    await ipcRenderer.invoke(IpcChannels.deleteChat, chatId)
  },
  getSendWithModifierEnter: async () => {
    const enabled: unknown = await ipcRenderer.invoke(
      IpcChannels.getSendWithModifierEnter,
    )
    return enabled === true
  },
  setSendWithModifierEnter: async (enabled: boolean) => {
    const saved: unknown = await ipcRenderer.invoke(
      IpcChannels.setSendWithModifierEnter,
      enabled,
    )
    return saved === true
  },
  getShortcuts: async () => {
    const shortcuts: unknown = await ipcRenderer.invoke(
      IpcChannels.getShortcuts,
    )
    return normalizeShortcuts(shortcuts)
  },
  setShortcuts: async (shortcuts: ShortcutMap) => {
    const saved: unknown = await ipcRenderer.invoke(
      IpcChannels.setShortcuts,
      shortcuts,
    )
    return normalizeShortcuts(saved)
  },
  openLogs: async () => {
    await ipcRenderer.invoke(IpcChannels.openLogs)
  },
  deleteLogs: async () => {
    await ipcRenderer.invoke(IpcChannels.deleteLogs)
  },
}

contextBridge.exposeInMainWorld('electronApi', electronApi)
