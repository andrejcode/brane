import type { GenerationMetrics } from '@shared/types'

export interface ContextUsage {
  used: number
  size: number
}

export interface Message {
  id: string
  role: 'assistant' | 'user'
  content: string
  createdAt: number
  reasoning?: string
  isThinking?: boolean
  contextUsage?: ContextUsage
  generationMetrics?: GenerationMetrics
}
