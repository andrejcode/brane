import { useAlert } from '@/contexts/AlertContext'
import { useTranslation } from '@/contexts/LocaleContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Switch } from '@/ui/Switch'

export function PointerCursorSettings() {
  const { showAlert } = useAlert()
  const { t } = useTranslation()
  const { showPointerCursor, setShowPointerCursor } = useTheme()

  const handleChange = async (enabled: boolean) => {
    try {
      await setShowPointerCursor(enabled)
    } catch {
      showAlert(t('appearance.pointerCursorSaveFailed'), 'error')
    }
  }

  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex min-w-0 flex-col">
        <p id="pointer-cursor-label">{t('appearance.pointerCursor')}</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('appearance.pointerCursorDescription')}
        </p>
      </div>
      <Switch
        checked={showPointerCursor}
        ariaLabelledBy="pointer-cursor-label"
        onChange={(enabled) => void handleChange(enabled)}
      />
    </div>
  )
}
