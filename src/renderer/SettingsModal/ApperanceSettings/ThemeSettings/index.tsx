import { useTranslation } from '@/contexts/LocaleContext'
import { useTheme } from '@/contexts/ThemeContext'
import { ThemeButton } from './ThemeButton'

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between">
      <h3>{t('appearance.theme')}</h3>
      <div className="flex overflow-hidden rounded border border-neutral-300 dark:border-neutral-500">
        <ThemeButton
          active={theme === 'dark'}
          onClick={() => void setTheme('dark')}
        >
          {t('appearance.dark')}
        </ThemeButton>
        <ThemeButton
          active={theme === 'light'}
          onClick={() => void setTheme('light')}
        >
          {t('appearance.light')}
        </ThemeButton>
        <ThemeButton
          active={theme === 'system'}
          onClick={() => void setTheme('system')}
          isLast
        >
          {t('appearance.system')}
        </ThemeButton>
      </div>
    </div>
  )
}
