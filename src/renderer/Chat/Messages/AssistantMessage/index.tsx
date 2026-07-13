import type { Message } from '@/Chat'
import { LoadingSpinner } from '@/ui/LoadingSpinner'
import { MarkdownRenderer } from './MarkdownRenderer'
import { ReasoningSection } from './ReasoningSection'

interface AssistantMessageProps {
  message: Message
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  const reasoning = message.reasoning ?? ''
  const hasContent = message.content.length > 0
  // Nothing has streamed yet, so we're still waiting on the first chunk.
  const isAwaitingResponse = reasoning.length === 0 && !hasContent

  return (
    <div className="flex flex-col gap-2">
      {reasoning.length > 0 && (
        <ReasoningSection
          reasoning={reasoning}
          isThinking={message.isThinking ?? false}
        />
      )}

      {isAwaitingResponse && (
        <LoadingSpinner isLoading size={16} className="text-neutral-500" />
      )}

      {hasContent && <MarkdownRenderer content={message.content} />}
    </div>
  )
}
