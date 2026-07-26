import { useEffect, useRef } from 'react'
import {
  SHORTCUT_ACTIONS,
  type ShortcutAction,
  type ShortcutMap,
} from '@shared/types'
import { matchesBinding } from '../utils'

type ShortcutHandlers = Record<ShortcutAction, () => void>

// Handlers are kept in a ref so changing them (they are recreated on every
// render) never re-attaches the window listener.
export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  handlers: ShortcutHandlers,
) {
  const handlersRef = useRef(handlers)
  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

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
