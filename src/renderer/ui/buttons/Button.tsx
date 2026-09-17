import { clsx } from 'clsx'
import { BaseButton } from './BaseButton'

type ButtonVariant = 'solid' | 'outline' | 'danger'

interface ButtonProps {
  children: React.ReactNode
  onClick?: (() => void) | undefined
  ref?: React.Ref<HTMLButtonElement> | undefined
  type?: 'button' | 'submit' | 'reset'
  variant?: ButtonVariant
  disabled?: boolean
  title?: string
  ariaLabel?: string
  ariaLabelledBy?: string
  ariaPressed?: boolean
  onBlur?: React.FocusEventHandler<HTMLButtonElement>
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
  danger: clsx(
    'bg-red-500/15 text-red-500 hover:bg-red-500/25',
    'dark:bg-red-400/15 dark:text-red-400 dark:hover:bg-red-400/25',
    'disabled:opacity-50',
  ),
}

export function Button({
  children,
  onClick,
  ref,
  type = 'button',
  variant = 'solid',
  disabled,
  title,
  ariaLabel,
  ariaLabelledBy,
  ariaPressed,
  onBlur,
  className,
}: ButtonProps) {
  return (
    <BaseButton
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      ariaLabel={ariaLabel}
      ariaLabelledBy={ariaLabelledBy}
      ariaPressed={ariaPressed}
      onBlur={onBlur}
      className={clsx(
        'rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </BaseButton>
  )
}
