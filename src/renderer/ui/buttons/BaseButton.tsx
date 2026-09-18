import { clsx } from 'clsx'
import { useId, useRef } from 'react'
import { FOCUS_RING, FOCUS_RING_INSET } from '@/ui/styles/focusRing'
import { Tooltip, useTooltipVisibility } from '@/ui/Tooltip'

type FocusRing = 'default' | 'inset'

interface BaseButtonProps {
  children: React.ReactNode
  className?: string | undefined
  ref?: React.Ref<HTMLButtonElement> | undefined
  type: 'button' | 'submit' | 'reset'
  disabled?: boolean | undefined
  tooltip?: string | undefined
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
  tooltip,
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
  const buttonRef = useRef<HTMLButtonElement>(null)
  const tooltipId = useId()
  const { hideTooltip, isTooltipVisible, showTooltip } = useTooltipVisibility()
  const buttonClassName = clsx(
    focusRing === 'inset' ? FOCUS_RING_INSET : FOCUS_RING,
    className,
  )

  return (
    <>
      <button
        ref={(element) => {
          buttonRef.current = element

          if (typeof ref === 'function') ref(element)
          else if (ref) ref.current = element
        }}
        className={buttonClassName}
        type={type}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={tooltip && isTooltipVisible ? tooltipId : undefined}
        aria-pressed={ariaPressed}
        aria-checked={ariaChecked}
        onClick={onClick}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={(event) => {
          if (event.currentTarget.matches(':focus-visible')) {
            showTooltip()
          }
        }}
        onBlur={(event) => {
          hideTooltip()
          onBlur?.(event)
        }}
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

      {tooltip && isTooltipVisible ? (
        <Tooltip id={tooltipId} targetRef={buttonRef}>
          {tooltip}
        </Tooltip>
      ) : null}
    </>
  )
}
