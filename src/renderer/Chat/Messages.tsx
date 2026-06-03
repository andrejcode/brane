import type { ChatMessage } from '.'

interface MessagesProps {
  messages: ChatMessage[]
}

export function Messages({ messages }: MessagesProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
      {messages.map((message) => (
        <article
          key={message.id}
          className={
            message.role === 'user'
              ? 'self-end rounded-2xl bg-neutral-200 px-4 py-2 whitespace-pre-wrap dark:bg-neutral-700'
              : 'self-start whitespace-pre-wrap'
          }
        >
          {message.content || '...'}
        </article>
      ))}
    </div>
  )
}
