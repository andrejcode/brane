import { useAlert } from '@/contexts/AlertContext'
import { useAppearance } from '@/contexts/AppearanceContext'
import { useTranslation } from '@/contexts/LocaleContext'
import { Switch } from '@/ui/Switch'

export function MessageDatesSettings() {
  const { showAlert } = useAlert()
  const { showMessageDates, setShowMessageDates } = useAppearance()
  const { t } = useTranslation()

  const handleChange = async (enabled: boolean) => {
    try {
      await setShowMessageDates(enabled)
    } catch {
      showAlert(t('appearance.messageDatesSaveFailed'), 'error')
    }
  }

  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex min-w-0 flex-col">
        <p id="message-dates-label">{t('appearance.messageDates')}</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('appearance.messageDatesDescription')}
        </p>
      </div>
      <Switch
        checked={showMessageDates}
        ariaLabelledBy="message-dates-label"
        onChange={(enabled) => void handleChange(enabled)}
      />
    </div>
  )
}
