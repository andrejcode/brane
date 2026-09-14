import { clsx } from 'clsx'
import { FOCUS_RING, FOCUS_RING_INSET } from '@/ui/styles/focusRing'

type FocusRing = 'default' | 'inset'

interface BaseButtonProps {
  children: React.ReactNode
  className?: string | undefined
  ref?: React.Ref<HTMLButtonElement> | undefined
  type: 'button' | 'submit' | 'reset'
  disabled?: boolean | undefined
  title?: string | undefined
  ariaLabel?: string | undefined
  ariaLabelledBy?: string | undefined
  ariaPressed?: boolean | undefined
  ariaChecked?: boolean | undefined
  onClick?: (() => void) | undefined
  onBlur?: React.FocusEventHandler<HTMLButtonElement> | undefined
  focusRing?: FocusRing | undefined
  // Optional pass-through attributes, used to compose ARIA widget patterns.
  id?: string | undefined
  role?: string | undefined
  ariaSelected?: boolean | undefined
  ariaExpanded?: boolean | undefined
  ariaHasPopup?: 'menu' | undefined
  ariaControls?: string | undefined
  tabIndex?: number | undefined
}

// Unstyled button primitive. Compose new button styles on top of this.
export function BaseButton({
  children,
  className,
  ref,
  type,
  disabled,
  title,
  ariaLabel,
  ariaLabelledBy,
  ariaPressed,
  ariaChecked,
  onClick,
  onBlur,
  focusRing = 'default',
  id,
  role,
  ariaSelected,
  ariaExpanded,
  ariaHasPopup,
  ariaControls,
  tabIndex,
}: BaseButtonProps) {
  const buttonClassName = clsx(
    focusRing === 'inset' ? FOCUS_RING_INSET : FOCUS_RING,
    'disabled:cursor-not-allowed',
    className,
  )

  return (
    <button
      ref={ref}
      className={buttonClassName}
      type={type}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-pressed={ariaPressed}
      aria-checked={ariaChecked}
      onClick={onClick}
      onBlur={onBlur}
      id={id}
      role={role}
      aria-selected={ariaSelected}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      aria-controls={ariaControls}
      tabIndex={tabIndex}
    >
      {children}
    </button>
  )
}
