import { useCallback, useEffect, useRef } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { useTranslation } from '@/contexts/LocaleContext'
import { useModals } from '@/contexts/ModalContext'
import { useShortcuts } from '@/contexts/ShortcutsContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { useTheme } from '@/contexts/ThemeContext'
import { matchesBinding } from '@/utils'
import {
  DEFAULT_MESSAGE_FONT_SIZE,
  normalizeMessageFontSize,
  SHORTCUT_ACTIONS,
  type ShortcutAction,
} from '@shared/types'

type ShortcutHandlers = Record<ShortcutAction, () => void>

// Handlers are kept in a ref so changing them (they are recreated on every
// render) never re-attaches the window listener.
export function useKeyboardShortcuts() {
  const { shortcuts } = useShortcuts()
  const { toggleModal } = useModals()
  const { toggleSidebar } = useSidebar()
  const { chats, isSending, openChat, startNewChat } = useChat()
  const { messageFontSize, setMessageFontSize } = useTheme()
  const { t } = useTranslation()
  const messageFontSizeRef = useRef(messageFontSize)

  useEffect(() => {
    messageFontSizeRef.current = messageFontSize
  }, [messageFontSize])

  const setNextMessageFontSize = useCallback(
    (fontSize: number) => {
      const normalizedFontSize = normalizeMessageFontSize(fontSize)
      messageFontSizeRef.current = normalizedFontSize
      void setMessageFontSize(normalizedFontSize)
    },
    [setMessageFontSize],
  )

  const stopGeneration = useCallback(() => {
    if (isSending) {
      void window.electronApi.stopGeneration()
    }
  }, [isSending])

  const handlersRef = useRef<ShortcutHandlers>({
    toggleSettings: () => toggleModal('settings'),
    toggleModels: () => toggleModal('models'),
    toggleSidebar,
    newChat: startNewChat,
    stopGeneration,
  })
  useEffect(() => {
    handlersRef.current = {
      toggleSettings: () => toggleModal('settings'),
      toggleModels: () => toggleModal('models'),
      toggleSidebar,
      newChat: startNewChat,
      stopGeneration,
    }
  }, [toggleModal, toggleSidebar, startNewChat, stopGeneration])

  useEffect(() => {
    const isMac = window.electronApi.isMac

    const handleKeyDown = (event: KeyboardEvent) => {
      const primaryModifier = isMac ? event.metaKey : event.ctrlKey
      const crossModifier = isMac ? event.ctrlKey : event.metaKey

      if (primaryModifier && !crossModifier && !event.altKey) {
        if (event.key === '+' || event.key === '=') {
          event.preventDefault()
          setNextMessageFontSize(messageFontSizeRef.current + 1)
          return
        }

        if (event.key === '-') {
          event.preventDefault()
          setNextMessageFontSize(messageFontSizeRef.current - 1)
          return
        }

        if (event.key === '0' && !event.shiftKey) {
          event.preventDefault()
          setNextMessageFontSize(DEFAULT_MESSAGE_FONT_SIZE)
          return
        }
      }

      for (const action of SHORTCUT_ACTIONS) {
        if (matchesBinding(event, shortcuts[action], isMac)) {
          event.preventDefault()
          handlersRef.current[action]()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, setNextMessageFontSize])

  useEffect(() => {
    void window.electronApi
      .updateApplicationMenu({
        shortcuts,
        chats: chats.slice(0, 9).map((chat) => ({
          id: chat.id,
          title: chat.title ?? t('sidebar.untitledChat'),
        })),
      })
      .catch(() => undefined)
  }, [chats, shortcuts, t])

  useEffect(() => {
    return window.electronApi.onApplicationMenuAction((action) => {
      switch (action.type) {
        case 'newChat':
          startNewChat()
          break
        case 'toggleSidebar':
          toggleSidebar()
          break
        case 'increaseMessageFontSize':
          setNextMessageFontSize(messageFontSizeRef.current + 1)
          break
        case 'decreaseMessageFontSize':
          setNextMessageFontSize(messageFontSizeRef.current - 1)
          break
        case 'resetMessageFontSize':
          setNextMessageFontSize(DEFAULT_MESSAGE_FONT_SIZE)
          break
        case 'openChat':
          void openChat(action.chatId)
          break
      }
    })
  }, [openChat, setNextMessageFontSize, startNewChat, toggleSidebar])
}
