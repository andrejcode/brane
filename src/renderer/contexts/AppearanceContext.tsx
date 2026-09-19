import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  DEFAULT_MESSAGE_FONT_SIZE,
  normalizeMessageFontSize,
} from '@shared/types'

interface AppearanceContextValue {
  messageFontSize: number
  showPointerCursor: boolean
  showContextUsage: boolean
  isReady: boolean
  setMessageFontSize: (fontSize: number) => Promise<void>
  setShowPointerCursor: (enabled: boolean) => Promise<void>
  setShowContextUsage: (enabled: boolean) => Promise<void>
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

export function AppearanceProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [messageFontSize, setMessageFontSizeState] = useState(
    DEFAULT_MESSAGE_FONT_SIZE,
  )
  const [showPointerCursor, setShowPointerCursorState] = useState(false)
  const [showContextUsage, setShowContextUsageState] = useState(true)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadAppearance = async () => {
      try {
        const [
          currentMessageFontSize,
          currentShowPointerCursor,
          currentShowContextUsage,
        ] = await Promise.all([
          window.electronApi.getMessageFontSize(),
          window.electronApi.getShowPointerCursor(),
          window.electronApi.getShowContextUsage(),
        ])

        if (isMounted) {
          setMessageFontSizeState(
            normalizeMessageFontSize(currentMessageFontSize),
          )
          setShowPointerCursorState(currentShowPointerCursor)
          setShowContextUsageState(currentShowContextUsage)
        }
      } finally {
        if (isMounted) {
          setIsReady(true)
        }
      }
    }

    void loadAppearance()

    return () => {
      isMounted = false
    }
  }, [])

  const setMessageFontSize = useCallback(async (next: number) => {
    const saved = await window.electronApi.setMessageFontSize(next)
    setMessageFontSizeState(normalizeMessageFontSize(saved))
  }, [])

  const setShowPointerCursor = useCallback(async (enabled: boolean) => {
    const saved = await window.electronApi.setShowPointerCursor(enabled)
    setShowPointerCursorState(saved)
  }, [])

  const setShowContextUsage = useCallback(async (enabled: boolean) => {
    const saved = await window.electronApi.setShowContextUsage(enabled)
    setShowContextUsageState(saved)
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--message-font-size',
      `${messageFontSize}px`,
    )

    return () => {
      document.documentElement.style.removeProperty('--message-font-size')
    }
  }, [messageFontSize])

  useEffect(() => {
    document.documentElement.classList.toggle(
      'show-pointer-cursor',
      showPointerCursor,
    )

    return () => {
      document.documentElement.classList.remove('show-pointer-cursor')
    }
  }, [showPointerCursor])

  const value = useMemo(
    () => ({
      messageFontSize,
      showPointerCursor,
      showContextUsage,
      isReady,
      setMessageFontSize,
      setShowPointerCursor,
      setShowContextUsage,
    }),
    [
      messageFontSize,
      showPointerCursor,
      showContextUsage,
      isReady,
      setMessageFontSize,
      setShowPointerCursor,
      setShowContextUsage,
    ],
  )

  return <AppearanceContext value={value}>{children}</AppearanceContext>
}

export function useAppearance() {
  const context = use(AppearanceContext)

  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider')
  }

  return context
}
