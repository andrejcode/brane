import { clsx } from 'clsx'
import { Trash2, TriangleAlert } from 'lucide-react'
import { useTranslation } from '@/contexts/LocaleContext'
import { BaseButton } from '@/ui/buttons/BaseButton'
import { GhostButton } from '@/ui/buttons/GhostButton'
import { formatModelName } from '@/utils'
import type { ChatSummary } from '@shared/types'

interface ChatListItemProps {
  chat: ChatSummary
  isActive: boolean
  onOpen: (chatId: string) => Promise<void>
  onRequestDelete: (chat: ChatSummary) => void
}

export function ChatListItem({
  chat,
  isActive,
  onOpen,
  onRequestDelete,
}: ChatListItemProps) {
  const { t } = useTranslation()
  const label = chat.title ?? t('sidebar.untitledChat')
  const modelWarning =
    chat.modelAvailability === 'missing'
      ? t('sidebar.modelMissing')
      : chat.modelAvailability === 'replaced'
        ? t('sidebar.modelReplaced')
        : null

  return (
    <li
      className={clsx(
        'group flex items-center justify-between gap-1 rounded-lg pr-1',
        'transition-colors duration-200',
        'hover:bg-neutral-200 dark:hover:bg-neutral-800',
        isActive && 'bg-neutral-200 dark:bg-neutral-800',
      )}
    >
      {/* Both flex children need min-w-0, or the label would push the button out
          instead of truncating. */}
      <BaseButton
        type="button"
        className="min-w-0 flex-1 rounded-lg px-2 py-2 text-left"
        onClick={() => {
          void onOpen(chat.id)
        }}
      >
        <span className="block truncate text-sm text-neutral-800 dark:text-neutral-100">
          {label}
        </span>
        <span
          className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400"
          title={modelWarning ?? undefined}
        >
          {modelWarning !== null && (
            <TriangleAlert
              size={12}
              className="shrink-0 text-amber-600 dark:text-amber-500"
              aria-label={modelWarning}
            />
          )}
          <span className="truncate">{formatModelName(chat.modelFile)}</span>
        </span>
      </BaseButton>

      <GhostButton
        className={clsx(
          'flex size-8 shrink-0 items-center justify-center',
          'opacity-0 transition-opacity',
          'group-hover:opacity-100 focus-visible:opacity-100',
        )}
        title={t('sidebar.deleteChat')}
        ariaLabel={t('sidebar.deleteChat')}
        onClick={() => onRequestDelete(chat)}
      >
        <Trash2 size={16} />
      </GhostButton>
    </li>
  )
}
