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

beforeEach(() => {
  const modalRoot = document.createElement('div')
  modalRoot.id = 'modal-root'
  document.body.appendChild(modalRoot)
})

afterEach(() => {
  clearMockElectronApi()
  document.getElementById('modal-root')?.remove()
})

// Deleting always goes through the confirmation dialog.
async function openChatActions(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Chat actions' }))
}

async function deleteChat(user: ReturnType<typeof userEvent.setup>) {
  await openChatActions(user)
  await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
  await user.click(screen.getByRole('button', { name: 'Delete' }))
}

describe('AppSidebar', () => {
  it('reopens at full width when the sidebar was left open', async () => {
    renderSidebar({ isSidebarOpen: true })

    expect(await screen.findByRole('complementary')).toHaveClass('w-80')
  })

  it('stays collapsed when the sidebar was left closed', async () => {
    renderSidebar()

    expect(await screen.findByRole('complementary')).toHaveClass('w-0')
  })

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

  // Chats without a stored title still fall back to "Untitled chat".
  it('labels a chat with no title as untitled, next to its model', async () => {
    renderSidebar({ chats: [chatSummary()] })

    expect(await screen.findByText('Untitled chat')).toBeInTheDocument()
    expect(screen.getByText('test-model')).toBeInTheDocument()
  })

  it('uses the title once a chat has one', async () => {
    renderSidebar({ chats: [chatSummary({ title: 'Sourdough tips' })] })

    expect(await screen.findByText('Sourdough tips')).toBeInTheDocument()
    expect(screen.getByText('Sourdough tips')).toHaveAttribute(
      'title',
      'Sourdough tips',
    )
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

  // Reopening would clear the messages on screen and cancel a running answer.
  it('ignores a click on the chat that is already open', async () => {
    renderSidebar({ chats: [chatSummary()] })
    const user = userEvent.setup()

    await user.click(await screen.findByText('Untitled chat'))
    await waitFor(() => {
      expect(mock.getChatMessages).toHaveBeenCalledTimes(1)
    })
    await user.click(screen.getByText('Untitled chat'))

    expect(mock.getChatMessages).toHaveBeenCalledTimes(1)
    expect(mock.stopGeneration).toHaveBeenCalledTimes(1)
  })

  it('stops any generation still running when switching chats', async () => {
    renderSidebar({ chats: [chatSummary()] })

    await userEvent.setup().click(await screen.findByText('Untitled chat'))

    expect(mock.stopGeneration).toHaveBeenCalledTimes(1)
  })

  it('deletes a chat and refreshes the list once the delete is confirmed', async () => {
    renderSidebar({ chats: [chatSummary()] })

    await deleteChat(userEvent.setup())

    expect(mock.deleteChat).toHaveBeenCalledWith('chat-1')
    await waitFor(() => {
      expect(mock.listChats).toHaveBeenCalledTimes(2)
    })
  })

  it('names the chat it is about to delete', async () => {
    renderSidebar({ chats: [chatSummary({ title: 'Sourdough tips' })] })
    const user = userEvent.setup()

    await openChatActions(user)
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

    expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription(
      '“Sourdough tips” and all of its messages will be permanently deleted.',
    )
  })

  it('keeps the chat when the delete is cancelled', async () => {
    renderSidebar({ chats: [chatSummary()] })
    const user = userEvent.setup()

    await openChatActions(user)
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mock.deleteChat).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('surfaces a failed delete', async () => {
    renderSidebar({ chats: [chatSummary()] })
    mock.deleteChat.mockRejectedValueOnce(new Error('locked'))

    await deleteChat(userEvent.setup())

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

  it('turns the title into an input when rename is chosen', async () => {
    renderSidebar({ chats: [chatSummary({ title: 'Sourdough tips' })] })
    const user = userEvent.setup()

    await openChatActions(user)
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))

    const input = screen.getByRole('textbox', { name: 'Rename' })

    expect(input).toHaveValue('Sourdough tips')
    expect(input).toHaveClass('h-5', 'border-0', 'bg-transparent', 'p-0')
    expect(input.closest('li')).toHaveClass('h-14')
  })

  it('starts a rename of an untitled chat with an empty field', async () => {
    renderSidebar({ chats: [chatSummary()] })
    const user = userEvent.setup()

    await openChatActions(user)
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))

    const input = screen.getByRole('textbox', { name: 'Rename' })
    expect(input).toHaveValue('')
    expect(input).toHaveAttribute('placeholder', 'Untitled chat')
  })

  it('saves the new title when the rename is submitted', async () => {
    renderSidebar({ chats: [chatSummary({ title: 'Sourdough tips' })] })
    const user = userEvent.setup()

    await openChatActions(user)
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
    await user.clear(screen.getByRole('textbox', { name: 'Rename' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Rename' }),
      'Starter notes{Enter}',
    )

    expect(mock.renameChat).toHaveBeenCalledWith('chat-1', 'Starter notes')
    expect(await screen.findByText('Starter notes')).toBeInTheDocument()
  })

  it('cancels the rename on Escape', async () => {
    renderSidebar({ chats: [chatSummary({ title: 'Sourdough tips' })] })
    const user = userEvent.setup()

    await openChatActions(user)
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Rename' }),
      'Nope{Escape}',
    )

    expect(mock.renameChat).not.toHaveBeenCalled()
    expect(screen.getByText('Sourdough tips')).toBeInTheDocument()
    expect(
      screen.queryByRole('textbox', { name: 'Rename' }),
    ).not.toBeInTheDocument()
  })

  it('surfaces a failed rename and restores the previous title', async () => {
    renderSidebar({ chats: [chatSummary({ title: 'Sourdough tips' })] })
    mock.renameChat.mockRejectedValueOnce(new Error('locked'))
    const user = userEvent.setup()

    await openChatActions(user)
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
    await user.clear(screen.getByRole('textbox', { name: 'Rename' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Rename' }),
      'Starter notes{Enter}',
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to rename that chat. Please try again.',
    )
    expect(await screen.findByText('Sourdough tips')).toBeInTheDocument()
  })
})
