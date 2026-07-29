// A textarea is considered multiline once its content needs noticeably more
// than a single row. The 1.5x guard avoids flipping on sub-pixel rounding
export function isMultilineHeight(scrollHeight: number, lineHeight: number) {
  return scrollHeight > lineHeight * 1.5
}

export interface TextareaHeightInput {
  scrollHeight: number
  lineHeight: number
  maxRows: number
}

export interface TextareaHeight {
  height: number
  overflowY: 'auto' | 'hidden'
}

// Caps the textarea growth at maxRows and switches to internal scrolling once
// the content exceeds that cap
export function resolveTextareaHeight({
  scrollHeight,
  lineHeight,
  maxRows,
}: TextareaHeightInput): TextareaHeight {
  const maxHeight = lineHeight * maxRows
  const height = Math.min(scrollHeight, maxHeight)
  const overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden'

  return { height, overflowY }
}
