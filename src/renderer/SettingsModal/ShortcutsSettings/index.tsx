import { useState } from 'react'
import { useTranslation } from '@/contexts/LocaleContext'
import { useShortcuts } from '@/contexts/ShortcutsContext'
import type { MessageKey } from '@/i18n'
import { Button } from '@/ui/Button'
import { bindingsEqual } from '@/utils'
import {
  SHORTCUT_ACTIONS,
  type ShortcutAction,
  type ShortcutBinding,
} from '@shared/types'
import { ShortcutRecorder } from './ShortcutRecorder'

const ACTION_MESSAGES: Record<
  ShortcutAction,
  { labelKey: MessageKey; descriptionKey: MessageKey }
> = {
  toggleSettings: {
    labelKey: 'shortcuts.toggleSettings',
    descriptionKey: 'shortcuts.toggleSettingsDescription',
  },
  toggleModels: {
    labelKey: 'shortcuts.toggleModels',
    descriptionKey: 'shortcuts.toggleModelsDescription',
  },
  toggleSidebar: {
    labelKey: 'shortcuts.toggleSidebar',
    descriptionKey: 'shortcuts.toggleSidebarDescription',
  },
}

export function ShortcutsSettings() {
  const { shortcuts, setShortcut, resetShortcuts } = useShortcuts()
  const { t } = useTranslation()
  const [conflictAction, setConflictAction] = useState<ShortcutAction | null>(
    null,
  )

  const handleChange = (action: ShortcutAction, binding: ShortcutBinding) => {
    const hasConflict = SHORTCUT_ACTIONS.some(
      (other) => other !== action && bindingsEqual(shortcuts[other], binding),
    )

    if (hasConflict) {
      setConflictAction(action)
      return
    }

    setConflictAction(null)
    void setShortcut(action, binding)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-lg font-medium">{t('shortcuts.title')}</h4>
        <Button
          variant="outline"
          className="whitespace-nowrap"
          onClick={() => {
            setConflictAction(null)
            void resetShortcuts()
          }}
        >
          {t('shortcuts.reset')}
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {SHORTCUT_ACTIONS.map((action) => {
          const labelId = `shortcut-${action}-label`
          const { labelKey, descriptionKey } = ACTION_MESSAGES[action]

          return (
            <div
              key={action}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex flex-col">
                <h5 id={labelId}>{t(labelKey)}</h5>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t(descriptionKey)}
                </p>
                {conflictAction === action && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {t('shortcuts.conflict')}
                  </p>
                )}
              </div>
              <ShortcutRecorder
                binding={shortcuts[action]}
                onChange={(binding) => handleChange(action, binding)}
                ariaLabelledBy={labelId}
                recordingHint={t('shortcuts.recording')}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
