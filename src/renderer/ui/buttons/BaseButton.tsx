import { clsx } from 'clsx'
import { FOCUS_RING } from '@/ui/styles/focusRing'

interface BaseButtonProps {
  children: React.ReactNode
  className?: string | undefined
  type: 'button' | 'submit' | 'reset'
  disabled?: boolean | undefined
  title?: string | undefined
  ariaLabel?: string | undefined
  onClick?: (() => void) | undefined
  // Optional pass-through attributes, used to compose ARIA widget patterns.
  id?: string | undefined
  role?: string | undefined
  ariaSelected?: boolean | undefined
  ariaExpanded?: boolean | undefined
  ariaControls?: string | undefined
  tabIndex?: number | undefined
}

// Unstyled button primitive. Compose new button styles on top of this.
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
  ariaExpanded,
  ariaControls,
  tabIndex,
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
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      tabIndex={tabIndex}
    >
      {children}
    </button>
  )
}
