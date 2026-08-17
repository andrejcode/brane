import { IpcChannels } from '@shared/types'
import {
  createElectronMock,
  getIpcHandler,
  resetElectronMock,
} from '@test/main/electron'
import { registerChatsHandlers } from '../chats'

const {
  createChat,
  deleteChat,
  listChats,
  listMessages,
  getModelAvailability,
  getModelFileSize,
  getSelectedModel,
} = vi.hoisted(() => ({
  createChat: vi.fn(),
  deleteChat: vi.fn(),
  listChats: vi.fn(() => []),
  listMessages: vi.fn(() => []),
  getModelAvailability: vi.fn(() => 'available'),
  getModelFileSize: vi.fn(() => 4096),
  getSelectedModel: vi.fn(() => 'test-model.gguf'),
}))

vi.mock('electron', () => createElectronMock())

vi.mock('../db/chats', () => ({
  createChat,
  deleteChat,
  listChats,
  listMessages,
}))

vi.mock('../model', () => ({
  getModelAvailability,
  getModelFileSize,
  getSelectedModel,
}))

function chatRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'chat-1',
    title: null,
    modelFile: 'test-model.gguf',
    modelSizeBytes: 4096,
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-01T11:00:00Z'),
    ...overrides,
  }
}

beforeEach(() => {
  resetElectronMock()
  vi.clearAllMocks()
  listChats.mockReturnValue([])
  listMessages.mockReturnValue([])
  getModelAvailability.mockReturnValue('available')
  getModelFileSize.mockReturnValue(4096)
  getSelectedModel.mockReturnValue('test-model.gguf')
  registerChatsHandlers()
})

describe('list chats', () => {
  it('reports each chat with the status of its model', () => {
    listChats.mockReturnValue([chatRow()] as unknown as [])
    getModelAvailability.mockReturnValue('replaced')

    expect(getIpcHandler(IpcChannels.listChats)()).toEqual([
      {
        id: 'chat-1',
        title: null,
        modelFile: 'test-model.gguf',
        modelAvailability: 'replaced',
        updatedAt: new Date('2026-01-01T11:00:00Z').getTime(),
      },
    ])
  })

  it('passes through a chat that has been named', () => {
    listChats.mockReturnValue([
      chatRow({ title: 'Sourdough tips' }),
    ] as unknown as [])

    const [chat] = getIpcHandler(IpcChannels.listChats)() as [
      { title: string | null },
    ]

    expect(chat.title).toBe('Sourdough tips')
  })
})

describe('get chat messages', () => {
  it('returns the stored turns without database bookkeeping', () => {
    listMessages.mockReturnValue([
      {
        id: 'message-1',
        chatId: 'chat-1',
        role: 'assistant',
        position: 0,
        content: 'answer',
        reasoning: 'pondering',
        finishReason: 'done',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as unknown as [])

    expect(getIpcHandler(IpcChannels.getChatMessages)({}, 'chat-1')).toEqual([
      {
        id: 'message-1',
        role: 'assistant',
        content: 'answer',
        reasoning: 'pondering',
        finishReason: 'done',
      },
    ])
  })

  it('rejects a missing chat id', () => {
    expect(() => getIpcHandler(IpcChannels.getChatMessages)({}, '')).toThrow(
      'Chat not found.',
    )
  })
})

describe('create chat', () => {
  it('records the selected model and its size', () => {
    createChat.mockReturnValue(chatRow() as unknown as undefined)

    getIpcHandler(IpcChannels.createChat)({}, 'chat-1')

    expect(createChat).toHaveBeenCalledWith({
      id: 'chat-1',
      modelFile: 'test-model.gguf',
      modelSizeBytes: 4096,
    })
  })

  it('rejects creation when no model is selected', () => {
    getSelectedModel.mockReturnValue(null as unknown as string)

    expect(() => getIpcHandler(IpcChannels.createChat)({}, 'chat-1')).toThrow(
      'Select a model before starting a chat.',
    )
  })

  it('rejects creation when the model file cannot be measured', () => {
    getModelFileSize.mockReturnValue(null as unknown as number)

    expect(() => getIpcHandler(IpcChannels.createChat)({}, 'chat-1')).toThrow(
      'Select a model before starting a chat.',
    )
  })
})

describe('delete chat', () => {
  it('deletes the requested chat', () => {
    getIpcHandler(IpcChannels.deleteChat)({}, 'chat-1')

    expect(deleteChat).toHaveBeenCalledWith('chat-1')
  })

  it('rejects a missing chat id', () => {
    expect(() => getIpcHandler(IpcChannels.deleteChat)({}, null)).toThrow(
      'Chat not found.',
    )
  })
})
