import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
// Type-only so drizzle-kit can read this schema without resolving path aliases.
import type { FinishReason, MessageRole } from '@shared/types'

const createdAt = () =>
  integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())

const updatedAt = () =>
  integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())

export const chats = sqliteTable(
  'chats',
  {
    id: text('id').primaryKey(),
    title: text('title'),
    // Filename inside the models directory (e.g. "Qwen3-4B-Q5_K_M.gguf"). Not a
    // relation because models live on disk and may be deleted without
    // invalidating the chat history.
    modelFile: text('model_file').notNull(),
    // Size at creation time, so a same-named model that was re-downloaded or
    // re-quantized can be told apart from the original.
    modelSizeBytes: integer('model_size_bytes').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('chats_updated_at_idx').on(table.updatedAt)],
)

export const messages = sqliteTable(
  'messages',
  {
    id: text('id').primaryKey(),
    chatId: text('chat_id')
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    role: text('role').$type<MessageRole>().notNull(),
    // Explicit turn order, so replaying a chat never depends on sorting by id or
    // timestamp (both can tie).
    position: integer('position').notNull(),
    content: text('content').notNull(),
    // Kept out of `content` so it isn't replayed into the next prompt.
    reasoning: text('reasoning'),
    finishReason: text('finish_reason').$type<FinishReason>(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('messages_chat_id_position_idx').on(
      table.chatId,
      table.position,
    ),
    check(
      'messages_assistant_only_fields',
      sql`${table.role} = 'assistant' or (${table.reasoning} is null and ${table.finishReason} is null)`,
    ),
  ],
)

export type ChatRow = typeof chats.$inferSelect
export type MessageRow = typeof messages.$inferSelect
