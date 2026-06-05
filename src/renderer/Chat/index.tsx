import { clsx } from 'clsx'
import {
  type SubmitEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { ChatInput } from './ChatInput'
import { Messages } from './Messages'

export interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
}

function createMessageId() {
  return crypto.randomUUID()
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'An unknown error occurred'
}

export function Chat() {
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  // The composer floats over messages, so messages need matching bottom padding
  const [bottomOverlayInset, setBottomOverlayInset] = useState(0)
  const bottomOverlayRef = useRef<HTMLDivElement>(null)
  const bottomFadeRef = useRef<HTMLDivElement>(null)
  const streamingAssistantMessageId = useRef<string | null>(null)

  const updateBottomOverlayInset = useCallback(() => {
    const bottomOverlay = bottomOverlayRef.current

    if (!bottomOverlay) {
      return
    }

    const bottomEdge = window.innerHeight
    const overlayTop = bottomOverlay.getBoundingClientRect().top
    const fadeTop = bottomFadeRef.current?.getBoundingClientRect().top
    // Include the fade because it visually covers messages above the input
    const visualTop = Math.min(overlayTop, fadeTop ?? overlayTop)

    setBottomOverlayInset(bottomEdge - visualTop)
  }, [])

  useEffect(() => {
    const unsubscribe = window.electronApi.streamResponse((event) => {
      const activeMessageId = streamingAssistantMessageId.current

      if (event.type === 'chunk') {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === activeMessageId
              ? { ...message, content: message.content + event.text }
              : message,
          ),
        )

        return
      }

      if (event.type === 'done') {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === activeMessageId && message.content.length === 0
              ? { ...message, content: event.response }
              : message,
          ),
        )
        streamingAssistantMessageId.current = null
        setIsSending(false)

        return
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === activeMessageId
            ? { ...message, content: `Error: ${event.message}` }
            : message,
        ),
      )
      streamingAssistantMessageId.current = null
      setIsSending(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const bottomOverlay = bottomOverlayRef.current

    if (!bottomOverlay) {
      return
    }

    const resizeObserver = new ResizeObserver(updateBottomOverlayInset)
    const animationFrame = requestAnimationFrame(updateBottomOverlayInset)

    resizeObserver.observe(bottomOverlay)

    if (bottomFadeRef.current) {
      resizeObserver.observe(bottomFadeRef.current)
    }

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
    }
  }, [updateBottomOverlayInset])

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()

    const prompt = input.trim()

    if (prompt.length === 0 || isSending) {
      return
    }

    const assistantMessageId = createMessageId()

    streamingAssistantMessageId.current = assistantMessageId
    setInput('')
    setIsSending(true)
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: createMessageId(),
        role: 'user',
        content: prompt,
      },
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
      },
    ])

    void window.electronApi.sendPrompt(prompt).catch((error: unknown) => {
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === assistantMessageId
            ? { ...message, content: `Error: ${getErrorMessage(error)}` }
            : message,
        ),
      )
      streamingAssistantMessageId.current = null
      setIsSending(false)
    })
  }

  return (
    <main className="relative flex min-h-0 w-full flex-1">
      <Messages messages={messages} bottomInset={bottomOverlayInset} />

      {/* This overlay is outside normal layout, so we measure it above */}
      <div
        ref={bottomOverlayRef}
        className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-4"
      >
        <div className="mx-auto w-full max-w-4xl">
          <div className="pointer-events-auto relative">
            <div
              ref={bottomFadeRef}
              className={clsx(
                'pointer-events-none absolute inset-x-0 bottom-0',
                'h-24 translate-y-4',
                'bg-white/1 dark:bg-black/1',
                'backdrop-blur-[3px]',
                'mask-[linear-gradient(to_top,black_0%,black_55%,transparent_100%)]',
              )}
            />

            <div className="relative z-10">
              <ChatInput
                input={input}
                isSending={isSending}
                onSubmit={handleSubmit}
                setInput={setInput}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
