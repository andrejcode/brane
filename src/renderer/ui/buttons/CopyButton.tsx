import { clsx } from 'clsx'
import { Check, Copy, X } from 'lucide-react'
import { BaseButton } from './BaseButton'

export type CopyStatus = 'idle' | 'copied' | 'error'

export interface CopyLabels {
  copy: string
  copied: string
  error: string
}

interface CopyButtonProps {
  copyStatus: CopyStatus
  onClick: () => void
  labels: CopyLabels
  showLabel?: boolean
  className?: string
}

const iconByStatus: Record<CopyStatus, React.ReactNode> = {
  idle: <Copy size={14} />,
  copied: <Check size={14} />,
  error: <X size={14} />,
}

export function CopyButton({
  copyStatus,
  onClick,
  labels,
  showLabel = false,
  className,
}: CopyButtonProps) {
  const label =
    copyStatus === 'copied'
      ? labels.copied
      : copyStatus === 'error'
        ? labels.error
        : labels.copy

  return (
    <BaseButton
      type="button"
      onClick={onClick}
      ariaLabel={label}
      title={labels.copy}
      className={clsx(
        'rounded-md p-1 text-xs text-neutral-500 transition-colors duration-200',
        'hover:bg-neutral-200 hover:text-neutral-700',
        'dark:hover:bg-neutral-600 dark:hover:text-neutral-100',
        className,
      )}
    >
      <span className={clsx('flex items-center', showLabel && 'gap-1')}>
        {iconByStatus[copyStatus]}
        {showLabel && <span>{label}</span>}
      </span>
    </BaseButton>
  )
}
