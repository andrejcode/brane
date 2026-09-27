export interface Message {
  id: string
  role: 'assistant' | 'user'
  content: string
  createdAt: number
  reasoning?: string
  isThinking?: boolean
  contextUsage?: {
    used: number
    size: number
  }
}
