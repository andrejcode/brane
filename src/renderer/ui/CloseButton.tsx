import { X } from 'lucide-react'
import { BaseButton } from './BaseButton'

interface CloseButtonProps {
  onClick: () => void
  title?: string
  ariaLabel?: string
  className?: string
}

export function CloseButton({
  onClick,
  title = 'Close',
  ariaLabel,
  className,
}: CloseButtonProps) {
  return (
    <BaseButton
      type="button"
      onClick={onClick}
      title={title}
      ariaLabel={ariaLabel ?? title}
      className={className}
    >
      <X />
    </BaseButton>
  )
}
