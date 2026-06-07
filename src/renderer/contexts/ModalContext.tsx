import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

interface ModalContextValue {
  openModalCount: number
  registerModal: () => () => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [openModalCount, setOpenModalCount] = useState(0)

  const registerModal = useCallback(() => {
    setOpenModalCount((count) => count + 1)
    return () => setOpenModalCount((count) => count - 1)
  }, [])

  const value = useMemo(
    () => ({ openModalCount, registerModal }),
    [openModalCount, registerModal],
  )

  return <ModalContext value={value}>{children}</ModalContext>
}

// Tracks an open modal in the shared context for the duration it is open, so
// the rest of the app (e.g. the chat input) can react to modals globally.
export function useTrackModalOpen(isOpen: boolean) {
  const context = use(ModalContext)

  useEffect(() => {
    if (!context || !isOpen) {
      return
    }

    return context.registerModal()
  }, [context, isOpen])
}

export function useIsAnyModalOpen() {
  const context = use(ModalContext)

  return context ? context.openModalCount > 0 : false
}
