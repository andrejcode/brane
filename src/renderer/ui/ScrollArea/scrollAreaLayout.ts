export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

interface ScrollbarMetricsInput {
  scrollHeight: number
  clientHeight: number
  scrollTop: number
  headerInset: number
  bottomInset: number
  trackInset: number
  minimumThumbHeight: number
  thumbScale: number
}

export type ScrollbarMetrics =
  | { isVisible: false }
  | { isVisible: true; thumbHeight: number; thumbTop: number }

export function computeScrollbarMetrics({
  scrollHeight,
  clientHeight,
  scrollTop,
  headerInset,
  bottomInset,
  trackInset,
  minimumThumbHeight,
  thumbScale,
}: ScrollbarMetricsInput): ScrollbarMetrics {
  const maxScrollTop = scrollHeight - clientHeight
  const trackHeight = clientHeight - headerInset - bottomInset - trackInset * 2

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
