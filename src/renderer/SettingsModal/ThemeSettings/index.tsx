import { useEffect, useState } from 'react'
import type { Theme } from '@shared/types'
import { ThemeButton } from './ThemeButton'

export function ThemeSettings() {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const currentTheme = await window.electronApi.getTheme()
        setTheme(currentTheme)
      } catch {
        setTheme('system')
      }
    }

    void fetchTheme()
  }, [])

  const handleSetTheme = async (theme: Theme) => {
    await window.electronApi.setTheme(theme)
    setTheme(theme)
  }

  return (
    <div className="flex items-center justify-between">
      <h3>Theme</h3>
      <div className="flex overflow-hidden rounded border border-neutral-300 dark:border-neutral-500">
        <ThemeButton
          active={theme === 'dark'}
          onClick={() => void handleSetTheme('dark')}
        >
          Dark
        </ThemeButton>
        <ThemeButton
          active={theme === 'light'}
          onClick={() => void handleSetTheme('light')}
        >
          Light
        </ThemeButton>
        <ThemeButton
          active={theme === 'system'}
          onClick={() => void handleSetTheme('system')}
          isLast
        >
          System
        </ThemeButton>
      </div>
    </div>
  )
}
