import { type SubmitEventHandler, useEffect, useRef, useState } from 'react'
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'An unknown error occurred'
}

export function Chat() {
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const streamingAssistantMessageId = useRef<string | null>(null)

  useEffect(() => {
    const unsubscribe = window.electronApi.streamResponse((event) => {
      if (event.type === 'chunk') {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === streamingAssistantMessageId.current
              ? { ...message, content: message.content + event.text }
              : message,
          ),
        )

        return
      }

      if (event.type === 'done') {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === streamingAssistantMessageId.current &&
            message.content.length === 0
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
          message.id === streamingAssistantMessageId.current
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
    <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <Messages messages={messages} />

      <ChatInput
        input={input}
        isSending={isSending}
        onSubmit={handleSubmit}
        setInput={setInput}
      />
    </main>
  )
}
