import { useCallback, useEffect, useRef } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { useModals } from '@/contexts/ModalContext'
import { useShortcuts } from '@/contexts/ShortcutsContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { matchesBinding } from '@/utils'
import { SHORTCUT_ACTIONS, type ShortcutAction } from '@shared/types'

type ShortcutHandlers = Record<ShortcutAction, () => void>

// Handlers are kept in a ref so changing them (they are recreated on every
// render) never re-attaches the window listener.
export function useKeyboardShortcuts() {
  const { shortcuts } = useShortcuts()
  const { toggleModal } = useModals()
  const { toggleSidebar } = useSidebar()
  const { isSending, startNewChat } = useChat()

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
  }, [shortcuts])
}
