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

const PLATFORM_CASES = [
  { name: 'macOS', isMac: true, primaryModifier: 'Meta' },
  { name: 'Windows/Linux', isMac: false, primaryModifier: 'Control' },
] as const

type PlatformCase = (typeof PLATFORM_CASES)[number]

function pressShortcut(
  user: ReturnType<typeof userEvent.setup>,
  platform: PlatformCase,
  key: string,
  { shift = false }: { shift?: boolean } = {},
) {
  const shiftDown = shift ? '{Shift>}' : ''
  const shiftUp = shift ? '{/Shift}' : ''

  return user.keyboard(
    `{${platform.primaryModifier}>}${shiftDown}${key}${shiftUp}{/${platform.primaryModifier}}`,
  )
}

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

describe.each(PLATFORM_CASES)('useKeyboardShortcuts on $name', (platform) => {
  it('stops an active generation with the primary modifier', async () => {
    await renderHarness({ isMac: platform.isMac, isSending: true })

    await pressShortcut(userEvent.setup(), platform, '.')

    expect(mock.stopGeneration).toHaveBeenCalledTimes(1)
  })

  it('does not stop generation while idle', async () => {
    await renderHarness({ isMac: platform.isMac })

    await pressShortcut(userEvent.setup(), platform, '.')

    expect(mock.stopGeneration).not.toHaveBeenCalled()
  })

  it('starts a new chat with the primary modifier', async () => {
    await renderHarness({ isMac: platform.isMac, withMessages: true })

    await waitFor(() => {
      expect(screen.getByTestId('chat-state')).toHaveAttribute(
        'data-message-count',
        '1',
      )
    })

    await pressShortcut(userEvent.setup(), platform, 'n')

    expect(screen.getByTestId('chat-state')).toHaveAttribute(
      'data-message-count',
      '0',
    )
    expect(mock.stopGeneration).toHaveBeenCalledTimes(1)
  })

  it('does nothing when the chat on screen is already new', async () => {
    await renderHarness({ isMac: platform.isMac })

    await pressShortcut(userEvent.setup(), platform, 'n')

    expect(mock.stopGeneration).not.toHaveBeenCalled()
  })

  it('opens the sidebar and focuses chat search', async () => {
    await renderHarness({ isMac: platform.isMac })

    await pressShortcut(userEvent.setup(), platform, 'f')

    expect(screen.getByTestId('chat-state')).toHaveAttribute(
      'data-sidebar-open',
      'true',
    )
    expect(screen.getByRole('textbox', { name: 'Search chats' })).toHaveFocus()
    expect(mock.setSidebarOpen).toHaveBeenCalledWith(true)
  })

  it('toggles the sidebar', async () => {
    await renderHarness({ isMac: platform.isMac })

    await pressShortcut(userEvent.setup(), platform, 'b')

    expect(mock.setSidebarOpen).toHaveBeenCalledWith(true)
  })

  it('opens settings', async () => {
    await renderHarness({ isMac: platform.isMac })

    await pressShortcut(userEvent.setup(), platform, ',')

    expect(screen.getByTestId('chat-state')).toHaveAttribute(
      'data-active-modal',
      'settings',
    )
  })

  it('opens models', async () => {
    await renderHarness({ isMac: platform.isMac })

    await pressShortcut(userEvent.setup(), platform, 'm', { shift: true })

    expect(screen.getByTestId('chat-state')).toHaveAttribute(
      'data-active-modal',
      'models',
    )
  })

  it('blocks main-view shortcuts while a named modal is open', async () => {
    await renderHarness({ isMac: platform.isMac, withMessages: true })
    const user = userEvent.setup()

    await pressShortcut(user, platform, ',')
    await pressShortcut(user, platform, 'n')
    await pressShortcut(user, platform, 'f')

    expect(screen.getByTestId('chat-state')).toHaveAttribute(
      'data-message-count',
      '1',
    )
    expect(screen.getByTestId('chat-state')).toHaveAttribute(
      'data-sidebar-open',
      'false',
    )
  })

  it('blocks main-view shortcuts while a standalone modal is open', async () => {
    const modalRoot = document.createElement('div')
    modalRoot.id = 'modal-root'
    document.body.appendChild(modalRoot)
    await renderHarness({
      isMac: platform.isMac,
      withMessages: true,
      isStandaloneModalOpen: true,
    })

    await pressShortcut(userEvent.setup(), platform, 'n')

    expect(screen.getByTestId('chat-state')).toHaveAttribute(
      'data-message-count',
      '1',
    )
  })

  it.each([
    { key: '+', shiftKey: true, initialSize: 16, expectedSize: 17 },
    { key: '-', shiftKey: false, initialSize: 16, expectedSize: 15 },
    { key: '0', shiftKey: false, initialSize: 20, expectedSize: 16 },
  ])(
    'handles primary modifier+$key message font sizing',
    async ({ key, shiftKey, initialSize, expectedSize }) => {
      await renderHarness({
        isMac: platform.isMac,
        messageFontSize: initialSize,
      })
      const event = new KeyboardEvent('keydown', {
        key,
        metaKey: platform.isMac,
        ctrlKey: !platform.isMac,
        shiftKey,
        cancelable: true,
      })

      window.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(true)
      expect(mock.setMessageFontSize).toHaveBeenCalledWith(expectedSize)
    },
  )
})

describe('useKeyboardShortcuts native menu integration', () => {
  it('blocks main-view commands while a modal is open', async () => {
    await renderHarness()

    await pressShortcut(userEvent.setup(), PLATFORM_CASES[1], ',')

    act(() => {
      mock.emitApplicationMenuAction({ type: 'toggleSidebar' })
    })

    expect(mock.setSidebarOpen).not.toHaveBeenCalled()
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
