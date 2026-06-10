import { clsx } from 'clsx'
import { Button } from '@/ui/Button'

interface HeaderButtonProps {
  children: React.ReactNode
  className?: string
  title?: string
  ariaLabel?: string
  onClick?: (() => void) | undefined
}

export function HeaderButton({
  children,
  className,
  title,
  ariaLabel,
  onClick,
}: HeaderButtonProps) {
  return (
    <Button
      type="button"
      className={clsx(
        '[app-region:no-drag]',
        'rounded-lg p-1 transition-colors duration-200',
        'focus-visible:ring-offset-2',
        'focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500',
        'hover:bg-neutral-300 dark:hover:bg-neutral-600',
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
