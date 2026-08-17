import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

interface SidebarContextValue {
  isSidebarOpen: boolean
  // False until the stored state arrives. Consumers that animate on
  // `isSidebarOpen` hold off until then, so a sidebar restored as open is
  // already open on the first frame instead of sliding in.
  isReady: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

// The sidebar is a cosmetic preference, so a failed write only costs the next
// launch its position and isn't worth interrupting the user over.
async function persistSidebarOpen(isOpen: boolean) {
  try {
    await window.electronApi.setSidebarOpen(isOpen)
  } catch {
    // Keep the sidebar where the user just put it.
  }
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // Mirror the latest value so toggleSidebar stays stable; it feeds the global
  // key listener in useKeyboardShortcuts.
  const isSidebarOpenRef = useRef(isSidebarOpen)

  useEffect(() => {
    let isMounted = true

    const loadSidebarState = async () => {
      const isOpen = await window.electronApi
        .getSidebarOpen()
        .catch(() => false)

      if (!isMounted) {
        return
      }

      isSidebarOpenRef.current = isOpen
      setIsSidebarOpen(isOpen)
      setIsReady(true)
    }

    void loadSidebarState()

    return () => {
      isMounted = false
    }
  }, [])

  const toggleSidebar = useCallback(() => {
    const next = !isSidebarOpenRef.current
    isSidebarOpenRef.current = next
    setIsSidebarOpen(next)
    void persistSidebarOpen(next)
  }, [])

  const value = useMemo(
    () => ({ isSidebarOpen, isReady, toggleSidebar }),
    [isSidebarOpen, isReady, toggleSidebar],
  )

  return <SidebarContext value={value}>{children}</SidebarContext>
}

export function useSidebar() {
  const context = use(SidebarContext)

  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }

  return context
}
