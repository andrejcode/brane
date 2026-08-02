import { useEffect, useRef } from 'react'
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

  const handlersRef = useRef<ShortcutHandlers>({
    toggleSettings: () => toggleModal('settings'),
    toggleModels: () => toggleModal('models'),
    toggleSidebar,
  })
  useEffect(() => {
    handlersRef.current = {
      toggleSettings: () => toggleModal('settings'),
      toggleModels: () => toggleModal('models'),
      toggleSidebar,
    }
  }, [toggleModal, toggleSidebar])

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
