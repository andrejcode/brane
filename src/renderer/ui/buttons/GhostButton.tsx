import { clsx } from 'clsx'
import { BaseButton } from './BaseButton'

interface GhostButtonProps {
  children: React.ReactNode
  className?: string
  title?: string
  ariaLabel?: string
  // Renders the button with its hover background applied permanently.
  isActive?: boolean
  disabled?: boolean
  onClick?: (() => void) | undefined
  id?: string | undefined
  role?: string | undefined
  ariaSelected?: boolean | undefined
  ariaControls?: string | undefined
  tabIndex?: number | undefined
}

// A transparent button that reveals a subtle background on hover.
export function GhostButton({
  children,
  className,
  title,
  ariaLabel,
  isActive,
  disabled,
  onClick,
  id,
  role,
  ariaSelected,
  ariaControls,
  tabIndex,
}: GhostButtonProps) {
  return (
    <BaseButton
      type="button"
      className={clsx(
        '[app-region:no-drag]',
        'rounded-lg p-1 transition-colors duration-200',
        'hover:bg-neutral-300 dark:hover:bg-neutral-600',
        'disabled:opacity-40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent',
        isActive && 'bg-neutral-300 dark:bg-neutral-600',
        className,
      )}
      title={title}
      ariaLabel={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      id={id}
      role={role}
      ariaSelected={ariaSelected}
      ariaControls={ariaControls}
      tabIndex={tabIndex}
    >
      {children}
    </BaseButton>
  )
}
