import { type SubmitEventHandler, useEffect, useRef, useState } from 'react'

type ChatMessage = {
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

export function App() {
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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-4xl font-bold">Brane Chat</h1>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
          }}
          placeholder="Write a message..."
          className="flex-1 rounded-md border-2 border-gray-300 p-2"
        />
        <button
          type="submit"
          disabled={isSending || input.trim().length === 0}
          className="cursor-pointer rounded-md border-2 border-gray-300 p-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>

      <div className="flex flex-1 flex-col gap-3">
        {messages.map((message) => (
          <article
            key={message.id}
            className={
              message.role === 'user'
                ? 'self-end rounded-md bg-neutral-900 px-3 py-2 text-white'
                : 'self-start whitespace-pre-wrap rounded-md bg-gray-100 px-3 py-2 text-gray-900'
            }
          >
            {message.content || '...'}
          </article>
        ))}
      </div>
    </main>
  )
}
