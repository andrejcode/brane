import { useState } from 'react'
import { useAlert } from '@/contexts/AlertContext'
import { useChatSettings } from '@/contexts/ChatSettingsContext'
import { useLocale, useTranslation } from '@/contexts/LocaleContext'
import { useJustCompleted } from '@/hooks/useJustCompleted'
import { LOCALE_OPTIONS } from '@/i18n'
import { Button } from '@/ui/buttons/Button'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
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
  const { showAlert } = useAlert()
  const [isDeleteLogsConfirmOpen, setIsDeleteLogsConfirmOpen] = useState(false)
  const [wereLogsDeleted, markLogsDeleted] = useJustCompleted()

  const sendShortcut = window.electronApi.isMac ? '⌘' : 'Ctrl'

  const handleOpenLogs = async () => {
    try {
      await window.electronApi.openLogs()
    } catch {
      showAlert(t('general.openLogsFailed'), 'error')
    }
  }

  const handleDeleteLogs = async () => {
    try {
      await window.electronApi.deleteLogs()
      markLogsDeleted()
    } catch {
      showAlert(t('general.deleteLogsFailed'), 'error')
    }
  }

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
            <Button variant="outline" onClick={() => void handleOpenLogs()}>
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
              className="min-w-24"
              onClick={() => setIsDeleteLogsConfirmOpen(true)}
            >
              {wereLogsDeleted
                ? t('general.deleteLogsDone')
                : t('general.delete')}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteLogsConfirmOpen}
        title={t('general.deleteLogsConfirmTitle')}
        message={t('general.deleteLogsConfirmMessage')}
        confirmLabel={t('general.delete')}
        isDestructive
        onCancel={() => setIsDeleteLogsConfirmOpen(false)}
        onConfirm={() => {
          setIsDeleteLogsConfirmOpen(false)
          void handleDeleteLogs()
        }}
      />
    </div>
  )
}
