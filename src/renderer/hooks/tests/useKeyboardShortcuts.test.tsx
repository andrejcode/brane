import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { AlertProvider } from '@/contexts/AlertContext'
import { AppearanceProvider } from '@/contexts/AppearanceContext'
import { ChatProvider, useChat } from '@/contexts/ChatContext'
import { ModalProvider, useModals } from '@/contexts/ModalContext'
import { ShortcutsProvider } from '@/contexts/ShortcutsContext'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Modal } from '@/ui/Modal'
import { DEFAULT_SHORTCUTS, type ChatSummary } from '@shared/types'
import {
  clearMockElectronApi,
  installMockElectronApi,
  type MockElectronApi,
} from '@test/electronApi'

let mock: MockElectronApi

interface ShortcutsHarnessProps {
  withMessages: boolean
  isSending: boolean
  isStandaloneModalOpen: boolean
}

// Seeds chat state so shortcuts can exercise generation and conversation actions.
function ShortcutsHarness({
  withMessages,
  isSending,
  isStandaloneModalOpen,
}: ShortcutsHarnessProps) {
  useKeyboardShortcuts()
  const { messages, setMessages, setIsSending } = useChat()
  const { activeModal } = useModals()
  const { isSidebarOpen, setSearchInput } = useSidebar()

  useEffect(() => {
    if (withMessages) {
      setMessages([{ id: 'user-1', role: 'user', content: 'hi' }])
    }
    setIsSending(isSending)
  }, [isSending, withMessages, setIsSending, setMessages])

  return (
    <>
      <div
        data-testid="chat-state"
        data-message-count={messages.length}
        data-active-modal={activeModal ?? 'none'}
        data-sidebar-open={isSidebarOpen}
      />
      <input ref={setSearchInput} aria-label="Search chats" />
      <Modal
        isOpen={isStandaloneModalOpen}
        onClose={() => undefined}
        ariaLabelledBy="standalone-modal-title"
      >
        <h2 id="standalone-modal-title">Confirm action</h2>
      </Modal>
    </>
  )
}

async function renderHarness({
  isMac = false,
  withMessages = false,
  isSending = false,
  messageFontSize = 16,
  chats = [],
  isStandaloneModalOpen = false,
}: {
  isMac?: boolean
  withMessages?: boolean
  isSending?: boolean
  messageFontSize?: number
  chats?: ChatSummary[]
  isStandaloneModalOpen?: boolean
} = {}) {
  mock = installMockElectronApi({ isMac, messageFontSize, chats })

  const result = render(
    <AlertProvider>
      <ModalProvider>
        <AppearanceProvider>
          <ShortcutsProvider>
            <SidebarProvider>
              <ChatProvider>
                <ShortcutsHarness
                  withMessages={withMessages}
                  isSending={isSending}
                  isStandaloneModalOpen={isStandaloneModalOpen}
                />
              </ChatProvider>
            </SidebarProvider>
          </ShortcutsProvider>
        </AppearanceProvider>
      </ModalProvider>
    </AlertProvider>,
  )

  await waitFor(() => {
    expect(mock.updateApplicationMenu).toHaveBeenCalled()
    expect(mock.getMessageFontSize).toHaveBeenCalled()
    expect(mock.listChats).toHaveBeenCalled()
    expect(
      document.documentElement.style.getPropertyValue('--message-font-size'),
    ).toBe(`${messageFontSize}px`)
  })

  return result
}

afterEach(() => {
  cleanup()
  clearMockElectronApi()
  document.getElementById('modal-root')?.remove()
})

describe('useKeyboardShortcuts', () => {
  it('stops an active generation on Cmd+Period on macOS', async () => {
    await renderHarness({ isMac: true, isSending: true })

    await userEvent.setup().keyboard('{Meta>}.{/Meta}')

    expect(mock.stopGeneration).toHaveBeenCalledTimes(1)
  })

  it('does not stop generation on Cmd+Period while idle', async () => {
    await renderHarness({ isMac: true })

    await userEvent.setup().keyboard('{Meta>}.{/Meta}')

    expect(mock.stopGeneration).not.toHaveBeenCalled()
  })

  it('starts a new chat on Ctrl+N', async () => {
    await renderHarness({ withMessages: true })

    await waitFor(() => {
      expect(screen.getByTestId('chat-state')).toHaveAttribute(
        'data-message-count',
        '1',
      )
    })

    await userEvent.setup().keyboard('{Control>}n{/Control}')

    expect(screen.getByTestId('chat-state')).toHaveAttribute(
      'data-message-count',
      '0',
    )
    expect(mock.stopGeneration).toHaveBeenCalledTimes(1)
  })

  it('opens the sidebar and focuses chat search on Ctrl+F', async () => {
    await renderHarness()

    await userEvent.setup().keyboard('{Control>}f{/Control}')

    expect(screen.getByTestId('chat-state')).toHaveAttribute(
      'data-sidebar-open',
      'true',
    )
    expect(screen.getByRole('textbox', { name: 'Search chats' })).toHaveFocus()
    expect(mock.setSidebarOpen).toHaveBeenCalledWith(true)
  })

  it('starts a new chat on Cmd+N on macOS', async () => {
    await renderHarness({ isMac: true, withMessages: true })

    await waitFor(() => {
      expect(screen.getByTestId('chat-state')).toHaveAttribute(
        'data-message-count',
        '1',
      )
    })

    await userEvent.setup().keyboard('{Meta>}n{/Meta}')

    expect(screen.getByTestId('chat-state')).toHaveAttribute(
      'data-message-count',
      '0',
    )
  })

  it('does nothing when the chat on screen is already new', async () => {
    await renderHarness()

    await userEvent.setup().keyboard('{Control>}n{/Control}')

    expect(mock.stopGeneration).not.toHaveBeenCalled()
  })

  it('still handles the other shortcuts', async () => {
    await renderHarness()

    await userEvent.setup().keyboard('{Control>},{/Control}')

    expect(screen.getByTestId('chat-state')).toHaveAttribute(
      'data-active-modal',
      'settings',
    )
  })

  it('blocks main-view shortcuts while a modal is open', async () => {
    await renderHarness({ withMessages: true })
    const user = userEvent.setup()

    await user.keyboard('{Control>},{/Control}')
    await user.keyboard('{Control>}n{/Control}')
    await user.keyboard('{Control>}f{/Control}')

    expect(screen.getByTestId('chat-state')).toHaveAttribute(
      'data-message-count',
      '1',
    )
    expect(screen.getByTestId('chat-state')).toHaveAttribute(
      'data-sidebar-open',
      'false',
    )

    act(() => {
      mock.emitApplicationMenuAction({ type: 'toggleSidebar' })
    })

    expect(mock.setSidebarOpen).not.toHaveBeenCalled()
  })

  it('blocks main-view shortcuts while a standalone modal is open', async () => {
    const modalRoot = document.createElement('div')
    modalRoot.id = 'modal-root'
    document.body.appendChild(modalRoot)
    await renderHarness({ withMessages: true, isStandaloneModalOpen: true })

    await userEvent.setup().keyboard('{Control>}n{/Control}')

    expect(screen.getByTestId('chat-state')).toHaveAttribute(
      'data-message-count',
      '1',
    )
  })

  it('uses Cmd++ to increase message font size instead of page zoom', async () => {
    await renderHarness({ isMac: true })
    const event = new KeyboardEvent('keydown', {
      key: '+',
      metaKey: true,
      shiftKey: true,
      cancelable: true,
    })

    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(mock.setMessageFontSize).toHaveBeenCalledWith(17)
  })

  it('uses Cmd+- to decrease message font size instead of page zoom', async () => {
    await renderHarness({ isMac: true })
    const event = new KeyboardEvent('keydown', {
      key: '-',
      metaKey: true,
      cancelable: true,
    })

    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(mock.setMessageFontSize).toHaveBeenCalledWith(15)
  })

  it('uses Cmd+0 to reset message font size to 16px', async () => {
    await renderHarness({ isMac: true, messageFontSize: 20 })
    const event = new KeyboardEvent('keydown', {
      key: '0',
      metaKey: true,
      cancelable: true,
    })

    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(mock.setMessageFontSize).toHaveBeenCalledWith(16)
  })

  it('syncs current shortcuts and recent chats to the native menu', async () => {
    const chat: ChatSummary = {
      id: 'chat-1',
      title: 'First chat',
      modelFile: 'model.gguf',
      modelAvailability: 'available',
      updatedAt: 1,
    }

    await renderHarness({ chats: [chat] })

    await waitFor(() => {
      expect(mock.updateApplicationMenu).toHaveBeenLastCalledWith({
        shortcuts: DEFAULT_SHORTCUTS,
        chats: [{ id: 'chat-1', title: 'First chat' }],
      })
    })
  })

  it('opens a recent chat selected from the native menu', async () => {
    await renderHarness()

    act(() => {
      mock.emitApplicationMenuAction({ type: 'openChat', chatId: 'chat-2' })
    })

    await waitFor(() => {
      expect(mock.getChatMessages).toHaveBeenCalledWith('chat-2')
    })
  })

  it('handles sidebar and font commands from the native menu', async () => {
    await renderHarness({ messageFontSize: 18 })

    act(() => {
      mock.emitApplicationMenuAction({ type: 'toggleSidebar' })
      mock.emitApplicationMenuAction({ type: 'increaseMessageFontSize' })
      mock.emitApplicationMenuAction({ type: 'resetMessageFontSize' })
    })

    expect(mock.setSidebarOpen).toHaveBeenCalledWith(true)
    expect(mock.setMessageFontSize).toHaveBeenNthCalledWith(1, 19)
    expect(mock.setMessageFontSize).toHaveBeenNthCalledWith(2, 16)
  })
})
