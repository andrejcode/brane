import { clsx } from 'clsx'
import { Pencil, Trash2 } from 'lucide-react'
import { useRef } from 'react'
import { useTranslation } from '@/contexts/LocaleContext'
import { BaseButton } from '@/ui/buttons/BaseButton'
import { Menu, MenuItem } from '@/ui/Menu'
import type { MenuHandle } from '@/ui/Menu'
import type { ChatSummary } from '@shared/types'
import { ChatModelLine } from './ChatModelLine'
import { ChatTitleEditor } from './ChatTitleEditor'

interface ChatListItemProps {
  chat: ChatSummary
  isActive: boolean
  isRenaming: boolean
  onOpen: (chatId: string) => Promise<void>
  onStartRename: () => void
  onStopRename: () => void
  onRename: (chatId: string, title: string) => Promise<void>
  onRequestDelete: (chat: ChatSummary) => void
}

export function ChatListItem({
  chat,
  isActive,
  isRenaming,
  onOpen,
  onStartRename,
  onStopRename,
  onRename,
  onRequestDelete,
}: ChatListItemProps) {
  const { t } = useTranslation()
  const actionsMenuRef = useRef<MenuHandle>(null)
  const label = chat.title ?? t('sidebar.untitledChat')
  const modelWarning =
    chat.modelAvailability === 'missing'
      ? t('sidebar.modelMissing')
      : chat.modelAvailability === 'replaced'
        ? t('sidebar.modelReplaced')
        : null

  return (
    <li
      onContextMenu={(event) => {
        if (isRenaming) {
          return
        }

        event.preventDefault()
        actionsMenuRef.current?.open()
      }}
      className={clsx(
        'group flex h-14 items-center justify-between gap-1 rounded-lg pr-1',
        'transition-colors duration-200',
        'hover:bg-neutral-200 dark:hover:bg-neutral-800',
        isActive && 'bg-neutral-200 dark:bg-neutral-800',
      )}
    >
      {isRenaming ? (
        <ChatTitleEditor
          chat={chat}
          initialTitle={chat.title ?? ''}
          placeholder={t('sidebar.untitledChat')}
          ariaLabel={t('general.rename')}
          modelWarning={modelWarning}
          onCommit={(title) => {
            onStopRename()

            if (title !== (chat.title ?? '')) {
              void onRename(chat.id, title)
            }
          }}
          onCancel={onStopRename}
        />
      ) : (
        <>
          {/* Both flex children need min-w-0, or the label would push the
              actions out instead of truncating. */}
          <BaseButton
            type="button"
            className="min-w-0 flex-1 rounded-lg px-2 py-2 text-left"
            onClick={() => {
              void onOpen(chat.id)
            }}
          >
            <span
              className="block truncate text-sm text-neutral-800 dark:text-neutral-100"
              title={label}
            >
              {label}
            </span>
            <ChatModelLine chat={chat} modelWarning={modelWarning} />
          </BaseButton>

          <div
            className={clsx(
              'shrink-0',
              'opacity-0 transition-opacity',
              'group-hover:opacity-100 group-focus-within:opacity-100',
              'has-aria-expanded:opacity-100',
            )}
          >
            <Menu
              ref={actionsMenuRef}
              label={t('sidebar.chatActions')}
              triggerClassName="flex size-8 items-center justify-center"
            >
              <MenuItem onSelect={onStartRename}>
                <Pencil size={16} />
                {t('general.rename')}
              </MenuItem>
              <MenuItem
                isDestructive
                onSelect={() => {
                  onRequestDelete(chat)
                }}
              >
                <Trash2 size={16} />
                {t('general.delete')}
              </MenuItem>
            </Menu>
          </div>
        </>
      )}
    </li>
  )
}
