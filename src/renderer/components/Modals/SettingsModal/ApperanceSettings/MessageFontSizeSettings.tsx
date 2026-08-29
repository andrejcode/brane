import { useTranslation } from '@/contexts/LocaleContext'
import { useTheme } from '@/contexts/ThemeContext'
import { NumberStepper } from '@/ui/NumberStepper'
import {
  MAX_MESSAGE_FONT_SIZE,
  MIN_MESSAGE_FONT_SIZE,
  normalizeMessageFontSize,
} from '@shared/types'

export function MessageFontSizeSettings() {
  const { t } = useTranslation()
  const { messageFontSize, setMessageFontSize } = useTheme()

  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex min-w-0 flex-col">
        <label htmlFor="message-font-size">{t('appearance.fontSize')}</label>
        <p
          id="message-font-size-description"
          className="text-sm text-neutral-500 dark:text-neutral-400"
        >
          {t('appearance.fontSizeDescription')}
        </p>
      </div>
      <div className="shrink-0">
        <NumberStepper
          id="message-font-size"
          value={messageFontSize}
          min={MIN_MESSAGE_FONT_SIZE}
          max={MAX_MESSAGE_FONT_SIZE}
          suffix="px"
          increaseLabel={t('appearance.increaseFontSize')}
          decreaseLabel={t('appearance.decreaseFontSize')}
          ariaDescribedBy="message-font-size-description"
          onChange={(fontSize) =>
            void setMessageFontSize(normalizeMessageFontSize(fontSize))
          }
        />
      </div>
    </div>
  )
}
