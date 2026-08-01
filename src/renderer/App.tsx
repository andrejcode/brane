import { clsx } from 'clsx'
import { useCallback, useState } from 'react'
import { AppAlert } from '@/components/AppAlert'
import { Chat } from '@/components/Chat'
import { Header } from '@/components/Header'
import { ModelsModal } from '@/components/ModelsModal'
import { SettingsModal } from '@/components/SettingsModal'
import { useTranslation } from '@/contexts/LocaleContext'
import { useModals } from '@/contexts/ModalContext'
import { useModel } from '@/contexts/ModelContext'
import { useShortcuts } from '@/contexts/ShortcutsContext'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Sidebar } from '@/ui/Sidebar'
import { useReady } from './hooks/useReady'

export function App() {
  useReady()
  const { selectedModel } = useModel()
  const { shortcuts } = useShortcuts()
  const { toggleModal } = useModals()
  const { t } = useTranslation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
