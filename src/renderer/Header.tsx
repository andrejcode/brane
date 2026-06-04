import { clsx } from 'clsx'
import { ChevronDown, Settings, Sidebar } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from './ui/Button'

// On macOS the title bar is hidden, so we use this header component as a replacement
// Also icons are positioned differently on macOS because of the traffic lights
export function Header() {
  const isMac = window.electronApi.isMac
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
          'pointer-events-none absolute inset-0',
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
        <div className="flex items-center gap-2">
          <Button
            className="[app-region:no-drag]"
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
          >
            <Sidebar size={20} />
          </Button>

          <Button
            className="[app-region:no-drag] flex items-center gap-0.5 px-2"
            title="Select model"
            aria-label="Select model"
          >
            Select model
            <ChevronDown size={18} />
          </Button>
        </div>
        <Button
          className="[app-region:no-drag]"
          title="Open settings"
          aria-label="Open settings"
        >
          <Settings size={20} />
        </Button>
      </div>
    </header>
  )
}
