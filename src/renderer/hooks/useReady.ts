import { useEffect, useRef } from 'react'
import { useChatSettings } from '@/contexts/ChatSettingsContext'
import { useLocale } from '@/contexts/LocaleContext'
import { useModel } from '@/contexts/ModelContext'
import { useShortcuts } from '@/contexts/ShortcutsContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { useTheme } from '@/contexts/ThemeContext'

export function useReady() {
  const { isReady: isModelReady } = useModel()
  const { isReady: isThemeReady } = useTheme()
  const { isReady: isLocaleReady } = useLocale()
  const { isReady: isChatSettingsReady } = useChatSettings()
  const { isReady: isShortcutsReady } = useShortcuts()
  const { isReady: isSidebarReady } = useSidebar()

  // The main process keeps the window hidden until we confirm the initial state
  // has loaded, so the first visible frame already shows the right model name,
  // theme, and language instead of placeholder values.
  const hasSignaledReady = useRef(false)
  useEffect(() => {
    if (
      isModelReady &&
      isThemeReady &&
      isLocaleReady &&
      isChatSettingsReady &&
      isShortcutsReady &&
      isSidebarReady &&
      !hasSignaledReady.current
    ) {
      hasSignaledReady.current = true
      window.electronApi.notifyAppReady()
    }
  }, [
    isModelReady,
    isThemeReady,
    isLocaleReady,
    isChatSettingsReady,
    isShortcutsReady,
    isSidebarReady,
  ])
}
