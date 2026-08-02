import { clsx } from 'clsx'
import { AppAlert } from '@/components/AppAlert'
import { AppSidebar } from '@/components/AppSidebar'
import { Chat } from '@/components/Chat'
import { Header } from '@/components/Header'
import { ModelsModal } from '@/components/ModelsModal'
import { SettingsModal } from '@/components/SettingsModal'
import { useModals } from '@/contexts/ModalContext'
import { useModel } from '@/contexts/ModelContext'
import { useShortcuts } from '@/contexts/ShortcutsContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useReady } from './hooks/useReady'

export function App() {
  useReady()
  const { selectedModel } = useModel()
  const { shortcuts } = useShortcuts()
  const { toggleModal } = useModals()
  const { toggleSidebar } = useSidebar()

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

      <Header />
      <div className="flex min-h-0 w-full flex-1">
        <AppSidebar />
        <Chat key={selectedModel ?? 'no-model'} />
      </div>

      <SettingsModal />
      <ModelsModal />
    </div>
  )
}
