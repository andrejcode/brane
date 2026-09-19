import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Theme } from '@shared/types'

interface ThemeContextValue {
  theme: Theme | null
  isReady: boolean
  setTheme: (theme: Theme) => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadTheme = async () => {
      try {
        const currentTheme = await window.electronApi.getTheme()
        if (isMounted) {
          setThemeState(currentTheme)
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

  const value = useMemo(
    () => ({ theme, isReady, setTheme }),
    [theme, isReady, setTheme],
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
