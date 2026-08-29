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
  isReady: boolean
  setTheme: (theme: Theme) => Promise<void>
  setMessageFontSize: (fontSize: number) => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme | null>(null)
  const [messageFontSize, setMessageFontSizeState] = useState(
    DEFAULT_MESSAGE_FONT_SIZE,
  )
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadTheme = async () => {
      try {
        const [currentTheme, currentMessageFontSize] = await Promise.all([
          window.electronApi.getTheme(),
          window.electronApi.getMessageFontSize(),
        ])
        if (isMounted) {
          setThemeState(currentTheme)
          setMessageFontSizeState(
            normalizeMessageFontSize(currentMessageFontSize),
          )
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

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--message-font-size',
      `${messageFontSize}px`,
    )

    return () => {
      document.documentElement.style.removeProperty('--message-font-size')
    }
  }, [messageFontSize])

  const value = useMemo(
    () => ({ theme, messageFontSize, isReady, setTheme, setMessageFontSize }),
    [theme, messageFontSize, isReady, setTheme, setMessageFontSize],
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
