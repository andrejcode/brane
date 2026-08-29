import {
  closeDatabaseMock,
  createDatabaseMock,
  resetDatabaseMock,
} from '@test/main/db'
import {
  appendMessage,
  createChat,
  deleteChat,
  getChat,
  listChats,
  listMessages,
  renameChat,
  updateMessage,
} from '../chats'

vi.mock('../index', () => createDatabaseMock())

function createTestChat(overrides: { modelFile?: string } = {}) {
  return createChat({
    modelFile: overrides.modelFile ?? 'test-model.gguf',
    modelSizeBytes: 1024,
  })
}

beforeEach(() => {
  resetDatabaseMock()
})

afterAll(() => {
  closeDatabaseMock()
})

describe('createChat', () => {
  it('stores the model it was created with', () => {
    const chat = createTestChat({ modelFile: 'Qwen3-4B-Q5_K_M.gguf' })

    expect(chat).toMatchObject({
      modelFile: 'Qwen3-4B-Q5_K_M.gguf',
      modelSizeBytes: 1024,
      title: null,
    })
    expect(chat.createdAt).toBeInstanceOf(Date)
    expect(chat.updatedAt).toBeInstanceOf(Date)
  })

  it('generates an id when none is given', () => {
    expect(createTestChat().id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('keeps a caller-provided id so the renderer can reuse its own', () => {
    const chat = createChat({
      id: 'chat-1',
      modelFile: 'test-model.gguf',
      modelSizeBytes: 1,
    })

    expect(getChat('chat-1')).toMatchObject({ id: chat.id })
  })

  it('stores a caller-provided title', () => {
    const chat = createChat({
      id: 'chat-1',
      modelFile: 'test-model.gguf',
      modelSizeBytes: 1,
      title: 'Sourdough tips',
    })

    expect(chat.title).toBe('Sourdough tips')
  })
})

describe('getChat', () => {
  it('returns null for an unknown chat', () => {
    expect(getChat('missing')).toBeNull()
  })
})

describe('renameChat', () => {
  it('sets the title', () => {
    const chat = createTestChat()

    expect(renameChat(chat.id, 'Sourdough tips')?.title).toBe('Sourdough tips')
  })

  it('returns null for an unknown chat', () => {
    expect(renameChat('missing', 'Nope')).toBeNull()
  })

  it('does not treat a rename as new activity', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'))
    const older = createTestChat()
    vi.setSystemTime(new Date('2026-01-01T11:00:00Z'))
    const newer = createTestChat()
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))

    renameChat(older.id, 'Renamed')

    expect(listChats().map((chat) => chat.id)).toEqual([newer.id, older.id])
    vi.useRealTimers()
  })
})

describe('appendMessage', () => {
  it('numbers turns in the order they were appended', () => {
    const chat = createTestChat()

    appendMessage({ chatId: chat.id, role: 'user', content: 'hi' })
    appendMessage({
      chatId: chat.id,
      role: 'assistant',
      content: 'hello',
      finishReason: 'done',
    })
    appendMessage({ chatId: chat.id, role: 'user', content: 'again' })

    expect(listMessages(chat.id).map((message) => message.position)).toEqual([
      0, 1, 2,
    ])
  })

  it('numbers each chat independently', () => {
    const first = createTestChat()
    const second = createTestChat()

    appendMessage({ chatId: first.id, role: 'user', content: 'one' })
    const other = appendMessage({
      chatId: second.id,
      role: 'user',
      content: 'two',
    })

    expect(other.position).toBe(0)
  })

  it('round-trips an assistant turn with its reasoning and finish reason', () => {
    const chat = createTestChat()

    appendMessage({
      chatId: chat.id,
      role: 'assistant',
      content: 'partial answer',
      reasoning: 'thinking out loud',
      finishReason: 'stopped',
    })

    expect(listMessages(chat.id)[0]).toMatchObject({
      role: 'assistant',
      content: 'partial answer',
      reasoning: 'thinking out loud',
      finishReason: 'stopped',
    })
  })

  it('leaves assistant-only fields empty on a user turn', () => {
    const chat = createTestChat()

    appendMessage({ chatId: chat.id, role: 'user', content: 'hi' })

    expect(listMessages(chat.id)[0]).toMatchObject({
      reasoning: null,
      finishReason: null,
    })
  })

  it('rejects a user turn that carries a finish reason', () => {
    const chat = createTestChat()

    expect(() =>
      appendMessage({
        chatId: chat.id,
        role: 'user',
        content: 'hi',
        finishReason: 'done',
      }),
    ).toThrow()
  })

  it('rejects a message for a chat that does not exist', () => {
    expect(() =>
      appendMessage({ chatId: 'missing', role: 'user', content: 'hi' }),
    ).toThrow()
  })
})

describe('updateMessage', () => {
  it('finalizes a streamed assistant turn', () => {
    const chat = createTestChat()
    const placeholder = appendMessage({
      chatId: chat.id,
      role: 'assistant',
      content: '',
    })

    const finalized = updateMessage(placeholder.id, {
      content: 'the answer',
      reasoning: 'because',
      finishReason: 'done',
    })

    expect(finalized).toMatchObject({
      content: 'the answer',
      reasoning: 'because',
      finishReason: 'done',
    })
  })

  it('returns null for an unknown message', () => {
    expect(updateMessage('missing', { content: 'nope' })).toBeNull()
  })
})

describe('deleteChat', () => {
  it('removes the chat and its messages', () => {
    const chat = createTestChat()
    appendMessage({ chatId: chat.id, role: 'user', content: 'hi' })

    deleteChat(chat.id)

    expect(getChat(chat.id)).toBeNull()
    expect(listMessages(chat.id)).toEqual([])
  })
})

describe('listChats', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('puts the most recently active chat first', () => {
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'))
    const older = createTestChat()
    vi.setSystemTime(new Date('2026-01-01T11:00:00Z'))
    const newer = createTestChat()

    expect(listChats().map((chat) => chat.id)).toEqual([newer.id, older.id])

    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    appendMessage({ chatId: older.id, role: 'user', content: 'hi' })

    expect(listChats().map((chat) => chat.id)).toEqual([older.id, newer.id])
  })

  it('bumps the chat when a turn is finalized', () => {
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'))
    const chat = createTestChat()
    const message = appendMessage({
      chatId: chat.id,
      role: 'assistant',
      content: '',
    })

    vi.setSystemTime(new Date('2026-01-01T10:05:00Z'))
    updateMessage(message.id, { content: 'done', finishReason: 'done' })

    expect(getChat(chat.id)?.updatedAt).toEqual(
      new Date('2026-01-01T10:05:00Z'),
    )
  })
})
