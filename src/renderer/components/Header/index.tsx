import { clsx } from 'clsx'
import {
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  SquarePen,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { useTranslation } from '@/contexts/LocaleContext'
import { useModals } from '@/contexts/ModalContext'
import { useShortcuts } from '@/contexts/ShortcutsContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { GhostButton } from '@/ui/buttons/GhostButton'
import { ShortcutTooltip } from '@/ui/ShortcutTooltip'
import { formatShortcut } from '@/utils'
import { ModelButton } from './ModelButton'

// On macOS the title bar is hidden, so we use this header component as a replacement
// Also icons are positioned differently on macOS because of the traffic lights
export function Header() {
  const isMac = window.electronApi.isMac
  const { openModal } = useModals()
  const { startNewChat } = useChat()
  const { shortcuts } = useShortcuts()
  const { isSidebarOpen, isReady: isSidebarReady, toggleSidebar } = useSidebar()
  const { t } = useTranslation()
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
      {isSidebarReady ? (
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
      ) : null}

      <div
        className={clsx(
          'relative z-10 flex h-full items-center justify-between mr-4 transition-[margin-left] duration-200 ease-out',
          isMac && !isFullScreen ? 'ml-24' : 'ml-4',
        )}
      >
        <div className="flex items-center gap-3">
          <GhostButton
            tooltip={
              <ShortcutTooltip
                label={t('header.toggleSidebar')}
                shortcut={formatShortcut(shortcuts.toggleSidebar, isMac)}
              />
            }
            ariaLabel={t('header.toggleSidebar')}
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? (
              <PanelLeftClose size={20} />
            ) : (
              <PanelLeftOpen size={20} />
            )}
          </GhostButton>

          <span
            aria-hidden={isSidebarOpen}
            className={clsx(
              'transition-opacity duration-200 ease-out',
              isSidebarOpen ? 'pointer-events-none opacity-0' : 'opacity-100',
            )}
          >
            <GhostButton
              tooltip={
                <ShortcutTooltip
                  label={t('chat.newChat')}
                  shortcut={formatShortcut(shortcuts.newChat, isMac)}
                />
              }
              ariaLabel={t('chat.newChat')}
              tabIndex={isSidebarOpen ? -1 : undefined}
              onClick={startNewChat}
            >
              <SquarePen size={20} />
            </GhostButton>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ModelButton />

          <GhostButton
            tooltip={
              <ShortcutTooltip
                label={t('header.openSettings')}
                shortcut={formatShortcut(shortcuts.toggleSettings, isMac)}
              />
            }
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
