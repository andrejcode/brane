import { createContext, use, useCallback, useMemo, useState } from 'react'

export type ModalName = 'settings' | 'models'

interface ModalContextValue {
  activeModal: ModalName | null
  openModal: (modal: ModalName) => void
  closeModal: () => void
  toggleModal: (modal: ModalName) => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

export function ModalProvider({ children }: { children: React.ReactNode }) {
  // Only a single modal can be open at a time, so tracking the active one (or null)
  // inherently prevents two modals from showing at once.
  const [activeModal, setActiveModal] = useState<ModalName | null>(null)

  const openModal = useCallback((modal: ModalName) => {
    setActiveModal(modal)
  }, [])

  const closeModal = useCallback(() => {
    setActiveModal(null)
  }, [])

  const toggleModal = useCallback((modal: ModalName) => {
    setActiveModal((current) => (current === modal ? null : modal))
  }, [])

  const value = useMemo(
    () => ({ activeModal, openModal, closeModal, toggleModal }),
    [activeModal, openModal, closeModal, toggleModal],
  )

  return <ModalContext value={value}>{children}</ModalContext>
}

export function useModals() {
  const context = use(ModalContext)

  if (!context) {
    throw new Error('useModals must be used within a ModalProvider')
  }

  return context
}

export function useIsAnyModalOpen() {
  const context = use(ModalContext)

  return context ? context.activeModal !== null : false
}
