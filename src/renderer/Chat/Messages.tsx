import type { ChatMessage } from '.'

interface MessagesProps {
  messages: ChatMessage[]
}

export function Messages({ messages }: MessagesProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-8 pt-4 pb-8">
        {messages.map((message) => (
          <article
            key={message.id}
            className={
              message.role === 'user'
                ? 'self-end rounded-2xl bg-neutral-200 px-4 py-2 whitespace-pre-wrap dark:bg-neutral-700'
                : 'self-start whitespace-pre-wrap'
            }
          >
            {message.content}
          </article>
        ))}
      </div>
    </div>
  )
}
