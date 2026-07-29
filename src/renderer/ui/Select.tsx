import { clsx } from 'clsx'
import { ChevronDown } from 'lucide-react'
import { useRef, useState } from 'react'
import { FOCUS_RING_INSET_ACTIVE } from '@/ui/styles/focusRing'

interface SelectOption<T extends string> {
  value: T
  label: string
}

interface SelectProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: ReadonlyArray<SelectOption<T>>
  id?: string
  ariaLabel?: string
  ariaLabelledBy?: string
  disabled?: boolean
  className?: string
}

// Matches the horizontal breathing room on both sides: text sits `pl-3` from the
// left edge and the chevron sits `right-3` from the right edge, so the gap after
// the icon mirrors the gap before the text.
const EDGE_PADDING = 'pl-3'
const ICON_INSET = 'right-3'

export function Select<T extends string>({
  value,
  onChange,
  options,
  id,
  ariaLabel,
  ariaLabelledBy,
  disabled,
  className,
}: SelectProps<T>) {
  // Chromium matches `:focus-visible` on a `<select>` even when it's clicked, so
  // drive the ring from JS to keep it exclusive to keyboard focus.
  const wasPointerFocus = useRef(false)
  const [showFocusRing, setShowFocusRing] = useState(false)

  return (
    <div className={clsx('relative inline-flex', className)}>
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onChange={(event) => onChange(event.target.value as T)}
        onPointerDown={() => {
          wasPointerFocus.current = true
        }}
        onFocus={() => {
          setShowFocusRing(!wasPointerFocus.current)
          wasPointerFocus.current = false
        }}
        onBlur={() => setShowFocusRing(false)}
        className={clsx(
          'w-full appearance-none rounded border py-1',
          EDGE_PADDING,
          'pr-9',
          'border-neutral-300 bg-neutral-50 dark:border-neutral-500 dark:bg-neutral-700',
          'cursor-pointer focus:outline-none',
          showFocusRing && FOCUS_RING_INSET_ACTIVE,
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        aria-hidden
        className={clsx(
          'pointer-events-none absolute top-1/2 -translate-y-1/2',
          ICON_INSET,
          'text-neutral-500 dark:text-neutral-400',
        )}
      />
    </div>
  )
}
