import { clsx } from 'clsx'
import type { Ref } from 'react'
import type { Message } from '@/Chat'
import { useTranslation } from '@/contexts/LocaleContext'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { CopyButton } from '@/ui/CopyButton'
import { AssistantMessage } from './AssistantMessage'

interface ChatMessageProps {
  message: Message
  ref?: Ref<HTMLElement> | undefined
}

export function ChatMessage({ message, ref }: ChatMessageProps) {
  const { t } = useTranslation()
  const { copyStatus, copy } = useCopyToClipboard()
  const isUser = message.role === 'user'
  const canCopy = message.content.length > 0

  return (
    <article
      ref={ref}
      className={clsx(
        'group flex flex-col gap-1',
        isUser ? 'items-end self-end' : 'items-start self-start',
      )}
    >
      {isUser ? (
        <div
          className={clsx(
            'rounded-2xl px-4 py-2 whitespace-pre-wrap select-text',
            'bg-neutral-200 dark:bg-neutral-700',
          )}
        >
          {message.content}
        </div>
      ) : (
        <AssistantMessage message={message} />
      )}

      {canCopy && (
        <CopyButton
          copyStatus={copyStatus}
          onClick={() => void copy(message.content)}
          labels={{
            copy: t('chat.copy'),
            copied: t('chat.copied'),
            error: t('chat.copyFailed'),
          }}
          className={clsx(
            'opacity-0 transition-opacity duration-200',
            'group-hover:opacity-100 focus-visible:opacity-100',
          )}
        />
      )}
    </article>
  )
}
