import { ipcMain } from 'electron'
import {
  IpcChannels,
  type ChatSummary,
  type StoredMessage,
} from '@shared/types'
import { createChat, deleteChat, listChats, listMessages } from './db/chats'
import { logger } from './logger'
import {
  getModelAvailability,
  getModelFileSize,
  getSelectedModel,
} from './model'

function requireChatId(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    logger.warn('Rejected chat request: missing chat id')
    throw new Error('Chat not found.')
  }

  return value
}

function toChatSummaries(): ChatSummary[] {
  return listChats().map((chat) => ({
    id: chat.id,
    title: chat.title,
    modelFile: chat.modelFile,
    modelAvailability: getModelAvailability(
      chat.modelFile,
      chat.modelSizeBytes,
    ),
    updatedAt: chat.updatedAt.getTime(),
  }))
}

function toStoredMessages(chatId: string): StoredMessage[] {
  return listMessages(chatId).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    reasoning: message.reasoning,
    finishReason: message.finishReason,
  }))
}

export function registerChatsHandlers() {
  ipcMain.handle(IpcChannels.listChats, () => toChatSummaries())

  ipcMain.handle(IpcChannels.getChatMessages, (_event, chatId: unknown) =>
    toStoredMessages(requireChatId(chatId)),
  )

  // The renderer supplies the id so it can keep addressing the conversation even
  // if persistence is unavailable. The chat records the model that is about to
  // answer it, so reopening it later can tell whether that file is still on disk.
  ipcMain.handle(IpcChannels.createChat, (_event, chatId: unknown) => {
    const id = requireChatId(chatId)
    const modelFile = getSelectedModel()
    const modelSizeBytes =
      modelFile === null ? null : getModelFileSize(modelFile)

    if (modelFile === null || modelSizeBytes === null) {
      logger.warn('Rejected chat creation: no model selected')
      throw new Error('Select a model before starting a chat.')
    }

    const chat = createChat({ id, modelFile, modelSizeBytes })
    logger.info(`Chat created: ${chat.id} (${modelFile})`)

    return {
      id: chat.id,
      title: chat.title,
      modelFile: chat.modelFile,
      modelAvailability: 'available',
      updatedAt: chat.updatedAt.getTime(),
    } satisfies ChatSummary
  })

  ipcMain.handle(IpcChannels.deleteChat, (_event, chatId: unknown) => {
    const id = requireChatId(chatId)
    deleteChat(id)
    logger.info(`Chat deleted: ${id}`)
  })
}
