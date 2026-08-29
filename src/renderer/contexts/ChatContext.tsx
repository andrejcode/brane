import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { Message } from '@/types'
import { createId } from '@/utils'
import type { ChatSummary, StoredMessage } from '@shared/types'
import { useAlert } from './AlertContext'
import { useTranslation } from './LocaleContext'

interface EnsureActiveChatOptions {
  title: string
  modelFile: string
}

interface ChatContextValue {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  isSending: boolean
  setIsSending: React.Dispatch<React.SetStateAction<boolean>>
  // Tracks the in-flight assistant placeholder the stream subscription updates.
  streamingAssistantMessageIdRef: React.RefObject<string | null>
  chats: ChatSummary[]
  activeChatId: string | null
  activeChat: ChatSummary | null
  isLoadingChat: boolean
  isHistoryUnavailable: boolean
  refreshChats: () => Promise<void>
  openChat: (chatId: string) => Promise<void>
  removeChat: (chatId: string) => Promise<void>
  renameChat: (chatId: string, title: string) => Promise<void>
  ensureActiveChat: (options: EnsureActiveChatOptions) => Promise<string>
  canStartNewChat: boolean
  startNewChat: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

function toMessage(stored: StoredMessage): Message {
  return {
    id: stored.id,
    role: stored.role,
    content: stored.content,
    ...(stored.reasoning === null ? {} : { reasoning: stored.reasoning }),
  }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { showAlert } = useAlert()
  const { t } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([])
  const [isSending, setIsSending] = useState(false)
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [isHistoryUnavailable, setIsHistoryUnavailable] = useState(false)
  const streamingAssistantMessageIdRef = useRef<string | null>(null)
  // Switching chats is meant to feel instant, so a slower earlier load must not
  // land on top of the chat the user is looking at now.
  const openRequestRef = useRef(0)

  const refreshChats = useCallback(async () => {
    try {
      setChats(await window.electronApi.listChats())
    } catch {
      // A failed refresh leaves the list as it was; the next one can recover.
    }
  }, [])

  // A list that can't be read at all means persistence is broken, which the
  // sidebar says outright rather than through an alert the user can dismiss.
  useEffect(() => {
    let isMounted = true

    void window.electronApi
      .listChats()
      .then((storedChats) => {
        if (isMounted) {
          setChats(storedChats)
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsHistoryUnavailable(true)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  // A model appearing or disappearing changes whether stored chats can still be
  // continued, which the list reports per chat.
  useEffect(() => {
    return window.electronApi.onModelStateChange(() => {
      void refreshChats()
    })
  }, [refreshChats])

  // Callers decide which chat, if any, becomes active afterwards.
  const resetConversation = useCallback(() => {
    void window.electronApi.stopGeneration()
    streamingAssistantMessageIdRef.current = null
    setIsSending(false)
    setMessages([])
  }, [])

  // An unsaved conversation with nothing in it already is a new chat, so asking
  // for another one has nothing to reset.
  const canStartNewChat = activeChatId !== null || messages.length > 0

  const startNewChat = useCallback(() => {
    if (!canStartNewChat) {
      return
    }

    openRequestRef.current++
    resetConversation()
    setActiveChatId(null)
  }, [canStartNewChat, resetConversation])

  // Only the stored messages are loaded here. The chat's model stays untouched
  // until a prompt is actually sent, so browsing chats costs nothing.
  const openChat = useCallback(
    async (chatId: string) => {
      if (chatId === activeChatId) {
        return
      }

      const requestId = ++openRequestRef.current
      resetConversation()
      setActiveChatId(chatId)
      setIsLoadingChat(true)

      try {
        const stored = await window.electronApi.getChatMessages(chatId)

        if (openRequestRef.current === requestId) {
          setMessages(stored.map(toMessage))
        }
      } catch {
        if (openRequestRef.current === requestId) {
          showAlert(t('sidebar.openChatFailed'), 'error')
        }
      } finally {
        if (openRequestRef.current === requestId) {
          setIsLoadingChat(false)
        }
      }
    },
    [activeChatId, resetConversation, showAlert, t],
  )

  const removeChat = useCallback(
    async (chatId: string) => {
      try {
        await window.electronApi.deleteChat(chatId)

        if (chatId === activeChatId) {
          startNewChat()
        }

        await refreshChats()
      } catch {
        showAlert(t('sidebar.deleteChatFailed'), 'error')
      }
    },
    [activeChatId, refreshChats, showAlert, startNewChat, t],
  )

  const renameChat = useCallback(
    async (chatId: string, title: string) => {
      let previousTitle: string | null | undefined

      setChats((currentChats) =>
        currentChats.map((chat) => {
          if (chat.id !== chatId) {
            return chat
          }

          previousTitle = chat.title
          return { ...chat, title }
        }),
      )

      try {
        await window.electronApi.renameChat(chatId, title)
      } catch {
        setChats((currentChats) =>
          currentChats.map((chat) =>
            chat.id === chatId && previousTitle !== undefined
              ? { ...chat, title: previousTitle }
              : chat,
          ),
        )
        showAlert(t('sidebar.renameChatFailed'), 'error')
      }
    },
    [showAlert, t],
  )

  // The id is generated here so the conversation stays addressable even when it
  // can't be stored. The title is painted into the list first, then persisted
  // with the chat row; a failed write drops the list item but keeps the id.
  const ensureActiveChat = useCallback(
    async ({ title, modelFile }: EnsureActiveChatOptions) => {
      if (activeChatId !== null) {
        return activeChatId
      }

      const chatId = createId()
      setActiveChatId(chatId)
      setChats((currentChats) => [
        {
          id: chatId,
          title,
          modelFile,
          modelAvailability: 'available',
          updatedAt: Date.now(),
        },
        ...currentChats,
      ])

      try {
        await window.electronApi.createChat(chatId, title)
        await refreshChats()
      } catch {
        setChats((currentChats) =>
          currentChats.filter((chat) => chat.id !== chatId),
        )
        showAlert(t('chat.historyUnavailable'), 'error')
      }

      return chatId
    },
    [activeChatId, refreshChats, showAlert, t],
  )

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? null,
    [chats, activeChatId],
  )

  const value = useMemo(
    () => ({
      messages,
      setMessages,
      isSending,
      setIsSending,
      streamingAssistantMessageIdRef,
      chats,
      activeChatId,
      activeChat,
      isLoadingChat,
      isHistoryUnavailable,
      refreshChats,
      openChat,
      removeChat,
      renameChat,
      ensureActiveChat,
      canStartNewChat,
      startNewChat,
    }),
    [
      messages,
      isSending,
      chats,
      activeChatId,
      activeChat,
      isLoadingChat,
      isHistoryUnavailable,
      refreshChats,
      openChat,
      removeChat,
      renameChat,
      ensureActiveChat,
      canStartNewChat,
      startNewChat,
    ],
  )

  return <ChatContext value={value}>{children}</ChatContext>
}

export function useChat() {
  const context = use(ChatContext)

  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }

  return context
}
