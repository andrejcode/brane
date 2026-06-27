import { clsx } from 'clsx'
import {
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useModals } from '../contexts/ModalContext'
import { useModel } from '../contexts/ModelContext'
import { GhostButton } from '../ui/GhostButton'
import { formatModelName } from '../utils/formatModelName'

interface HeaderProps {
  isSidebarOpen?: boolean
  onToggleSidebar?: () => void
}

// On macOS the title bar is hidden, so we use this header component as a replacement
// Also icons are positioned differently on macOS because of the traffic lights
export function Header({ isSidebarOpen, onToggleSidebar }: HeaderProps) {
  const isMac = window.electronApi.isMac
  const { openModal } = useModals()
  const { selectedModel } = useModel()
  const selectedModelLabel = selectedModel
    ? formatModelName(selectedModel)
    : 'Select model'
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
          'pointer-events-none absolute inset-y-0 right-0',
          'transition-[left] duration-500 ease-in-out',
          isSidebarOpen ? 'left-80' : 'left-0',
          'bg-neutral-50/1 dark:bg-neutral-800/1',
          'backdrop-blur-[3px]',
          'mask-[linear-gradient(to_bottom,black_0%,black_55%,transparent_100%)]',
        )}
      />

      <div
        className={clsx(
          'relative z-10 flex h-full items-center justify-between mr-4 transition-[margin-left] duration-200 ease-out',
          isMac && !isFullScreen ? 'ml-24' : 'ml-4',
        )}
      >
        <GhostButton
          title="Toggle sidebar"
          ariaLabel="Toggle sidebar"
          onClick={onToggleSidebar}
        >
          {isSidebarOpen ? (
            <PanelLeftClose size={20} />
          ) : (
            <PanelLeftOpen size={20} />
          )}
        </GhostButton>
        <div className="flex items-center gap-3">
          <GhostButton
            className="flex items-center gap-0.5 px-2"
            title={selectedModelLabel}
            ariaLabel="Select model"
            onClick={() => openModal('models')}
          >
            <span className="max-w-64 truncate">{selectedModelLabel}</span>
            <ChevronRight size={18} className="shrink-0" />
          </GhostButton>

          <GhostButton
            title="Open settings"
            ariaLabel="Open settings"
            onClick={() => openModal('settings')}
          >
            <Settings size={20} />
          </GhostButton>
        </div>
      </div>
    </header>
  )
}
