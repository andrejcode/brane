import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppAlert } from '@/components/AppAlert'
import { AlertProvider } from '@/contexts/AlertContext'
import { ChatProvider } from '@/contexts/ChatContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import type { ChatSummary } from '@shared/types'
import {
  clearMockElectronApi,
  installMockElectronApi,
  type MockElectronApi,
  type MockElectronApiOptions,
} from '@test/electronApi'
import { AppSidebar } from '..'

let mock: MockElectronApi

function chatSummary(overrides: Partial<ChatSummary> = {}): ChatSummary {
  return {
    id: 'chat-1',
    title: null,
    modelFile: 'test-model.gguf',
    modelAvailability: 'available',
    updatedAt: 0,
    ...overrides,
  }
}

function renderSidebar(options: MockElectronApiOptions = {}) {
  mock = installMockElectronApi(options)

  return render(
    <AlertProvider>
      <SidebarProvider>
        <ChatProvider>
          <AppSidebar />
          <AppAlert />
        </ChatProvider>
      </SidebarProvider>
    </AlertProvider>,
  )
}

afterEach(() => {
  clearMockElectronApi()
})

describe('AppSidebar', () => {
  it('tells the user when there are no chats yet', async () => {
    renderSidebar()

    expect(await screen.findByText('No chats yet')).toBeInTheDocument()
  })

  it('says so when history cannot be read at all', async () => {
    mock = installMockElectronApi()
    mock.listChats.mockRejectedValue(new Error('database is gone'))

    render(
      <AlertProvider>
        <SidebarProvider>
          <ChatProvider>
            <AppSidebar />
          </ChatProvider>
        </SidebarProvider>
      </AlertProvider>,
    )

    expect(
      await screen.findByText('Chat history is unavailable.'),
    ).toBeInTheDocument()
  })

  // Chats stay "Untitled chat" until something names them, rather than borrowing
  // the first message and changing label once the turn finishes.
  it('labels a chat with no title as untitled, next to its model', async () => {
    renderSidebar({ chats: [chatSummary()] })

    expect(await screen.findByText('Untitled chat')).toBeInTheDocument()
    expect(screen.getByText('test-model')).toBeInTheDocument()
  })

  it('uses the title once a chat has one', async () => {
    renderSidebar({ chats: [chatSummary({ title: 'Sourdough tips' })] })

    expect(await screen.findByText('Sourdough tips')).toBeInTheDocument()
    expect(screen.queryByText('Untitled chat')).not.toBeInTheDocument()
  })

  it('flags a chat whose model is gone, explaining it on hover', async () => {
    renderSidebar({ chats: [chatSummary({ modelAvailability: 'missing' })] })

    expect(
      await screen.findByLabelText(
        'This model is no longer in your models folder.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByTitle('This model is no longer in your models folder.'),
    ).toBeInTheDocument()
  })

  it('explains a model that changed since the chat was created', async () => {
    renderSidebar({ chats: [chatSummary({ modelAvailability: 'replaced' })] })

    expect(
      await screen.findByTitle(
        'This model file has changed since the chat was created.',
      ),
    ).toBeInTheDocument()
  })

  it('leaves the model line unexplained when nothing is wrong', async () => {
    renderSidebar({ chats: [chatSummary()] })

    expect(await screen.findByText('test-model')).toBeInTheDocument()
    expect(
      screen.queryByTitle('This model is no longer in your models folder.'),
    ).not.toBeInTheDocument()
  })

  it('loads the messages of the chat that was clicked', async () => {
    renderSidebar({ chats: [chatSummary()] })

    await userEvent.setup().click(await screen.findByText('Untitled chat'))

    expect(mock.getChatMessages).toHaveBeenCalledWith('chat-1')
  })

  it('leaves the model alone when opening a chat', async () => {
    renderSidebar({ chats: [chatSummary()] })

    await userEvent.setup().click(await screen.findByText('Untitled chat'))

    await waitFor(() => {
      expect(mock.getChatMessages).toHaveBeenCalled()
    })
    expect(mock.loadModel).not.toHaveBeenCalled()
    expect(mock.setSelectedModel).not.toHaveBeenCalled()
  })

  it('stops any generation still running when switching chats', async () => {
    renderSidebar({ chats: [chatSummary()] })

    await userEvent.setup().click(await screen.findByText('Untitled chat'))

    expect(mock.stopGeneration).toHaveBeenCalledTimes(1)
  })

  it('deletes a chat and refreshes the list', async () => {
    renderSidebar({ chats: [chatSummary()] })

    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: 'Delete chat' }))

    expect(mock.deleteChat).toHaveBeenCalledWith('chat-1')
    await waitFor(() => {
      expect(mock.listChats).toHaveBeenCalledTimes(2)
    })
  })

  it('surfaces a failed delete', async () => {
    renderSidebar({ chats: [chatSummary()] })
    mock.deleteChat.mockRejectedValueOnce(new Error('locked'))

    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: 'Delete chat' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to delete that chat. Please try again.',
    )
  })

  it('surfaces a failed open', async () => {
    renderSidebar({ chats: [chatSummary()] })
    mock.getChatMessages.mockRejectedValueOnce(new Error('gone'))

    await userEvent.setup().click(await screen.findByText('Untitled chat'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to open that chat. Please try again.',
    )
  })
})
