import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Theme } from '@shared/types'
import {
  DEFAULT_MESSAGE_FONT_SIZE,
  normalizeMessageFontSize,
} from '@shared/types'

interface ThemeContextValue {
  theme: Theme | null
  messageFontSize: number
  showPointerCursor: boolean
  isReady: boolean
  setTheme: (theme: Theme) => Promise<void>
  setMessageFontSize: (fontSize: number) => Promise<void>
  setShowPointerCursor: (enabled: boolean) => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme | null>(null)
  const [messageFontSize, setMessageFontSizeState] = useState(
    DEFAULT_MESSAGE_FONT_SIZE,
  )
  const [showPointerCursor, setShowPointerCursorState] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadTheme = async () => {
      try {
        const [currentTheme, currentMessageFontSize, currentShowPointerCursor] =
          await Promise.all([
            window.electronApi.getTheme(),
            window.electronApi.getMessageFontSize(),
            window.electronApi.getShowPointerCursor(),
          ])
        if (isMounted) {
          setThemeState(currentTheme)
          setMessageFontSizeState(
            normalizeMessageFontSize(currentMessageFontSize),
          )
          setShowPointerCursorState(currentShowPointerCursor)
        }
      } catch {
        if (isMounted) {
          setThemeState('system')
        }
      } finally {
        if (isMounted) {
          setIsReady(true)
        }
      }
    }

    void loadTheme()

    return () => {
      isMounted = false
    }
  }, [])

  const setTheme = useCallback(async (next: Theme) => {
    await window.electronApi.setTheme(next)
    setThemeState(next)
  }, [])

  const setMessageFontSize = useCallback(async (next: number) => {
    const saved = await window.electronApi.setMessageFontSize(next)
    setMessageFontSizeState(normalizeMessageFontSize(saved))
  }, [])

  const setShowPointerCursor = useCallback(async (enabled: boolean) => {
    const saved = await window.electronApi.setShowPointerCursor(enabled)
    setShowPointerCursorState(saved)
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
      theme,
      messageFontSize,
      showPointerCursor,
      isReady,
      setTheme,
      setMessageFontSize,
      setShowPointerCursor,
    }),
    [
      theme,
      messageFontSize,
      showPointerCursor,
      isReady,
      setTheme,
      setMessageFontSize,
      setShowPointerCursor,
    ],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}

export function useTheme() {
  const context = use(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
