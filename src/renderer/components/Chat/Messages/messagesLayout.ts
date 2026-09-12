export interface TailBottomInsetInput {
  clientHeight: number
  headerHeight: number
  tailHeight: number
}

// Extra padding that lets a short final turn sit alone just below the header
export function computeTailBottomInset({
  clientHeight,
  headerHeight,
  tailHeight,
}: TailBottomInsetInput) {
  const availableHeight = clientHeight - headerHeight

  return Math.max(0, availableHeight - tailHeight)
}
