import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { BaseButton } from './BaseButton'

interface CloseButtonProps {
  onClick: () => void
  tooltip?: string
  ariaLabel?: string
  className?: string
}

export function CloseButton({
  onClick,
  tooltip,
  ariaLabel,
  className,
}: CloseButtonProps) {
  return (
    <BaseButton
      type="button"
      onClick={onClick}
      tooltip={tooltip}
      ariaLabel={ariaLabel ?? tooltip ?? 'Close'}
      className={clsx('rounded-lg', className)}
    >
      <X />
    </BaseButton>
  )
}
