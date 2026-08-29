import { useState } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { useTranslation } from '@/contexts/LocaleContext'
import { useSidebar } from '@/contexts/SidebarContext'
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
  const emptyMessage = isHistoryUnavailable
    ? t('sidebar.historyUnavailable')
    : t('sidebar.noChats')

  if (!isReady) {
    return null
  }

  return (
    <>
      <Sidebar isSidebarOpen={isSidebarOpen}>
        <div className="flex h-full flex-col pt-12">
          <div className="px-4 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {t('sidebar.chats')}
          </div>

          {chats.length === 0 ? (
            <p className="px-4 py-2 text-sm text-neutral-400 dark:text-neutral-500">
              {emptyMessage}
            </p>
          ) : (
            <ul
              aria-label={t('sidebar.chats')}
              className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-4"
            >
              {chats.map((chat) => (
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
