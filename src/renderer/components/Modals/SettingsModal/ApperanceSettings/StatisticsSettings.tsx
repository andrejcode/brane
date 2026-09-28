import { useAlert } from '@/contexts/AlertContext'
import { useAppearance } from '@/contexts/AppearanceContext'
import { useTranslation } from '@/contexts/LocaleContext'
import { Switch } from '@/ui/Switch'

export function StatisticsSettings() {
  const { showAlert } = useAlert()
  const { t } = useTranslation()
  const { showStatistics, setShowStatistics } = useAppearance()

  const handleChange = async (enabled: boolean) => {
    try {
      await setShowStatistics(enabled)
    } catch {
      showAlert(t('appearance.statisticsSaveFailed'), 'error')
    }
  }

  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex min-w-0 flex-col">
        <p id="statistics-label">{t('appearance.statistics')}</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('appearance.statisticsDescription')}
        </p>
      </div>
      <Switch
        checked={showStatistics}
        ariaLabelledBy="statistics-label"
        onChange={(enabled) => void handleChange(enabled)}
      />
    </div>
  )
}
