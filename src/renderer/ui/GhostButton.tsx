import { clsx } from 'clsx'
import { Button } from './Button'

interface GhostButtonProps {
  children: React.ReactNode
  className?: string
  title?: string
  ariaLabel?: string
  // Renders the button with its hover background applied permanently, used to
  // mark the active/selected item (e.g. the currently selected model).
  isActive?: boolean
  onClick?: (() => void) | undefined
}

// A transparent button that reveals a subtle background on hover. Used for
// toolbar icons in the header and for selectable rows like the model list.
export function GhostButton({
  children,
  className,
  title,
  ariaLabel,
  isActive,
  onClick,
}: GhostButtonProps) {
  return (
    <Button
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
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
