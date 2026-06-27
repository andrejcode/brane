import { clsx } from 'clsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Chat } from './Chat'
import { AlertProvider } from './contexts/AlertContext'
import { ModalProvider } from './contexts/ModalContext'
import { ModelProvider, useModel } from './contexts/ModelContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
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
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </ModelProvider>
      </ModalProvider>
    </AlertProvider>
  )
}

function AppContent() {
  const { selectedModel, isReady: isModelReady } = useModel()
  const { isReady: isThemeReady } = useTheme()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // The main process keeps the window hidden until we confirm the initial state
  // has loaded, so the first visible frame already shows the right model name
  // and theme instead of placeholder values.
  const hasSignaledReady = useRef(false)
  useEffect(() => {
    if (isModelReady && isThemeReady && !hasSignaledReady.current) {
      hasSignaledReady.current = true
      window.electronApi.notifyAppReady()
    }
  }, [isModelReady, isThemeReady])

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

      <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
      <div className="flex min-h-0 w-full flex-1">
        <Sidebar isSidebarOpen={isSidebarOpen}>
          <div className="flex h-full flex-col pt-12">
            <div className="px-4 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Chats
            </div>
          </div>
        </Sidebar>
        <Chat key={selectedModel ?? 'no-model'} />
      </div>

      <SettingsModal />
      <ModelsModal />
    </div>
  )
}
