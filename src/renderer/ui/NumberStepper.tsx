import { clsx } from 'clsx'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BaseButton } from './buttons/BaseButton'

interface NumberStepperProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  increaseLabel: string
  decreaseLabel: string
  step?: number
  suffix?: string
  id?: string
  ariaLabel?: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  disabled?: boolean
  className?: string
}

function clampValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function NumberStepper({
  value,
  onChange,
  min,
  max,
  increaseLabel,
  decreaseLabel,
  step = 1,
  suffix,
  id,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  disabled = false,
  className,
}: NumberStepperProps) {
  const [draftValue, setDraftValue] = useState(String(value))

  useEffect(() => {
    setDraftValue(String(value))
  }, [value])

  const saveValue = (nextValue: number) => {
    const clampedValue = clampValue(nextValue, min, max)
    setDraftValue(String(clampedValue))
    onChange(clampedValue)
  }

  const commitDraftValue = () => {
    const parsedValue = Number(draftValue)
    if (draftValue.trim() === '' || !Number.isFinite(parsedValue)) {
      setDraftValue(String(value))
      return
    }

    saveValue(parsedValue)
  }

  const changeValueBy = (amount: number) => {
    const parsedValue = Number(draftValue)
    const currentValue = Number.isFinite(parsedValue) ? parsedValue : value
    saveValue(currentValue + amount)
  }

  return (
    <div
      className={clsx(
        'flex h-9 items-stretch overflow-hidden rounded-md border',
        'border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-800',
        disabled && 'opacity-50',
        className,
      )}
    >
      <div className="flex items-center px-2">
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          inputMode="numeric"
          value={draftValue}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          disabled={disabled}
          onChange={(event) => setDraftValue(event.currentTarget.value)}
          onBlur={commitDraftValue}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur()
            } else if (event.key === 'Escape') {
              setDraftValue(String(value))
              event.currentTarget.blur()
            }
          }}
          className="w-8 [appearance:textfield] bg-transparent text-right text-sm tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && (
          <span className="ml-1 text-sm text-neutral-500 dark:text-neutral-400">
            {suffix}
          </span>
        )}
      </div>
      <div className="grid border-l border-neutral-300 dark:border-neutral-600">
        <BaseButton
          type="button"
          ariaLabel={increaseLabel}
          disabled={disabled || value >= max}
          onClick={() => changeValueBy(step)}
          className="px-1.5 hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-700"
        >
          <ChevronUp size={12} />
        </BaseButton>
        <BaseButton
          type="button"
          ariaLabel={decreaseLabel}
          disabled={disabled || value <= min}
          onClick={() => changeValueBy(-step)}
          className="border-t border-neutral-300 px-1.5 hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-600 dark:hover:bg-neutral-700"
        >
          <ChevronDown size={12} />
        </BaseButton>
      </div>
    </div>
  )
}
