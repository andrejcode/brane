import { clsx } from 'clsx'
import { FOCUS_RING } from './focusRing'

interface BaseButtonProps {
  children: React.ReactNode
  className?: string | undefined
  type: 'button' | 'submit' | 'reset'
  disabled?: boolean | undefined
  title?: string | undefined
  ariaLabel?: string | undefined
  onClick?: (() => void) | undefined
  // Optional pass-through attributes, used to compose ARIA widget patterns
  // (e.g. the tablist in the settings dialog) on top of the base button.
  id?: string | undefined
  role?: string | undefined
  ariaSelected?: boolean | undefined
  ariaControls?: string | undefined
  tabIndex?: number | undefined
  onKeyDown?:
    | ((event: React.KeyboardEvent<HTMLButtonElement>) => void)
    | undefined
}

export function BaseButton({
  children,
  className,
  type,
  disabled,
  title,
  ariaLabel,
  onClick,
  id,
  role,
  ariaSelected,
  ariaControls,
  tabIndex,
  onKeyDown,
}: BaseButtonProps) {
  const buttonClassName = clsx(
    FOCUS_RING,
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
      id={id}
      role={role}
      aria-selected={ariaSelected}
      aria-controls={ariaControls}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
    >
      {children}
    </button>
  )
}
