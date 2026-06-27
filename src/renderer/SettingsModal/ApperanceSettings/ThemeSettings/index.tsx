import { useTheme } from '@/contexts/ThemeContext'
import { ThemeButton } from './ThemeButton'

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center justify-between">
      <h3>Theme</h3>
      <div className="flex overflow-hidden rounded border border-neutral-300 dark:border-neutral-500">
        <ThemeButton
          active={theme === 'dark'}
          onClick={() => void setTheme('dark')}
        >
          Dark
        </ThemeButton>
        <ThemeButton
          active={theme === 'light'}
          onClick={() => void setTheme('light')}
        >
          Light
        </ThemeButton>
        <ThemeButton
          active={theme === 'system'}
          onClick={() => void setTheme('system')}
          isLast
        >
          System
        </ThemeButton>
      </div>
    </div>
  )
}
