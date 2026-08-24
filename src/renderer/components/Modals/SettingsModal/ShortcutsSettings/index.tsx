import { useState } from 'react'
import { useTranslation } from '@/contexts/LocaleContext'
import { useShortcuts } from '@/contexts/ShortcutsContext'
import type { MessageKey } from '@/i18n'
import { Button } from '@/ui/buttons/Button'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { bindingsEqual } from '@/utils'
import {
  SHORTCUT_ACTIONS,
  type ShortcutAction,
  type ShortcutBinding,
} from '@shared/types'
import { ShortcutRecorder } from './ShortcutRecorder'

const ACTION_LABEL_KEYS: Record<ShortcutAction, MessageKey> = {
  toggleSettings: 'shortcuts.toggleSettings',
  toggleModels: 'shortcuts.toggleModels',
  toggleSidebar: 'shortcuts.toggleSidebar',
  newChat: 'shortcuts.newChat',
}

export function ShortcutsSettings() {
  const { shortcuts, setShortcut, resetShortcuts } = useShortcuts()
  const { t } = useTranslation()
  const [conflictAction, setConflictAction] = useState<ShortcutAction | null>(
    null,
  )
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)

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
      <div className="flex flex-col gap-3">
        {SHORTCUT_ACTIONS.map((action) => {
          const labelId = `shortcut-${action}-label`

          return (
            <div
              key={action}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex flex-col">
                <p id={labelId} className="text-sm">
                  {t(ACTION_LABEL_KEYS[action])}
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

      <hr className="border-neutral-200 dark:border-neutral-600" />

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm">{t('shortcuts.resetLabel')}</p>
        <Button
          variant="outline"
          className="min-w-28 whitespace-nowrap"
          onClick={() => setIsResetConfirmOpen(true)}
        >
          {t('shortcuts.reset')}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title={t('shortcuts.resetConfirmTitle')}
        message={t('shortcuts.resetConfirmMessage')}
        confirmLabel={t('shortcuts.reset')}
        onCancel={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          setIsResetConfirmOpen(false)
          setConflictAction(null)
          void resetShortcuts()
        }}
      />
    </div>
  )
}
