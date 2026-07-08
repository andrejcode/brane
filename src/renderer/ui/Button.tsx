import { clsx } from 'clsx'
import { BaseButton } from './BaseButton'

type ButtonVariant = 'solid' | 'outline'

interface ButtonProps {
  children: React.ReactNode
  onClick?: (() => void) | undefined
  type?: 'button' | 'submit' | 'reset'
  variant?: ButtonVariant
  disabled?: boolean
  title?: string
  ariaLabel?: string
  className?: string
}

const variantClasses: Record<ButtonVariant, string> = {
  solid: clsx(
    'bg-neutral-800 text-neutral-100 hover:bg-neutral-700',
    'dark:bg-neutral-100 dark:text-neutral-800 dark:hover:bg-neutral-300',
    'disabled:bg-neutral-300 dark:disabled:bg-neutral-600',
  ),
  outline: clsx(
    'border border-neutral-300 text-neutral-800 hover:bg-neutral-200',
    'dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-600',
    'disabled:opacity-50',
  ),
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'solid',
  disabled,
  title,
  ariaLabel,
  className,
}: ButtonProps) {
  return (
    <BaseButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      ariaLabel={ariaLabel}
      className={clsx(
        'rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200',
        'focus-visible:ring-neutral-500',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </BaseButton>
  )
}
