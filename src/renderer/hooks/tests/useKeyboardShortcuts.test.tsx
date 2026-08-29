import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { AlertProvider } from '@/contexts/AlertContext'
import { ChatProvider, useChat } from '@/contexts/ChatContext'
import { ModalProvider, useModals } from '@/contexts/ModalContext'
import { ShortcutsProvider } from '@/contexts/ShortcutsContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
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
}

// Seeds chat state so shortcuts can exercise generation and conversation actions.
function ShortcutsHarness({ withMessages, isSending }: ShortcutsHarnessProps) {
  useKeyboardShortcuts()
  const { messages, setMessages, setIsSending } = useChat()
  const { activeModal } = useModals()

  useEffect(() => {
    if (withMessages) {
      setMessages([{ id: 'user-1', role: 'user', content: 'hi' }])
    }
    setIsSending(isSending)
  }, [isSending, withMessages, setIsSending, setMessages])

  return (
    <div
      data-testid="chat-state"
      data-message-count={messages.length}
      data-active-modal={activeModal ?? 'none'}
    />
  )
}

async function renderHarness({
  isMac = false,
  withMessages = false,
  isSending = false,
  messageFontSize = 16,
  chats = [],
}: {
  isMac?: boolean
  withMessages?: boolean
  isSending?: boolean
  messageFontSize?: number
  chats?: ChatSummary[]
} = {}) {
  mock = installMockElectronApi({ isMac, messageFontSize, chats })

  const result = render(
    <AlertProvider>
      <ModalProvider>
        <ThemeProvider>
          <ShortcutsProvider>
            <SidebarProvider>
              <ChatProvider>
                <ShortcutsHarness
                  withMessages={withMessages}
                  isSending={isSending}
                />
              </ChatProvider>
            </SidebarProvider>
          </ShortcutsProvider>
        </ThemeProvider>
      </ModalProvider>
    </AlertProvider>,
  )

  await waitFor(() => {
    expect(mock.updateApplicationMenu).toHaveBeenCalled()
    expect(mock.getTheme).toHaveBeenCalled()
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
