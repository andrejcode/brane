import { ipcMain } from 'electron'
import { deriveChatTitle } from '@shared/chatTitle'
import {
  IpcChannels,
  type ChatSummary,
  type StoredMessage,
} from '@shared/types'
import {
  createChat,
  deleteChat,
  listChats,
  listMessages,
  renameChat,
} from './db/chats'
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

function requireChatTitle(value: unknown, failedMessage: string): string {
  if (typeof value !== 'string') {
    logger.warn('Rejected chat request: missing title')
    throw new Error(failedMessage)
  }

  const title = deriveChatTitle(value)

  if (title.length === 0) {
    logger.warn('Rejected chat request: empty title')
    throw new Error(failedMessage)
  }

  return title
}

function toChatSummary(
  chat: ReturnType<typeof listChats>[number],
): ChatSummary {
  return {
    id: chat.id,
    title: chat.title,
    modelFile: chat.modelFile,
    modelAvailability: getModelAvailability(
      chat.modelFile,
      chat.modelSizeBytes,
    ),
    updatedAt: chat.updatedAt.getTime(),
  }
}

function toChatSummaries(): ChatSummary[] {
  return listChats().map(toChatSummary)
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
  ipcMain.handle(
    IpcChannels.createChat,
    (_event, chatId: unknown, title: unknown) => {
      const id = requireChatId(chatId)
      const chatTitle = requireChatTitle(title, 'Chat could not be created.')
      const modelFile = getSelectedModel()
      const modelSizeBytes =
        modelFile === null ? null : getModelFileSize(modelFile)

      if (modelFile === null || modelSizeBytes === null) {
        logger.warn('Rejected chat creation: no model selected')
        throw new Error('Select a model before starting a chat.')
      }

      const chat = createChat({
        id,
        modelFile,
        modelSizeBytes,
        title: chatTitle,
      })
      logger.info(`Chat created: ${chat.id} (${modelFile})`)

      return toChatSummary(chat)
    },
  )

  ipcMain.handle(
    IpcChannels.renameChat,
    (_event, chatId: unknown, title: unknown) => {
      const id = requireChatId(chatId)
      const chatTitle = requireChatTitle(title, 'Chat could not be renamed.')
      const chat = renameChat(id, chatTitle)

      if (chat === null) {
        logger.warn('Rejected chat rename: chat not found')
        throw new Error('Chat not found.')
      }

      logger.info(`Chat renamed: ${chat.id}`)

      return toChatSummary(chat)
    },
  )

  ipcMain.handle(IpcChannels.deleteChat, (_event, chatId: unknown) => {
    const id = requireChatId(chatId)
    deleteChat(id)
    logger.info(`Chat deleted: ${id}`)
  })
}
