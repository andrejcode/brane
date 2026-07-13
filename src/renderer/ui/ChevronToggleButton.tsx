import { clsx } from 'clsx'
import { ChevronRight } from 'lucide-react'
import { BaseButton } from './BaseButton'

interface ChevronToggleButtonProps {
  buttonText: string
  isExpanded: boolean
  onToggle: () => void
  textClassName?: string
  className?: string
  ariaControls?: string
}

export function ChevronToggleButton({
  buttonText,
  isExpanded,
  onToggle,
  textClassName,
  className,
  ariaControls,
}: ChevronToggleButtonProps) {
  return (
    <BaseButton
      type="button"
      onClick={onToggle}
      ariaExpanded={isExpanded}
      ariaControls={ariaControls}
      className={clsx(
        'flex items-center gap-1 self-start rounded-md text-sm',
        className,
      )}
    >
      <ChevronRight
        size={16}
        className={clsx(
          'shrink-0 text-neutral-500 transition-transform duration-200',
          isExpanded && 'rotate-90',
        )}
      />
      <span className={textClassName}>{buttonText}</span>
    </BaseButton>
  )
}
