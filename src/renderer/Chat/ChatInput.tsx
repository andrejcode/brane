import { clsx } from 'clsx'
import { ArrowUp } from 'lucide-react'
import type {
  Dispatch,
  KeyboardEventHandler,
  SetStateAction,
  SubmitEventHandler,
} from 'react'

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
        'flex w-full shrink-0 items-center gap-2 rounded-full p-2',
        'border border-neutral-200 bg-neutral-50 shadow dark:border-none dark:bg-neutral-700',
      )}
    >
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything"
        rows={1}
        className={clsx(
          'ml-2 max-h-[200px] min-h-6 flex-1 resize-none overflow-y-auto',
          'bg-transparent text-neutral-800 focus:outline-none dark:text-neutral-100',
        )}
      />
      <button
        type="submit"
        title="Send message"
        disabled={isSending || input.trim().length === 0}
        aria-label="Send message"
        className={clsx(
          'shrink-0 cursor-pointer rounded-full p-1 shadow-md transition-shadow hover:shadow-xl',
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
