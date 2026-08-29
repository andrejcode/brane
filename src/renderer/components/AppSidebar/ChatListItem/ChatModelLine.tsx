import { TriangleAlert } from 'lucide-react'
import { formatModelName } from '@/utils'
import type { ChatSummary } from '@shared/types'

interface ChatModelLineProps {
  chat: ChatSummary
  modelWarning: string | null
}

export function ChatModelLine({ chat, modelWarning }: ChatModelLineProps) {
  return (
    <span
      className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400"
      title={modelWarning ?? undefined}
    >
      {modelWarning !== null && (
        <TriangleAlert
          size={12}
          className="shrink-0 text-amber-600 dark:text-amber-500"
          aria-label={modelWarning}
        />
      )}
      <span className="truncate">{formatModelName(chat.modelFile)}</span>
    </span>
  )
}
