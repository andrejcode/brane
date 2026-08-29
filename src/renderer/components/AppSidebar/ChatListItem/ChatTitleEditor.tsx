import { clsx } from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { deriveChatTitle, MAX_CHAT_TITLE_LENGTH } from '@shared/chatTitle'
import type { ChatSummary } from '@shared/types'
import { ChatModelLine } from './ChatModelLine'

interface ChatTitleEditorProps {
  chat: ChatSummary
  initialTitle: string
  placeholder: string
  ariaLabel: string
  modelWarning: string | null
  onCommit: (title: string) => void
  onCancel: () => void
}

export function ChatTitleEditor({
  chat,
  initialTitle,
  placeholder,
  ariaLabel,
  modelWarning,
  onCommit,
  onCancel,
}: ChatTitleEditorProps) {
  const [draft, setDraft] = useState(initialTitle)
  const inputRef = useRef<HTMLInputElement>(null)
  const settledRef = useRef(false)

  useEffect(() => {
    const input = inputRef.current

    if (!input) {
      return
    }

    input.focus()
    input.select()
  }, [])

  const settle = (title: string | null) => {
    if (settledRef.current) {
      return
    }

    settledRef.current = true

    if (title === null) {
      onCancel()
      return
    }

    onCommit(title)
  }

  return (
    <form
      className="h-full min-w-0 flex-1 px-2 py-2"
      onSubmit={(event) => {
        event.preventDefault()
        const title = deriveChatTitle(draft)
        settle(title.length === 0 ? null : title)
      }}
    >
      <input
        ref={inputRef}
        value={draft}
        maxLength={MAX_CHAT_TITLE_LENGTH}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(event) => {
          setDraft(event.target.value)
        }}
        onBlur={() => {
          const title = deriveChatTitle(draft)
          settle(title.length === 0 ? null : title)
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') {
            return
          }

          event.preventDefault()
          settle(null)
        }}
        className={clsx(
          'h-5 w-full rounded-sm border-0 bg-transparent p-0 text-sm leading-5',
          'text-neutral-800 dark:text-neutral-100',
          'focus:outline-none focus-visible:inset-ring-1',
          'focus-visible:inset-ring-neutral-300 dark:focus-visible:inset-ring-neutral-600',
        )}
      />
      <ChatModelLine chat={chat} modelWarning={modelWarning} />
    </form>
  )
}
