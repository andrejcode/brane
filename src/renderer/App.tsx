import { clsx } from 'clsx'
import { useCallback, useState } from 'react'
import { Chat } from './Chat'
import { AlertProvider } from './contexts/AlertContext'
import { ModalProvider } from './contexts/ModalContext'
import { ModelProvider, useModel } from './contexts/ModelContext'
import { GlobalAlert } from './GlobalAlert'
import { Header } from './Header'
import { ModelsModal } from './ModelsModal'
import { SettingsModal } from './SettingsModal'
import { Sidebar } from './ui/Sidebar'

export function App() {
  return (
    <AlertProvider>
      <ModalProvider>
        <ModelProvider>
          <AppContent />
        </ModelProvider>
      </ModalProvider>
    </AlertProvider>
  )
}

function AppContent() {
  const { selectedModel } = useModel()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isModelModalOpen, setIsModelModalOpen] = useState(false)

  // Only one modal should be open at a time, so opening one closes the other.
  const openSettingsModal = useCallback(() => {
    setIsModelModalOpen(false)
    setIsSettingsModalOpen(true)
  }, [])

  const closeSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(false)
  }, [])

  const openModelModal = useCallback(() => {
    setIsSettingsModalOpen(false)
    setIsModelModalOpen(true)
  }, [])

  const closeModelModal = useCallback(() => {
    setIsModelModalOpen(false)
  }, [])

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((open) => !open)
  }, [])

  return (
    <div
      className={clsx(
        'relative flex h-dvh flex-col overflow-hidden',
        'bg-neutral-50 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100',
      )}
    >
      <GlobalAlert />

      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        openSettingsModal={openSettingsModal}
        openModelModal={openModelModal}
      />
      <div className="flex min-h-0 w-full flex-1">
        <Sidebar isSidebarOpen={isSidebarOpen}>
          <div className="flex h-full flex-col pt-12">
            <div className="px-4 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Chats
            </div>
          </div>
        </Sidebar>
        {/* Keying Chat by the selected model starts a fresh chat (clearing
            messages) whenever the user switches models. */}
        <Chat key={selectedModel ?? 'no-model'} />
      </div>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={closeSettingsModal}
      />
      <ModelsModal isOpen={isModelModalOpen} onClose={closeModelModal} />
    </div>
  )
}
