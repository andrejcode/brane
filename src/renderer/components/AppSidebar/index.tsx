import { clsx } from 'clsx'
import { SquarePen } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { useTranslation } from '@/contexts/LocaleContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { useDebouncedQuery } from '@/hooks/useDebouncedQuery'
import { GhostButton } from '@/ui/buttons/GhostButton'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { ScrollArea } from '@/ui/ScrollArea'
import { SearchInput } from '@/ui/SearchInput'
import { Sidebar } from '@/ui/Sidebar'
import type { ChatSummary } from '@shared/types'
import { ChatListItem } from './ChatListItem'

export function AppSidebar() {
  const { t } = useTranslation()
  const { isSidebarOpen, isReady, setSearchInput } = useSidebar()
  const {
    chats,
    activeChatId,
    isHistoryUnavailable,
    startNewChat,
    openChat,
    removeChat,
    renameChat,
  } = useChat()
  const [chatPendingDeletion, setChatPendingDeletion] =
    useState<ChatSummary | null>(null)
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null)
  const { query, debouncedQuery, normalizedQuery, setQuery } =
    useDebouncedQuery({ resetOnActivate: isSidebarOpen })
  const hasChats = chats.length > 0
  const emptyMessage = isHistoryUnavailable
    ? t('sidebar.historyUnavailable')
    : t('sidebar.noChats')

  const filteredChats = useMemo(() => {
    if (!normalizedQuery) return chats

    return chats.filter((chat) =>
      (chat.title ?? t('sidebar.untitledChat'))
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [chats, normalizedQuery, t])

  if (!isReady) {
    return null
  }

  return (
    <>
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        className="flex h-full flex-col pt-14"
      >
        <div className="flex flex-col gap-1 px-2">
          <GhostButton
            ariaLabel={t('chat.newChat')}
            className={clsx(
              'flex h-8 w-full items-center gap-2 px-2 text-left',
              'text-sm font-medium',
              'hover:bg-neutral-200! dark:hover:bg-neutral-700!',
            )}
            onClick={startNewChat}
          >
            <SquarePen size={18} className="shrink-0" />
            {t('chat.newChat')}
          </GhostButton>

          <SearchInput
            inputRef={setSearchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setQuery('')
                event.currentTarget.blur()
              } else if (event.key === 'Enter') {
                event.currentTarget.blur()
              }
            }}
            disabled={!hasChats}
            placeholder={t('sidebar.search')}
            ariaLabel={t('sidebar.search')}
            className={clsx('h-8 w-full px-2')}
            inputClassName="text-sm"
          />
        </div>

        <div className="px-4 pt-5 pb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          {t('sidebar.recentChats')}
        </div>
        {!hasChats ? (
          <p className="px-4 py-2 text-sm text-neutral-400 dark:text-neutral-500">
            {emptyMessage}
          </p>
        ) : filteredChats.length === 0 ? (
          <p className="px-4 py-2 text-sm text-neutral-400 dark:text-neutral-500">
            {t('sidebar.noMatch', { query: debouncedQuery })}
          </p>
        ) : (
          <ScrollArea
            className="flex-1"
            viewportClassName="px-2 pb-4"
            tone="sidebar"
          >
            <ul aria-label={t('sidebar.recentChats')} className="space-y-0.5">
              {filteredChats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === activeChatId}
                  isRenaming={chat.id === renamingChatId}
                  onOpen={openChat}
                  onStartRename={() => {
                    setRenamingChatId(chat.id)
                  }}
                  onStopRename={() => {
                    setRenamingChatId(null)
                  }}
                  onRename={renameChat}
                  onRequestDelete={setChatPendingDeletion}
                />
              ))}
            </ul>
          </ScrollArea>
        )}
      </Sidebar>

      <ConfirmDialog
        isOpen={chatPendingDeletion !== null}
        title={t('sidebar.deleteChatConfirmTitle')}
        message={t('sidebar.deleteChatConfirmMessage', {
          title: chatPendingDeletion?.title ?? t('sidebar.untitledChat'),
        })}
        confirmLabel={t('general.delete')}
        isDestructive
        onCancel={() => setChatPendingDeletion(null)}
        onConfirm={() => {
          if (chatPendingDeletion) {
            void removeChat(chatPendingDeletion.id)
          }
          setChatPendingDeletion(null)
        }}
      />
    </>
  )
}
