import { useChatSettings } from '@/contexts/ChatSettingsContext'
import { useLocale, useTranslation } from '@/contexts/LocaleContext'
import { LOCALE_OPTIONS } from '@/i18n'
import { Button } from '@/ui/buttons/Button'
import { Select } from '@/ui/Select'
import { Switch } from '@/ui/Switch'
import type { Locale } from '@shared/types'

const LANGUAGE_OPTIONS = LOCALE_OPTIONS.map((option) => ({
  value: option.id,
  label: option.label,
}))

export function GeneralSettings() {
  const { sendWithModifierEnter, setSendWithModifierEnter } = useChatSettings()
  const { locale, setLocale } = useLocale()
  const { t } = useTranslation()

  const sendShortcut = window.electronApi.isMac ? '⌘' : 'Ctrl'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <h4 id="send-with-modifier-enter-label">
            {t('general.sendWith', { shortcut: sendShortcut })}
          </h4>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('general.sendWithDescription', { shortcut: sendShortcut })}
          </p>
        </div>
        <Switch
          checked={sendWithModifierEnter}
          onChange={(checked) => void setSendWithModifierEnter(checked)}
          ariaLabelledBy="send-with-modifier-enter-label"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <h4 id="language-label">{t('general.language')}</h4>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('general.languageDescription')}
          </p>
        </div>
        <Select
          ariaLabelledBy="language-label"
          value={locale}
          onChange={(next: Locale) => void setLocale(next)}
          options={LANGUAGE_OPTIONS}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-lg font-medium">{t('general.logs')}</h4>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <h5>{t('general.openLogs')}</h5>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('general.openLogsDescription')}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => void window.electronApi.openLogs()}
            >
              {t('general.open')}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <h5>{t('general.deleteLogs')}</h5>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('general.deleteLogsDescription')}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => void window.electronApi.deleteLogs()}
            >
              {t('general.delete')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
