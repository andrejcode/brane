import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { clamp, computeScrollbarMetrics } from './messagesLayout'

const MINIMUM_THUMB_HEIGHT = 20
const THUMB_SCALE = 0.85
const HIDE_DELAY = 900

interface UseScrollbarOptions {
  scrollContainerRef: RefObject<HTMLDivElement | null>
  headerHeight: number
  bottomInset: number
}

export interface ScrollbarController {
  trackRef: RefObject<HTMLDivElement | null>
  isVisible: boolean
  isActive: boolean
  isDraggingThumb: boolean
  thumbHeight: number
  thumbTop: number
  headerHeight: number
  bottomInset: number
  update: () => void
  scheduleUpdate: () => void
  showTemporarily: () => void
  onTrackPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onThumbPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onTrackPointerEnter: () => void
  onTrackPointerLeave: () => void
}

export function useScrollbar({
  scrollContainerRef,
  headerHeight,
  bottomInset,
}: UseScrollbarOptions): ScrollbarController {
  const trackRef = useRef<HTMLDivElement>(null)
  const updateFrameRef = useRef<number | null>(null)
  const hideTimeoutRef = useRef<number | null>(null)

  const [thumb, setThumb] = useState({
    isVisible: false,
    height: MINIMUM_THUMB_HEIGHT,
    top: 0,
  })
  const [isActive, setIsActive] = useState(false)
  const [isDraggingThumb, setIsDraggingThumb] = useState(false)

  // Expose the latest layout inputs to imperative listeners without forcing
  // them to re-subscribe whenever the composer or header size changes.
  const bottomInsetRef = useRef(bottomInset)
  const headerHeightRef = useRef(headerHeight)
  const thumbHeightRef = useRef(thumb.height)

  useEffect(() => {
    bottomInsetRef.current = bottomInset
    headerHeightRef.current = headerHeight
    thumbHeightRef.current = thumb.height
  }, [bottomInset, headerHeight, thumb.height])

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  const showTemporarily = useCallback(() => {
    clearHideTimeout()
    setIsActive(true)

    hideTimeoutRef.current = window.setTimeout(() => {
      hideTimeoutRef.current = null
      setIsActive(false)
    }, HIDE_DELAY)
  }, [clearHideTimeout])

  const update = useCallback(() => {
    const scrollContainer = scrollContainerRef.current

    if (!scrollContainer) {
      return
    }

    const metrics = computeScrollbarMetrics({
      scrollHeight: scrollContainer.scrollHeight,
      clientHeight: scrollContainer.clientHeight,
      scrollTop: scrollContainer.scrollTop,
      headerHeight: headerHeightRef.current,
      bottomInset: bottomInsetRef.current,
      minimumThumbHeight: MINIMUM_THUMB_HEIGHT,
      thumbScale: THUMB_SCALE,
    })

    if (!metrics.isVisible) {
      setThumb((current) => ({ ...current, isVisible: false, top: 0 }))
      return
    }

    setThumb({
      isVisible: true,
      height: metrics.thumbHeight,
      top: metrics.thumbTop,
    })
  }, [scrollContainerRef])

  const scheduleUpdate = useCallback(() => {
    if (updateFrameRef.current !== null) {
      cancelAnimationFrame(updateFrameRef.current)
    }

    updateFrameRef.current = requestAnimationFrame(() => {
      updateFrameRef.current = null
      update()
    })
  }, [update])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current

    if (!scrollContainer) {
      return
    }

    const resizeObserver = new ResizeObserver(scheduleUpdate)
    resizeObserver.observe(scrollContainer)

    if (scrollContainer.firstElementChild) {
      resizeObserver.observe(scrollContainer.firstElementChild)
    }

    scheduleUpdate()

    return () => {
      resizeObserver.disconnect()
    }
  }, [scheduleUpdate, scrollContainerRef])

  useEffect(() => {
    return () => {
      if (updateFrameRef.current !== null) {
        cancelAnimationFrame(updateFrameRef.current)
      }

      clearHideTimeout()
    }
  }, [clearHideTimeout])

  const onTrackPointerEnter = useCallback(() => {
    clearHideTimeout()
    setIsActive(true)
  }, [clearHideTimeout])

  const onTrackPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) {
        return
      }

      const scrollContainer = scrollContainerRef.current

      if (!scrollContainer) {
        return
      }

      const trackRect = event.currentTarget.getBoundingClientRect()
      const maxThumbTop =
        event.currentTarget.clientHeight - thumbHeightRef.current

      if (maxThumbTop <= 0) {
        return
      }

      const nextThumbTop = clamp(
        event.clientY - trackRect.top - thumbHeightRef.current / 2,
        0,
        maxThumbTop,
      )

      scrollContainer.scrollTop =
        (nextThumbTop / maxThumbTop) *
        (scrollContainer.scrollHeight - scrollContainer.clientHeight)

      showTemporarily()
    },
    [scrollContainerRef, showTemporarily],
  )

  const onThumbPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()

      const scrollContainer = scrollContainerRef.current
      const track = trackRef.current

      if (!scrollContainer || !track) {
        return
      }

      const startY = event.clientY
      const startScrollTop = scrollContainer.scrollTop
      const maxScrollTop =
        scrollContainer.scrollHeight - scrollContainer.clientHeight
      const maxThumbTop = track.clientHeight - thumbHeightRef.current

      if (maxThumbTop <= 0) {
        return
      }

      clearHideTimeout()
      setIsActive(true)
      setIsDraggingThumb(true)

      const handlePointerMove = (moveEvent: PointerEvent) => {
        scrollContainer.scrollTop =
          startScrollTop +
          ((moveEvent.clientY - startY) / maxThumbTop) * maxScrollTop
      }

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        setIsDraggingThumb(false)
        showTemporarily()
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
    },
    [clearHideTimeout, scrollContainerRef, showTemporarily],
  )

  return {
    trackRef,
    isVisible: thumb.isVisible,
    isActive,
    isDraggingThumb,
    thumbHeight: thumb.height,
    thumbTop: thumb.top,
    headerHeight,
    bottomInset,
    update,
    scheduleUpdate,
    showTemporarily,
    onTrackPointerDown,
    onThumbPointerDown,
    onTrackPointerEnter,
    onTrackPointerLeave: showTemporarily,
  }
}
