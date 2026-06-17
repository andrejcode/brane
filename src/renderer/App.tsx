import { clsx } from 'clsx'
import { useCallback, useState } from 'react'
import { Chat } from './Chat'
import { AlertProvider } from './contexts/AlertContext'
import { ModalProvider } from './contexts/ModalContext'
import { GlobalAlert } from './GlobalAlert'
import { Header } from './Header'
import { SettingsModal } from './SettingsModal'
import { Sidebar } from './ui/Sidebar'

export function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  const openSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(true)
  }, [])

  const closeSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(false)
  }, [])

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((open) => !open)
  }, [])

  return (
    <AlertProvider>
      <ModalProvider>
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
          />
          <div className="flex min-h-0 w-full flex-1">
            <Sidebar isSidebarOpen={isSidebarOpen}>
              <div className="flex h-full flex-col pt-12">
                <div className="px-4 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  Chats
                </div>
              </div>
            </Sidebar>
            <Chat />
          </div>
        </div>

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={closeSettingsModal}
        />
      </ModalProvider>
    </AlertProvider>
  )
}
