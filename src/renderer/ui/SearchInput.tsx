import { clsx } from 'clsx'
import { Search } from 'lucide-react'
import type { ChangeEventHandler, KeyboardEventHandler, Ref } from 'react'

interface SearchInputProps {
  value: string
  placeholder: string
  ariaLabel: string
  disabled?: boolean
  className?: string
  inputClassName?: string
  inputRef?: Ref<HTMLInputElement>
  onChange: ChangeEventHandler<HTMLInputElement>
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>
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
  onKeyDown,
}: SearchInputProps) {
  return (
    <label
      role="search"
      className={clsx('group flex min-w-0 items-center gap-2', className)}
    >
      <Search
        size={18}
        aria-hidden
        className={clsx(
          'shrink-0 transition-colors duration-200',
          !value &&
            'text-neutral-500 group-focus-within:text-inherit dark:text-neutral-400 dark:group-focus-within:text-inherit',
        )}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={clsx(
          'min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-400',
          inputClassName,
        )}
      />
    </label>
  )
}
