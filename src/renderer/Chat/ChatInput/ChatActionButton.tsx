import { clsx } from 'clsx'
import { BaseButton } from '@/ui/BaseButton'

interface ChatActionButtonProps {
  children: React.ReactNode
  type: 'button' | 'submit'
  title?: string
  ariaLabel?: string
  disabled?: boolean
  onClick?: (() => void) | undefined
}

export function ChatActionButton({
  children,
  type,
  title,
  ariaLabel,
  disabled,
  onClick,
}: ChatActionButtonProps) {
  return (
    <BaseButton
      type={type}
      title={title}
      ariaLabel={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'absolute right-2 bottom-2 rounded-full shadow-md',
        'size-8 flex items-center justify-center',
        'transition-all duration-200 ease-out hover:shadow-xl',
        'bg-neutral-800 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-800',
        'hover:bg-neutral-700 dark:hover:bg-neutral-200',
        'disabled:bg-neutral-300 dark:disabled:bg-neutral-600',
        'focus-visible:ring-neutral-500',
      )}
    >
      {children}
    </BaseButton>
  )
}
