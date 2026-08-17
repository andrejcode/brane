import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppAlert } from '@/components/AppAlert'
import { AlertProvider } from '@/contexts/AlertContext'
import { ChatProvider, useChat } from '@/contexts/ChatContext'
import { ChatSettingsProvider } from '@/contexts/ChatSettingsContext'
import { ModelProvider, useModel } from '@/contexts/ModelContext'
import {
  clearMockElectronApi,
  installMockElectronApi,
  type MockElectronApi,
  type MockElectronApiOptions,
} from '@test/electronApi'
import { Chat } from '../index'
import { introMessages } from '../IntroMessage'

let mock: MockElectronApi

beforeEach(() => {
  mock = installMockElectronApi({
    models: ['test-model.gguf'],
    selectedModel: 'test-model.gguf',
  })
})

afterEach(() => {
  clearMockElectronApi()
})

// Stands in for clicking a chat in the sidebar, so tests can exercise what
// sending does after a stored chat is opened.
function OpenStoredChat({ chatId }: { chatId: string }) {
  const { openChat } = useChat()

  return (
    <button
      type="button"
      onClick={() => {
        void openChat(chatId)
      }}
    >
      Open stored chat
    </button>
  )
}

// Stands in for picking a model in the models modal.
function SelectModel({ model }: { model: string }) {
  const { selectModel } = useModel()

  return (
    <button
      type="button"
      onClick={() => {
        void selectModel(model)
      }}
    >
      Select {model}
    </button>
  )
}

// Chat raises backend errors through the shared alert, so render it inside the
// provider alongside the GlobalAlert that displays them. The ModelProvider
// supplies the selected model that gates sending.
function renderChat({
  storedChatId,
  selectableModel,
}: { storedChatId?: string; selectableModel?: string } = {}) {
  return render(
    <AlertProvider>
      <ModelProvider>
        <ChatSettingsProvider>
          <ChatProvider>
            <Chat />
            <AppAlert />
            {storedChatId === undefined ? null : (
              <OpenStoredChat chatId={storedChatId} />
            )}
            {selectableModel === undefined ? null : (
              <SelectModel model={selectableModel} />
            )}
          </ChatProvider>
        </ChatSettingsProvider>
      </ModelProvider>
    </AlertProvider>,
  )
}

async function openStoredChat(
  options: MockElectronApiOptions,
  { selectableModel }: { selectableModel?: string } = {},
) {
  clearMockElectronApi()
  mock = installMockElectronApi(options)

  const [chat] = options.chats ?? []
  renderChat({
    storedChatId: chat?.id ?? 'chat-1',
    ...(selectableModel === undefined ? {} : { selectableModel }),
  })

  await waitFor(() => {
    expect(mock.listChats).toHaveBeenCalled()
  })

  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Open stored chat' }))

  await waitFor(() => {
    expect(mock.getChatMessages).toHaveBeenCalled()
  })
}

async function submitPrompt(text: string) {
  const user = userEvent.setup()

  // Wait for the ModelProvider to load the selected model before sending,
  // otherwise the send guard would block the prompt.
  await waitFor(() => {
    expect(mock.getModelState).toHaveBeenCalled()
  })

  await user.type(screen.getByPlaceholderText('Ask anything'), text)
  await user.click(screen.getByRole('button', { name: 'Send message' }))
}

describe('Chat intro greeting', () => {
  it('shows a random intro greeting centered when there are no messages', () => {
    renderChat()

    const greeting = screen.getByTestId('intro-greeting')
    const composer = screen.getByTestId('composer')

    expect(introMessages).toContain(greeting.textContent)
    expect(greeting).toHaveClass('opacity-100')
    expect(greeting).not.toHaveClass('opacity-0')
    expect(composer).toHaveClass('bottom-1/2')
    expect(composer).not.toHaveClass('bottom-0')
  })

  it('fades out the greeting and docks the composer after the first message', async () => {
    renderChat()

    await submitPrompt('hello')

    const greeting = screen.getByTestId('intro-greeting')
    const composer = screen.getByTestId('composer')

    expect(greeting).toHaveClass('opacity-0')
    expect(greeting).not.toHaveClass('opacity-100')
    expect(composer).toHaveClass('bottom-0')
    expect(composer).not.toHaveClass('bottom-1/2')
  })
})

describe('Chat submit', () => {
  it('sends the trimmed prompt, shows it, and clears the input', async () => {
    renderChat()

    await submitPrompt('  hello  ')

    await waitFor(() => {
      expect(mock.sendPrompt).toHaveBeenCalledWith('hello', expect.any(String))
    })
    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ask anything')).toHaveValue('')
  })

  it('creates a chat for the first prompt and sends under that id', async () => {
    renderChat()

    await submitPrompt('hello')

    await waitFor(() => {
      expect(mock.createChat).toHaveBeenCalledTimes(1)
    })

    const [chatId] = mock.createChat.mock.calls[0] as [string]
    expect(mock.sendPrompt).toHaveBeenCalledWith('hello', chatId)
  })

  it('keeps the same chat for later prompts', async () => {
    renderChat()

    await submitPrompt('first')
    act(() => {
      mock.emitStream({ type: 'done', response: 'answer' })
    })
    await submitPrompt('second')

    await waitFor(() => {
      expect(mock.sendPrompt).toHaveBeenCalledTimes(2)
    })
    expect(mock.createChat).toHaveBeenCalledTimes(1)
  })

  it('warns and sends nothing when history cannot be stored', async () => {
    mock.createChat.mockRejectedValueOnce(new Error('database is gone'))
    renderChat()

    await submitPrompt('hello')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Chat history is unavailable, so this conversation won't be saved.",
    )
    // The turn still goes through; only its persistence is lost.
    await waitFor(() => {
      expect(mock.sendPrompt).toHaveBeenCalledTimes(1)
    })
  })
})

describe('Chat resuming a stored chat', () => {
  const storedChat = {
    id: 'chat-1',
    title: null,
    modelFile: 'other-model.gguf',
    modelAvailability: 'available' as const,
    updatedAt: 0,
  }

  it('shows the stored messages without loading the chat model', async () => {
    await openStoredChat({
      models: ['test-model.gguf', 'other-model.gguf'],
      selectedModel: 'test-model.gguf',
      chats: [storedChat],
      chatMessages: [
        {
          id: 'message-1',
          role: 'user',
          content: 'earlier question',
          reasoning: null,
          finishReason: null,
        },
      ],
    })

    expect(screen.getByText('earlier question')).toBeInTheDocument()
    expect(mock.setSelectedModel).not.toHaveBeenCalled()
  })

  it('loads the model the chat belongs to when sending', async () => {
    await openStoredChat({
      models: ['test-model.gguf', 'other-model.gguf'],
      selectedModel: 'test-model.gguf',
      chats: [storedChat],
    })

    await submitPrompt('follow up')

    await waitFor(() => {
      expect(mock.setSelectedModel).toHaveBeenCalledWith('other-model.gguf')
    })
    expect(mock.sendPrompt).toHaveBeenCalledWith('follow up', 'chat-1')
  })

  it('reuses the existing chat instead of creating another one', async () => {
    await openStoredChat({
      models: ['other-model.gguf'],
      selectedModel: 'other-model.gguf',
      chats: [storedChat],
    })

    await submitPrompt('follow up')

    await waitFor(() => {
      expect(mock.sendPrompt).toHaveBeenCalled()
    })
    expect(mock.createChat).not.toHaveBeenCalled()
  })

  it('loads that model once and keeps it for later turns', async () => {
    await openStoredChat({
      models: ['test-model.gguf', 'other-model.gguf'],
      selectedModel: 'test-model.gguf',
      chats: [storedChat],
    })

    await submitPrompt('first')
    await waitFor(() => {
      expect(mock.setSelectedModel).toHaveBeenCalledTimes(1)
    })
    act(() => {
      mock.emitStream({ type: 'done', response: 'answer' })
    })

    await submitPrompt('second')

    await waitFor(() => {
      expect(mock.sendPrompt).toHaveBeenCalledTimes(2)
    })
    expect(mock.setSelectedModel).toHaveBeenCalledTimes(1)
  })
})

describe('Chat when another model is selected', () => {
  const storedChat = {
    id: 'chat-1',
    title: null,
    modelFile: 'other-model.gguf',
    modelAvailability: 'available' as const,
    updatedAt: 0,
  }

  async function openThenSelect(model: string) {
    await openStoredChat(
      {
        models: ['test-model.gguf', 'other-model.gguf'],
        selectedModel: 'other-model.gguf',
        chats: [storedChat],
        chatMessages: [
          {
            id: 'message-1',
            role: 'user',
            content: 'earlier question',
            reasoning: null,
            finishReason: null,
          },
        ],
      },
      { selectableModel: model },
    )

    expect(screen.getByText('earlier question')).toBeInTheDocument()

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: `Select ${model}` }))
  }

  it('drops back to the starting state, ready for a new chat', async () => {
    await openThenSelect('test-model.gguf')

    await waitFor(() => {
      expect(screen.queryByText('earlier question')).not.toBeInTheDocument()
    })
    expect(screen.getByTestId('intro-greeting')).toHaveClass('opacity-100')
    expect(screen.getByTestId('composer')).toHaveClass('bottom-1/2')
  })

  it('sends the next message as a new chat on the chosen model', async () => {
    await openThenSelect('test-model.gguf')

    await submitPrompt('fresh start')

    await waitFor(() => {
      expect(mock.createChat).toHaveBeenCalledTimes(1)
    })
    const [chatId] = mock.createChat.mock.calls[0] as [string]
    expect(chatId).not.toBe('chat-1')
    expect(mock.sendPrompt).toHaveBeenCalledWith('fresh start', chatId)
  })

  it('stays in the chat when its own model is selected again', async () => {
    await openThenSelect('other-model.gguf')

    expect(screen.getByText('earlier question')).toBeInTheDocument()
  })
})

describe('Chat with a model that was deleted', () => {
  const missingModelChat = {
    id: 'chat-1',
    title: null,
    modelFile: 'other-model.gguf',
    modelAvailability: 'missing' as const,
    updatedAt: 0,
  }

  async function openReadOnlyChat() {
    await openStoredChat({
      models: ['test-model.gguf'],
      selectedModel: 'test-model.gguf',
      chats: [missingModelChat],
      chatMessages: [
        {
          id: 'message-1',
          role: 'user',
          content: 'earlier question',
          reasoning: null,
          finishReason: null,
        },
      ],
    })
  }

  it('explains why the chat cannot be continued', async () => {
    await openReadOnlyChat()

    expect(screen.getByTestId('read-only-notice')).toHaveTextContent(
      'This chat can only be read, because its model is no longer available.',
    )
  })

  it('still shows the stored messages', async () => {
    await openReadOnlyChat()

    expect(screen.getByText('earlier question')).toBeInTheDocument()
  })

  it('offers no way to send', async () => {
    await openReadOnlyChat()

    expect(
      screen.queryByPlaceholderText('Ask anything'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Send message' }),
    ).not.toBeInTheDocument()
  })

  // Deleting a model clears the selection app-wide, which must not stop another
  // chat whose own model is still on disk from being continued.
  it('still continues another chat whose model is there', async () => {
    await openStoredChat({
      models: ['other-model.gguf', 'deleted-model.gguf'],
      selectedModel: 'deleted-model.gguf',
      chats: [{ ...missingModelChat, modelAvailability: 'available' }],
    })

    act(() => {
      mock.emitModelStateChange({
        models: ['other-model.gguf'],
        selectedModel: null,
      })
    })

    await submitPrompt('follow up')

    await waitFor(() => {
      expect(mock.setSelectedModel).toHaveBeenCalledWith('other-model.gguf')
    })
    expect(mock.sendPrompt).toHaveBeenCalledWith('follow up', 'chat-1')
    expect(
      screen.queryByText('Please select a model to send a message.'),
    ).not.toBeInTheDocument()
  })

  it('asks for a model when a new chat has none selected', async () => {
    clearMockElectronApi()
    mock = installMockElectronApi({ models: [], selectedModel: null })
    renderChat()

    await submitPrompt('hello')

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Please select a model to send a message.',
    )
    expect(mock.sendPrompt).not.toHaveBeenCalled()
  })

  it('turns the open chat read-only as soon as its model is deleted', async () => {
    await openStoredChat({
      models: ['other-model.gguf'],
      selectedModel: 'other-model.gguf',
      chats: [{ ...missingModelChat, modelAvailability: 'available' }],
      chatMessages: [
        {
          id: 'message-1',
          role: 'user',
          content: 'earlier question',
          reasoning: null,
          finishReason: null,
        },
      ],
    })

    expect(screen.getByPlaceholderText('Ask anything')).toBeInTheDocument()

    mock.listChats.mockResolvedValue([missingModelChat])
    act(() => {
      mock.emitModelStateChange({ models: [], selectedModel: null })
    })

    expect(await screen.findByTestId('read-only-notice')).toBeInTheDocument()
    // Losing the model is not the user moving on, so the chat stays open.
    expect(screen.getByText('earlier question')).toBeInTheDocument()
  })
})

describe('Chat streaming', () => {
  it('appends streamed chunks to the assistant message', async () => {
    renderChat()
    await submitPrompt('hi')

    act(() => {
      mock.emitStream({ type: 'chunk', text: 'Hel' })
      mock.emitStream({ type: 'chunk', text: 'lo!' })
    })

    expect(screen.getByText('Hello!')).toBeInTheDocument()
  })

  it('collapses thought segments into a reasoning toggle kept out of the answer', async () => {
    renderChat()
    await submitPrompt('hi')

    act(() => {
      mock.emitStream({
        type: 'chunk',
        text: 'let me reason',
        segment: 'thought',
      })
    })

    const toggle = screen.getByRole('button', { name: 'Thinking' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    act(() => {
      mock.emitStream({ type: 'chunk', text: 'the answer' })
    })

    // The answer renders on its own; the reasoning stays behind the toggle.
    expect(screen.getByText('the answer')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thinking' })).toBeInTheDocument()

    await userEvent.setup().click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('let me reason')).toBeInTheDocument()
  })

  it('trims leading blank lines from the streamed answer', async () => {
    renderChat()
    await submitPrompt('hi')

    act(() => {
      mock.emitStream({ type: 'chunk', text: '\n\nHello there' })
    })

    expect(screen.getByText('Hello there')).toBeInTheDocument()
  })

  it('fills the response on done when nothing streamed', async () => {
    renderChat()
    await submitPrompt('hi')

    act(() => {
      mock.emitStream({ type: 'done', response: 'Full answer' })
    })

    expect(screen.getByText('Full answer')).toBeInTheDocument()
  })

  it('keeps streamed content when done arrives after chunks', async () => {
    renderChat()
    await submitPrompt('hi')

    act(() => {
      mock.emitStream({ type: 'chunk', text: 'streamed' })
      mock.emitStream({ type: 'done', response: 'ignored fallback' })
    })

    expect(screen.getByText('streamed')).toBeInTheDocument()
    expect(screen.queryByText('ignored fallback')).not.toBeInTheDocument()
  })

  it('surfaces an error event through the global alert', async () => {
    renderChat()
    await submitPrompt('hi')

    act(() => {
      mock.emitStream({ type: 'error', message: 'kaboom' })
    })

    expect(screen.getByRole('alert')).toHaveTextContent('kaboom')
    // The empty assistant placeholder (and its spinner) should be removed.
    expect(
      screen.queryByRole('status', { name: 'Loading' }),
    ).not.toBeInTheDocument()
  })
})

describe('Chat without a selected model', () => {
  it('blocks sending and shows an info alert', async () => {
    clearMockElectronApi()
    mock = installMockElectronApi({ models: [], selectedModel: null })
    const user = userEvent.setup()
    renderChat()

    await user.type(screen.getByPlaceholderText('Ask anything'), 'hello')
    await user.click(screen.getByRole('button', { name: 'Send message' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Please select a model to send a message.',
    )
    expect(mock.sendPrompt).not.toHaveBeenCalled()
  })
})

describe('Chat error handling', () => {
  it('shows a friendly alert when sendPrompt rejects', async () => {
    mock.sendPrompt.mockRejectedValueOnce(new Error('network down'))
    renderChat()

    await submitPrompt('hi')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to send your message. Please try again.',
    )
  })
})

describe('Chat stop generation', () => {
  it('calls stopGeneration when the stop button is clicked', async () => {
    renderChat()
    await submitPrompt('hi')

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Stop generating' }))

    expect(mock.stopGeneration).toHaveBeenCalledTimes(1)
  })

  it('ends the sending state when a stopped done event arrives', async () => {
    renderChat()
    await submitPrompt('hi')

    act(() => {
      mock.emitStream({ type: 'chunk', text: 'partial' })
      mock.emitStream({
        type: 'done',
        response: 'partial',
        stopped: true,
      })
    })

    expect(screen.getByText('partial')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Stop generating' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
  })

  it('removes the loading spinner when stopped before any text streamed', async () => {
    renderChat()
    await submitPrompt('hi')

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()

    act(() => {
      mock.emitStream({ type: 'done', response: '', stopped: true })
    })

    expect(
      screen.queryByRole('status', { name: 'Loading' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Stop generating' }),
    ).not.toBeInTheDocument()
  })
})

describe('Chat lifecycle', () => {
  it('unsubscribes from the stream on unmount', () => {
    const { unmount } = renderChat()

    unmount()

    expect(mock.streamUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
