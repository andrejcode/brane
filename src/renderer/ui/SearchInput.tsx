import { clsx } from 'clsx'
import { Search } from 'lucide-react'
import type { ChangeEventHandler, Ref } from 'react'

interface SearchInputProps {
  value: string
  placeholder: string
  ariaLabel: string
  disabled?: boolean
  className?: string
  inputClassName?: string
  inputRef?: Ref<HTMLInputElement>
  onChange: ChangeEventHandler<HTMLInputElement>
}

export function SearchInput({
  value,
  placeholder,
  ariaLabel,
  disabled = false,
  className,
  inputClassName,
  inputRef,
  onChange,
}: SearchInputProps) {
  return (
    <div
      role="search"
      className={clsx('flex min-w-0 items-center gap-2', className)}
    >
      <Search
        size={18}
        aria-hidden
        className="shrink-0 text-neutral-500 dark:text-neutral-400"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={clsx(
          'min-w-0 flex-1 bg-transparent outline-none',
          'placeholder:text-neutral-400 disabled:cursor-not-allowed',
          inputClassName,
        )}
      />
    </div>
  )
}
