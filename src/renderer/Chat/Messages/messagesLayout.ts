export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export interface ScrollbarMetricsInput {
  scrollHeight: number
  clientHeight: number
  scrollTop: number
  headerHeight: number
  // Space reserved for the docked composer so the track ends at its top edge
  bottomInset: number
  minimumThumbHeight: number
  thumbScale: number
}

export type ScrollbarMetrics =
  | { isVisible: false }
  | { isVisible: true; thumbHeight: number; thumbTop: number }

// Derives the custom scrollbar geometry from the scroll container measurements
export function computeScrollbarMetrics({
  scrollHeight,
  clientHeight,
  scrollTop,
  headerHeight,
  bottomInset,
  minimumThumbHeight,
  thumbScale,
}: ScrollbarMetricsInput): ScrollbarMetrics {
  const maxScrollTop = scrollHeight - clientHeight
  const trackHeight = clientHeight - headerHeight - bottomInset

  if (maxScrollTop <= 0 || trackHeight <= 0) {
    return { isVisible: false }
  }

  const proportionalThumbHeight = (clientHeight / scrollHeight) * trackHeight
  const thumbHeight = Math.max(
    minimumThumbHeight,
    proportionalThumbHeight * thumbScale,
  )
  const maxThumbTop = trackHeight - thumbHeight
  const thumbTop = (scrollTop / maxScrollTop) * maxThumbTop

  return { isVisible: true, thumbHeight, thumbTop }
}

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
