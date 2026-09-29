import { clsx } from 'clsx'
import type { Ref } from 'react'
import { useTranslation } from '@/contexts/LocaleContext'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import type { Message } from '@/types'
import { CopyButton } from '@/ui/buttons/CopyButton'
import { Tag } from '@/ui/Tag'
import { TooltipTrigger } from '@/ui/Tooltip'
import type { LlamaStopReason } from '@shared/types'
import { AssistantMessage } from './AssistantMessage'

interface ChatMessageProps {
  message: Message
  showMessageDates: boolean
  showStatistics: boolean
  ref?: Ref<HTMLElement> | undefined
}

function formatDuration(milliseconds: number, locale: string) {
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds).toLocaleString(locale)} ms`
  }

  return `${(milliseconds / 1000).toLocaleString(locale, {
    maximumFractionDigits: 1,
  })} s`
}

function getStopReasonLabel(
  stopReason: LlamaStopReason,
  t: ReturnType<typeof useTranslation>['t'],
) {
  return t(`chat.stopReason.${stopReason}`)
}

export function ChatMessage({
  message,
  showMessageDates,
  showStatistics,
  ref,
}: ChatMessageProps) {
  const { t, locale } = useTranslation()
  const { copyStatus, copy } = useCopyToClipboard()
  const isUser = message.role === 'user'
  const canCopy = message.content.length > 0
  const generationMetrics = message.generationMetrics
  const formattedDate = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(message.createdAt)

  return (
    <article
      ref={ref}
      style={{ fontSize: 'var(--message-font-size, 16px)' }}
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

      {(canCopy ||
        showMessageDates ||
        (showStatistics && generationMetrics)) && (
        <div
          className={clsx(
            'flex flex-wrap items-center gap-2 text-xs text-neutral-500',
            'opacity-0 transition-opacity duration-200',
            'group-hover:opacity-100 group-focus-within:opacity-100',
          )}
        >
          {showMessageDates && (
            <time dateTime={new Date(message.createdAt).toISOString()}>
              {formattedDate}
            </time>
          )}
          {showStatistics && !isUser && generationMetrics && (
            <>
              <TooltipTrigger tooltip={t('chat.generatedTokens')}>
                <Tag>
                  {t('chat.tokenCount', {
                    count: generationMetrics.tokenCount.toLocaleString(locale),
                  })}
                </Tag>
              </TooltipTrigger>
              <TooltipTrigger tooltip={t('chat.tokensPerSecond')}>
                <Tag>
                  {t('chat.tokenRate', {
                    rate: generationMetrics.tokensPerSecond.toLocaleString(
                      locale,
                      { maximumFractionDigits: 1 },
                    ),
                  })}
                </Tag>
              </TooltipTrigger>
              <TooltipTrigger tooltip={t('chat.timeToFirstToken')}>
                <Tag>
                  {formatDuration(generationMetrics.timeToFirstTokenMs, locale)}
                </Tag>
              </TooltipTrigger>
              <TooltipTrigger tooltip={t('chat.stopReason')}>
                <Tag>{getStopReasonLabel(generationMetrics.stopReason, t)}</Tag>
              </TooltipTrigger>
            </>
          )}
          {canCopy && (
            <CopyButton
              copyStatus={copyStatus}
              onClick={() => void copy(message.content)}
              labels={{
                copy: t('chat.copyResponse'),
                copied: t('chat.copied'),
                error: t('chat.copyFailed'),
              }}
            />
          )}
        </div>
      )}
    </article>
  )
}
