import {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { Message } from '@/types'

interface ChatContextValue {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  isSending: boolean
  setIsSending: React.Dispatch<React.SetStateAction<boolean>>
  // A ref rather than state because the stream subscription is registered once
  // and would otherwise capture a stale id when it persists a finished turn.
  // `null` means the conversation hasn't been saved yet.
  activeChatId: React.RefObject<string | null>
  // Tracks the in-flight assistant placeholder the stream subscription updates.
  streamingAssistantMessageIdRef: React.RefObject<string | null>
  startNewChat: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isSending, setIsSending] = useState(false)
  const activeChatId = useRef<string | null>(null)
  const streamingAssistantMessageIdRef = useRef<string | null>(null)

  const startNewChat = useCallback(() => {
    void window.electronApi.stopGeneration()
    activeChatId.current = null
    streamingAssistantMessageIdRef.current = null
    setIsSending(false)
    setMessages([])
  }, [])

  const value = useMemo(
    () => ({
      messages,
      setMessages,
      isSending,
      setIsSending,
      activeChatId,
      streamingAssistantMessageIdRef,
      startNewChat,
    }),
    [messages, isSending, startNewChat],
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
