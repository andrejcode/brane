import { useAlert } from '@/contexts/AlertContext'
import { useAppearance } from '@/contexts/AppearanceContext'
import { useTranslation } from '@/contexts/LocaleContext'
import { Switch } from '@/ui/Switch'

export function ContextUsageSettings() {
  const { showAlert } = useAlert()
  const { t } = useTranslation()
  const { showContextUsage, setShowContextUsage } = useAppearance()

  const handleChange = async (enabled: boolean) => {
    try {
      await setShowContextUsage(enabled)
    } catch {
      showAlert(t('appearance.contextUsageSaveFailed'), 'error')
    }
  }

  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex min-w-0 flex-col">
        <p id="context-usage-label">{t('appearance.contextUsage')}</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('appearance.contextUsageDescription')}
        </p>
      </div>
      <Switch
        checked={showContextUsage}
        ariaLabelledBy="context-usage-label"
        onChange={(enabled) => void handleChange(enabled)}
      />
    </div>
  )
}
