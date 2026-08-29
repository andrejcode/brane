export const MAX_CHAT_TITLE_LENGTH = 80

// Visual overflow is handled with CSS truncation in the sidebar. This cap only
// keeps the stored title (and the delete confirmation) from holding the entire
// first message.
export function deriveChatTitle(content: string) {
  const firstLine = content.trim().split(/\r?\n/u, 1)[0] ?? ''

  return firstLine
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, MAX_CHAT_TITLE_LENGTH)
    .trimEnd()
}
