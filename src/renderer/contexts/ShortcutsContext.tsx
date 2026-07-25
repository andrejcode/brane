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

interface ShortcutsContextValue {
  shortcuts: ShortcutMap
  isReady: boolean
  setShortcut: (
    action: ShortcutAction,
    binding: ShortcutBinding,
  ) => Promise<void>
  resetShortcuts: () => Promise<void>
}

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null)

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
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

  const setShortcut = useCallback(
    async (action: ShortcutAction, binding: ShortcutBinding) => {
      const next = { ...shortcutsRef.current, [action]: binding }
      const saved = await window.electronApi.setShortcuts(next)
      setShortcutsState(saved)
    },
    [],
  )

  const resetShortcuts = useCallback(async () => {
    const saved = await window.electronApi.setShortcuts(DEFAULT_SHORTCUTS)
    setShortcutsState(saved)
  }, [])

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
