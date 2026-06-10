import { clsx } from 'clsx'

interface ButtonProps {
  children: React.ReactNode
  className?: string | undefined
  type: 'button' | 'submit' | 'reset'
  disabled?: boolean | undefined
  title?: string | undefined
  ariaLabel?: string | undefined
  onClick?: (() => void) | undefined
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
    'focus:outline-none focus-visible:ring-2',
    'cursor-pointer disabled:cursor-not-allowed',
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
