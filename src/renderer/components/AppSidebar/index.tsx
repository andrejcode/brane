import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { useTranslation } from '@/contexts/LocaleContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { useDebouncedQuery } from '@/hooks/useDebouncedQuery'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { Sidebar } from '@/ui/Sidebar'
import type { ChatSummary } from '@shared/types'
import { ChatListItem } from './ChatListItem'

export function AppSidebar() {
  const { t } = useTranslation()
  const { isSidebarOpen, isReady } = useSidebar()
  const {
    chats,
    activeChatId,
    isHistoryUnavailable,
    openChat,
    removeChat,
    renameChat,
  } = useChat()
  const [chatPendingDeletion, setChatPendingDeletion] =
    useState<ChatSummary | null>(null)
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null)
  const { query, debouncedQuery, setQuery, resetQuery } = useDebouncedQuery()
  const [wasSidebarOpen, setWasSidebarOpen] = useState(isSidebarOpen)
  const hasChats = chats.length > 0
  const emptyMessage = isHistoryUnavailable
    ? t('sidebar.historyUnavailable')
    : t('sidebar.noChats')

  if (isSidebarOpen !== wasSidebarOpen) {
    setWasSidebarOpen(isSidebarOpen)
    if (isSidebarOpen) {
      resetQuery()
    }
  }

  const filteredChats = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase()
    if (!normalized) return chats

    return chats.filter((chat) =>
      (chat.title ?? t('sidebar.untitledChat'))
        .toLowerCase()
        .includes(normalized),
    )
  }, [chats, debouncedQuery, t])

  if (!isReady) {
    return null
  }

  return (
    <>
      <Sidebar isSidebarOpen={isSidebarOpen}>
        <div className="flex h-full flex-col pt-12">
          <div
            role="search"
            className="mx-4 my-2 flex items-center gap-2 border-b border-neutral-200 py-2 dark:border-neutral-600"
          >
            <Search
              size={18}
              aria-hidden
              className="shrink-0 text-neutral-500 dark:text-neutral-400"
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={!hasChats}
              placeholder={t('sidebar.search')}
              aria-label={t('sidebar.search')}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed"
            />
          </div>
          <div className="px-4 pt-2 pb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
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
            <ul
              aria-label={t('sidebar.recentChats')}
              className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-4"
            >
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
          )}
        </div>
      </Sidebar>

      <ConfirmDialog
        isOpen={chatPendingDeletion !== null}
        title={t('sidebar.deleteChatConfirmTitle')}
        message={t('sidebar.deleteChatConfirmMessage', {
          title: chatPendingDeletion?.title ?? t('sidebar.untitledChat'),
        })}
        confirmLabel={t('sidebar.deleteChatConfirm')}
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
