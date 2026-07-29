import { clsx } from 'clsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppAlert } from '@/components/AppAlert'
import { Chat } from '@/components/Chat'
import { Header } from '@/components/Header'
import { ModelsModal } from '@/components/ModelsModal'
import { SettingsModal } from '@/components/SettingsModal'
import { AlertProvider } from '@/contexts/AlertContext'
import { ChatSettingsProvider } from '@/contexts/ChatSettingsContext'
import {
  LocaleProvider,
  useLocale,
  useTranslation,
} from '@/contexts/LocaleContext'
import { ModalProvider, useModals } from '@/contexts/ModalContext'
import { ModelProvider, useModel } from '@/contexts/ModelContext'
import { ShortcutsProvider, useShortcuts } from '@/contexts/ShortcutsContext'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Sidebar } from '@/ui/Sidebar'

export function App() {
  return (
    <LocaleProvider>
      <AlertProvider>
        <ModalProvider>
          <ModelProvider>
            <ThemeProvider>
              <ChatSettingsProvider>
                <ShortcutsProvider>
                  <AppContent />
                </ShortcutsProvider>
              </ChatSettingsProvider>
            </ThemeProvider>
          </ModelProvider>
        </ModalProvider>
      </AlertProvider>
    </LocaleProvider>
  )
}

function AppContent() {
  const { selectedModel, isReady: isModelReady } = useModel()
  const { isReady: isThemeReady } = useTheme()
  const { isReady: isLocaleReady } = useLocale()
  const { shortcuts } = useShortcuts()
  const { toggleModal } = useModals()
  const { t } = useTranslation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // The main process keeps the window hidden until we confirm the initial state
  // has loaded, so the first visible frame already shows the right model name,
  // theme, and language instead of placeholder values.
  const hasSignaledReady = useRef(false)
  useEffect(() => {
    if (
      isModelReady &&
      isThemeReady &&
      isLocaleReady &&
      !hasSignaledReady.current
    ) {
      hasSignaledReady.current = true
      window.electronApi.notifyAppReady()
    }
  }, [isModelReady, isThemeReady, isLocaleReady])

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((open) => !open)
  }, [])

  useKeyboardShortcuts(shortcuts, {
    toggleSettings: () => toggleModal('settings'),
    toggleModels: () => toggleModal('models'),
    toggleSidebar,
  })

  return (
    <div
      className={clsx(
        'relative flex h-dvh flex-col overflow-hidden',
        'bg-neutral-50 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100',
      )}
    >
      <AppAlert />

      <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
      <div className="flex min-h-0 w-full flex-1">
        <Sidebar isSidebarOpen={isSidebarOpen}>
          <div className="flex h-full flex-col pt-12">
            <div className="px-4 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              {t('sidebar.chats')}
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
