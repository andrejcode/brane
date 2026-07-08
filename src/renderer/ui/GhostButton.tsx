import { clsx } from 'clsx'
import { BaseButton } from './BaseButton'

interface GhostButtonProps {
  children: React.ReactNode
  className?: string
  title?: string
  ariaLabel?: string
  // Renders the button with its hover background applied permanently, used to
  // mark the active/selected item (e.g. the currently selected model).
  isActive?: boolean
  disabled?: boolean
  onClick?: (() => void) | undefined
  // Optional pass-through attributes for composing ARIA widget patterns such
  // as a tablist (see the settings dialog).
  id?: string | undefined
  role?: string | undefined
  ariaSelected?: boolean | undefined
  ariaControls?: string | undefined
  tabIndex?: number | undefined
  onKeyDown?:
    | ((event: React.KeyboardEvent<HTMLButtonElement>) => void)
    | undefined
}

// A transparent button that reveals a subtle background on hover. Used for
// toolbar icons in the header and for selectable rows like the model list.
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
  onKeyDown,
}: GhostButtonProps) {
  return (
    <BaseButton
      type="button"
      className={clsx(
        '[app-region:no-drag]',
        'rounded-lg p-1 transition-colors duration-200',
        'focus-visible:ring-offset-2',
        'focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500',
        'hover:bg-neutral-300 dark:hover:bg-neutral-600',
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
      onKeyDown={onKeyDown}
    >
      {children}
    </BaseButton>
  )
}
