import { clsx } from 'clsx'
import { BaseButton } from '@/ui/buttons/BaseButton'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  id?: string | undefined
  disabled?: boolean | undefined
  ariaLabel?: string | undefined
  ariaLabelledBy?: string | undefined
}

export function Switch({
  checked,
  onChange,
  id,
  disabled,
  ariaLabel,
  ariaLabelledBy,
}: SwitchProps) {
  return (
    <BaseButton
      type="button"
      role="switch"
      id={id}
      ariaChecked={checked}
      ariaLabel={ariaLabel}
      ariaLabelledBy={ariaLabelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full',
        'transition-colors duration-200',
        'disabled:opacity-50',
        checked
          ? 'bg-neutral-800 dark:bg-neutral-200'
          : 'bg-neutral-300 dark:bg-neutral-600',
      )}
    >
      <span
        className={clsx(
          'inline-block h-4 w-4 transform rounded-full',
          'bg-white shadow transition-transform duration-200 dark:bg-neutral-900',
          checked ? 'translate-x-5' : 'translate-x-1',
        )}
      />
    </BaseButton>
  )
}
