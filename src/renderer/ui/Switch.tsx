import { clsx } from 'clsx'

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
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full',
        'transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500',
        'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
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
    </button>
  )
}
