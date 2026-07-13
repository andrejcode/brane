import { useEffect, useState } from 'react'

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)'

// Theme selection flows through Electron's nativeTheme, which surfaces to the
// renderer as `prefers-color-scheme`, so we read the resolved scheme here rather
// than the stored 'light' | 'dark' | 'system' preference.
export function useColorScheme() {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia(DARK_SCHEME_QUERY).matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(DARK_SCHEME_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDark(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return isDark
}
