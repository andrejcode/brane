import { clsx } from 'clsx'
import {
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { useTranslation } from '@/contexts/LocaleContext'
import { useModals } from '@/contexts/ModalContext'
import { useModel } from '@/contexts/ModelContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { GhostButton } from '@/ui/buttons/GhostButton'
import { LoadingSpinner } from '@/ui/LoadingSpinner'
import { formatModelName } from '@/utils'

// On macOS the title bar is hidden, so we use this header component as a replacement
// Also icons are positioned differently on macOS because of the traffic lights
export function Header() {
  const isMac = window.electronApi.isMac
  const { openModal } = useModals()
  const { startNewChat } = useChat()
  const { loadedModel, loadingModel } = useModel()
  const { isSidebarOpen, toggleSidebar } = useSidebar()
  const { t } = useTranslation()
  const isLoadingModel = loadingModel !== null
  // Reflect what's actually loaded, not just selected: a model that was picked
  // but never finished loading (canceled or failed) shouldn't show its name.
  const modelLabel = loadedModel
    ? formatModelName(loadedModel)
    : t('header.selectModel')
  const [isFullScreen, setIsFullScreen] = useState(false)

  useEffect(() => {
    if (!isMac) {
      return
    }

    let isMounted = true

    void window.electronApi.getIsFullScreen().then((currentIsFullScreen) => {
      if (isMounted) {
        setIsFullScreen(currentIsFullScreen)
      }
    })

    const unsubscribe = window.electronApi.onFullScreenChange(setIsFullScreen)

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [isMac])

  return (
    <header
      className={clsx('absolute inset-x-0 top-0 z-30 h-12 [app-region:drag]')}
    >
      <div
        className={clsx(
          // Offset the blur so it never covers the sidebar, which has its own background
          'pointer-events-none absolute top-0 right-0 h-14',
          'transition-[left] duration-500 ease-in-out',
          isSidebarOpen ? 'left-80' : 'left-0',
          'bg-neutral-50/1 dark:bg-neutral-800/1',
        )}
      >
        {/* Progressive blur: each layer adds a stronger blur masked toward the top,
            so text is heavily blurred at the top of the header and fades to sharp at the bottom */}
        <div className="absolute inset-0 backdrop-blur-[1.6px] mask-[linear-gradient(to_bottom,black_0%,black_70%,transparent_100%)]" />
        <div className="absolute inset-0 backdrop-blur-[2px] mask-[linear-gradient(to_bottom,black_0%,black_35%,transparent_70%)]" />
        <div className="absolute inset-0 backdrop-blur-xs mask-[linear-gradient(to_bottom,black_0%,black_15%,transparent_45%)]" />
      </div>

      <div
        className={clsx(
          'relative z-10 flex h-full items-center justify-between mr-4 transition-[margin-left] duration-200 ease-out',
          isMac && !isFullScreen ? 'ml-24' : 'ml-4',
        )}
      >
        <div className="flex items-center gap-3">
          <GhostButton
            title={t('header.toggleSidebar')}
            ariaLabel={t('header.toggleSidebar')}
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? (
              <PanelLeftClose size={20} />
            ) : (
              <PanelLeftOpen size={20} />
            )}
          </GhostButton>

          <GhostButton
            title={t('header.newChat')}
            ariaLabel={t('header.newChat')}
            onClick={startNewChat}
          >
            <Plus size={20} />
          </GhostButton>
        </div>

        <div className="flex items-center gap-3">
          <GhostButton
            className="flex items-center gap-0.5 px-2"
            title={isLoadingModel ? t('header.loadingModel') : modelLabel}
            ariaLabel={t('header.selectModel')}
            onClick={() => openModal('models')}
          >
            {isLoadingModel ? (
              <LoadingSpinner isLoading size={20} />
            ) : (
              <span className="max-w-64 truncate">{modelLabel}</span>
            )}
            <ChevronRight size={18} className="shrink-0" />
          </GhostButton>

          <GhostButton
            title={t('header.openSettings')}
            ariaLabel={t('header.openSettings')}
            onClick={() => openModal('settings')}
          >
            <Settings size={20} />
          </GhostButton>
        </div>
      </div>
    </header>
  )
}
