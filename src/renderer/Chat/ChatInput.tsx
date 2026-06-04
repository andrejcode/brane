import { clsx } from 'clsx'
import { ArrowUp } from 'lucide-react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type {
  Dispatch,
  KeyboardEventHandler,
  SetStateAction,
  SubmitEventHandler,
} from 'react'

const MAX_ROWS = 8
// Right padding (px) of the textarea
const SINGLE_ROW_PADDING_RIGHT = 48
const MULTI_ROW_PADDING_RIGHT = 16

interface ChatInputProps {
  input: string
  isSending: boolean
  onSubmit: SubmitEventHandler<HTMLFormElement>
  setInput: Dispatch<SetStateAction<string>>
}

export function ChatInput({
  input,
  isSending,
  onSubmit,
  setInput,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isMultiline, setIsMultiline] = useState(false)

  const resize = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      return false
    }

    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 24
    const maxHeight = lineHeight * MAX_ROWS

    const startPaddingRight = textarea.style.paddingRight
    const startHeight = textarea.style.height

    textarea.style.transition = 'none'
    textarea.style.paddingRight = `${SINGLE_ROW_PADDING_RIGHT}px`
    textarea.style.height = 'auto'
    const multiline = textarea.scrollHeight > lineHeight * 1.5

    const targetPaddingRight = multiline
      ? MULTI_ROW_PADDING_RIGHT
      : SINGLE_ROW_PADDING_RIGHT
    textarea.style.paddingRight = `${targetPaddingRight}px`
    textarea.style.height = 'auto'
    const { scrollHeight } = textarea
    const nextHeight = Math.min(scrollHeight, maxHeight)
    const overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden'

    textarea.style.paddingRight = startPaddingRight
    textarea.style.height = startHeight
    void textarea.offsetHeight
    textarea.style.transition = ''
    textarea.style.paddingRight = `${targetPaddingRight}px`
    textarea.style.height = `${nextHeight}px`
    textarea.style.overflowY = overflowY

    return multiline
  }, [])

  useLayoutEffect(() => {
    // The row count can only be derived by measuring the rendered textarea, so
    // storing the measurement here is the intended use of a layout effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- DOM measurement
    setIsMultiline(resize())
  }, [input, resize])

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return
    }

    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  return (
    <form
      onSubmit={onSubmit}
      className={clsx(
        'relative w-full shrink-0 px-0 pt-3',
        'transition-[padding] duration-200 ease-out',
        'border border-neutral-200 bg-neutral-50 shadow dark:border-none dark:bg-neutral-700',
        isMultiline ? 'rounded-3xl pb-12' : 'rounded-full pb-3',
      )}
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything"
        rows={1}
        className={clsx(
          'block w-full min-h-6 resize-none pl-4 leading-6',
          'transition-[height,padding] duration-200 ease-out',
          'bg-transparent text-neutral-800 focus:outline-none dark:text-neutral-100',
        )}
      />
      <button
        type="submit"
        title="Send message"
        disabled={isSending || input.trim().length === 0}
        aria-label="Send message"
        className={clsx(
          'absolute right-2 bottom-2 cursor-pointer rounded-full p-1 shadow-md',
          'transition-all duration-200 ease-out hover:shadow-xl',
          'bg-neutral-800 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-800',
          'hover:bg-neutral-700 dark:hover:bg-neutral-200',
          'disabled:bg-neutral-300 dark:disabled:bg-neutral-600',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 disabled:cursor-not-allowed',
        )}
      >
        <ArrowUp />
      </button>
    </form>
  )
}
