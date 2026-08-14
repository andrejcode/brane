import { randomUUID } from 'node:crypto'
import { desc, eq } from 'drizzle-orm'
import type { FinishReason, MessageRole } from '@shared/types'
import { chats, messages, type ChatRow, type MessageRow } from './schema'
import { getDatabase } from './index'

interface CreateChatInput {
  modelFile: string
  modelSizeBytes: number
  id?: string
  title?: string | null
}

export function createChat({
  modelFile,
  modelSizeBytes,
  id = randomUUID(),
  title = null,
}: CreateChatInput): ChatRow {
  return getDatabase()
    .insert(chats)
    .values({ id, modelFile, modelSizeBytes, title })
    .returning()
    .get()
}

export function listChats(): ChatRow[] {
  return getDatabase().select().from(chats).orderBy(desc(chats.updatedAt)).all()
}

export function getChat(id: string): ChatRow | null {
  return (
    getDatabase().select().from(chats).where(eq(chats.id, id)).get() ?? null
  )
}

export function renameChat(id: string, title: string): ChatRow | null {
  return (
    getDatabase()
      .update(chats)
      .set({ title })
      .where(eq(chats.id, id))
      .returning()
      .get() ?? null
  )
}

export function deleteChat(id: string) {
  getDatabase().delete(chats).where(eq(chats.id, id)).run()
}

export function listMessages(chatId: string): MessageRow[] {
  return getDatabase()
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.position)
    .all()
}

interface AppendMessageInput {
  chatId: string
  role: MessageRole
  content: string
  id?: string
  reasoning?: string | null
  finishReason?: FinishReason | null
}

// The position lookup and insert share a transaction so two turns can't land on
// the same position.
export function appendMessage({
  chatId,
  role,
  content,
  id = randomUUID(),
  reasoning = null,
  finishReason = null,
}: AppendMessageInput): MessageRow {
  return getDatabase().transaction((tx) => {
    const lastMessage = tx
      .select({ position: messages.position })
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(desc(messages.position))
      .limit(1)
      .get()

    const message = tx
      .insert(messages)
      .values({
        id,
        chatId,
        role,
        content,
        reasoning,
        finishReason,
        position: (lastMessage?.position ?? -1) + 1,
      })
      .returning()
      .get()

    tx.update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, chatId))
      .run()

    return message
  })
}

interface UpdateMessageInput {
  content: string
  reasoning?: string | null
  finishReason?: FinishReason | null
}

export function updateMessage(
  id: string,
  { content, reasoning = null, finishReason = null }: UpdateMessageInput,
): MessageRow | null {
  return getDatabase().transaction((tx) => {
    const message = tx
      .update(messages)
      .set({ content, reasoning, finishReason })
      .where(eq(messages.id, id))
      .returning()
      .get()

    if (!message) {
      return null
    }

    tx.update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, message.chatId))
      .run()

    return message
  })
}
