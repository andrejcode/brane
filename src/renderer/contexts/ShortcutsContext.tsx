import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  DEFAULT_SHORTCUTS,
  type ShortcutAction,
  type ShortcutBinding,
  type ShortcutMap,
} from '@shared/types'
import { useAlert } from './AlertContext'
import { useTranslation } from './LocaleContext'

interface ShortcutsContextValue {
  shortcuts: ShortcutMap
  isReady: boolean
  // Both mutators report a failed save themselves and resolve to whether the
  // new bindings reached the store, so callers only have to react to the outcome.
  setShortcut: (
    action: ShortcutAction,
    binding: ShortcutBinding,
  ) => Promise<boolean>
  resetShortcuts: () => Promise<boolean>
}

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null)

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const { showAlert } = useAlert()
  const { t } = useTranslation()
  const [shortcuts, setShortcutsState] =
    useState<ShortcutMap>(DEFAULT_SHORTCUTS)
  const [isReady, setIsReady] = useState(false)

  // Mirror the latest map so setShortcut can build the next map without adding
  // the state to the callback's dependencies (which would recreate it on every
  // change and churn the global key listener downstream).
  const shortcutsRef = useRef(shortcuts)
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  useEffect(() => {
    let isMounted = true

    const loadShortcuts = async () => {
      try {
        const stored = await window.electronApi.getShortcuts()
        if (isMounted) {
          setShortcutsState(stored)
        }
      } catch {
        if (isMounted) {
          setShortcutsState(DEFAULT_SHORTCUTS)
        }
      } finally {
        if (isMounted) {
          setIsReady(true)
        }
      }
    }

    void loadShortcuts()

    return () => {
      isMounted = false
    }
  }, [])

  // State follows the store rather than the request, so a rejected save leaves
  // the bindings on screen matching what is actually persisted.
  const setShortcut = useCallback(
    async (action: ShortcutAction, binding: ShortcutBinding) => {
      const next = { ...shortcutsRef.current, [action]: binding }

      try {
        setShortcutsState(await window.electronApi.setShortcuts(next))
        return true
      } catch {
        showAlert(t('shortcuts.saveFailed'), 'error')
        return false
      }
    },
    [showAlert, t],
  )

  const resetShortcuts = useCallback(async () => {
    try {
      setShortcutsState(
        await window.electronApi.setShortcuts(DEFAULT_SHORTCUTS),
      )
      return true
    } catch {
      showAlert(t('shortcuts.resetFailed'), 'error')
      return false
    }
  }, [showAlert, t])

  const value = useMemo(
    () => ({ shortcuts, isReady, setShortcut, resetShortcuts }),
    [shortcuts, isReady, setShortcut, resetShortcuts],
  )

  return <ShortcutsContext value={value}>{children}</ShortcutsContext>
}

export function useShortcuts() {
  const context = use(ShortcutsContext)

  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutsProvider')
  }

  return context
}
