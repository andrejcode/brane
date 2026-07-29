import { clsx } from 'clsx'
import { ArrowDown } from 'lucide-react'
import { BaseButton } from '@/ui/buttons/BaseButton'
import { useTranslation } from '../../contexts/LocaleContext'

interface ScrollToBottomButtonProps {
  bottomInset: number
  isVisible: boolean
  onClick: () => void
}

// Nudge the button down so it hugs the top of the docked composer instead of
// floating out in the message area.
const bottomGap = 4

export function ScrollToBottomButton({
  bottomInset,
  isVisible,
  onClick,
}: ScrollToBottomButtonProps) {
  const { t } = useTranslation()

  return (
    <div
      className={clsx(
        'pointer-events-none absolute inset-x-0 z-10 flex justify-center',
        'transition-opacity duration-200 ease-out',
        isVisible ? 'opacity-100' : 'opacity-0',
      )}
      style={{ bottom: bottomInset + bottomGap }}
    >
      <BaseButton
        type="button"
        title={t('chat.scrollToBottom')}
        ariaLabel={t('chat.scrollToBottom')}
        onClick={onClick}
        tabIndex={isVisible ? 0 : -1}
        className={clsx(
          'flex size-8 items-center justify-center rounded-full',
          'border border-neutral-200 bg-neutral-50 text-neutral-700',
          'dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100',
          'shadow-sm shadow-black/5 transition-colors duration-200',
          'hover:bg-neutral-100 dark:hover:bg-neutral-600',
          isVisible ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <ArrowDown size={18} />
      </BaseButton>
    </div>
  )
}
