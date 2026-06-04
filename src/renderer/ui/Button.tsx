import { clsx } from 'clsx'

interface ButtonProps {
  children: React.ReactNode
  className?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  title?: string
  ariaLabel?: string
  onClick?: () => void
}

export function Button({
  children,
  className,
  type,
  disabled,
  title,
  ariaLabel,
  onClick,
}: ButtonProps) {
  const buttonClassName = clsx(
    'rounded-lg p-1 transition-colors duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500',
    'hover:bg-neutral-300 dark:hover:bg-neutral-600',
    disabled ? 'cursor-default' : 'cursor-pointer',
    className,
  )

  return (
    <button
      className={buttonClassName}
      type={type}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
