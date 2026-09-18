export const MIN_CHAT_TITLE_LENGTH = 50
export const MAX_CHAT_TITLE_LENGTH = 60

// Visual overflow is handled with CSS truncation in the sidebar. This cap only
// keeps the stored title (and the delete confirmation) from holding the entire
// first message.
export function deriveChatTitle(content: string) {
  const firstLine = content.trim().split(/\r?\n/u, 1)[0] ?? ''
  const normalizedTitle = firstLine.replace(/\s+/gu, ' ').trim()

  if (normalizedTitle.length <= MAX_CHAT_TITLE_LENGTH) {
    return normalizedTitle
  }

  const titleRange = normalizedTitle.slice(
    MIN_CHAT_TITLE_LENGTH,
    MAX_CHAT_TITLE_LENGTH + 1,
  )
  const boundaryInRange = titleRange.lastIndexOf(' ')

  if (boundaryInRange >= 0) {
    return normalizedTitle.slice(0, MIN_CHAT_TITLE_LENGTH + boundaryInRange)
  }

  const earlierBoundary = normalizedTitle.lastIndexOf(
    ' ',
    MIN_CHAT_TITLE_LENGTH - 1,
  )

  if (earlierBoundary >= 0) {
    return normalizedTitle.slice(0, earlierBoundary)
  }

  return normalizedTitle.slice(0, MAX_CHAT_TITLE_LENGTH)
}
