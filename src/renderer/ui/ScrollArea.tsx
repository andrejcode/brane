import { clsx } from 'clsx'
import {
  type ComponentPropsWithoutRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
  type UIEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useAnimationFrameScheduler } from '@/hooks/useAnimationFrameScheduler'
import { clamp, computeScrollbarMetrics } from './scrollAreaLayout'

const MINIMUM_THUMB_HEIGHT = 20
const THUMB_SCALE = 0.85
const HIDE_DELAY = 900
const TRACK_INSET = 4

export type ScrollAreaTone = 'content' | 'sidebar'

interface ScrollAreaProps {
  children: ReactNode
  className?: string
  viewportClassName?: string
  viewportRef?: RefObject<HTMLDivElement | null>
  viewportProps?: Omit<
    ComponentPropsWithoutRef<'div'>,
    'children' | 'className' | 'onScroll'
  >
  onScroll?: UIEventHandler<HTMLDivElement>
  headerInset?: number
  bottomInset?: number
  tone?: ScrollAreaTone
}

const thumbToneClasses: Record<ScrollAreaTone, string> = {
  content: 'bg-neutral-500/70 dark:bg-neutral-600/70',
  sidebar: 'bg-neutral-400/70 dark:bg-neutral-700/80',
}

export function ScrollArea({
  children,
  className,
  viewportClassName,
  viewportRef,
  viewportProps,
  onScroll,
  headerInset = 0,
  bottomInset = 0,
  tone = 'content',
}: ScrollAreaProps) {
  const internalViewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<number | null>(null)
  const thumbHeightRef = useRef(MINIMUM_THUMB_HEIGHT)
  const [thumb, setThumb] = useState({
    isVisible: false,
    height: MINIMUM_THUMB_HEIGHT,
    top: 0,
  })
  const [isActive, setIsActive] = useState(false)
  const [isDraggingThumb, setIsDraggingThumb] = useState(false)

  const setViewportRef = useCallback(
    (element: HTMLDivElement | null) => {
      internalViewportRef.current = element

      if (viewportRef) {
        viewportRef.current = element
      }
    },
    [viewportRef],
  )

  useEffect(() => {
    thumbHeightRef.current = thumb.height
  }, [thumb.height])

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
    const scrollContainer = internalViewportRef.current

    if (!scrollContainer) {
      return
    }

    const metrics = computeScrollbarMetrics({
      scrollHeight: scrollContainer.scrollHeight,
      clientHeight: scrollContainer.clientHeight,
      scrollTop: scrollContainer.scrollTop,
      headerInset,
      bottomInset,
      trackInset: TRACK_INSET,
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
  }, [bottomInset, headerInset])

  const scheduleUpdate = useAnimationFrameScheduler(update)

  useEffect(() => {
    const scrollContainer = internalViewportRef.current

    if (!scrollContainer) {
      return
    }

    const resizeObserver = new ResizeObserver(scheduleUpdate)
    const mutationObserver = new MutationObserver(scheduleUpdate)
    resizeObserver.observe(scrollContainer)
    mutationObserver.observe(scrollContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    if (scrollContainer.firstElementChild) {
      resizeObserver.observe(scrollContainer.firstElementChild)
    }

    scheduleUpdate()

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [scheduleUpdate])

  useEffect(() => {
    scheduleUpdate()
  }, [bottomInset, children, headerInset, scheduleUpdate])

  useEffect(() => {
    return () => {
      clearHideTimeout()
    }
  }, [clearHideTimeout])

  const handleScroll: UIEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      update()
      showTemporarily()
      onScroll?.(event)
    },
    [onScroll, showTemporarily, update],
  )

  const handleTrackPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) {
        return
      }

      const scrollContainer = internalViewportRef.current

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
    [showTemporarily],
  )

  const handleThumbPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()

      const scrollContainer = internalViewportRef.current
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
    [clearHideTimeout, showTemporarily],
  )

  return (
    <div className={clsx('relative min-h-0 overflow-hidden', className)}>
      <div
        {...viewportProps}
        ref={setViewportRef}
        className={clsx(
          'h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          viewportClassName,
        )}
        onScroll={handleScroll}
      >
        {children}
      </div>

      {thumb.isVisible && (
        <div
          ref={trackRef}
          className={clsx(
            'group absolute right-0.5 z-20 w-2 transition-opacity duration-150',
            isActive ? 'opacity-100' : 'opacity-0',
          )}
          style={{
            top: headerInset + TRACK_INSET,
            bottom: bottomInset + TRACK_INSET,
          }}
          onPointerDown={handleTrackPointerDown}
          onPointerEnter={() => {
            clearHideTimeout()
            setIsActive(true)
          }}
          onPointerLeave={showTemporarily}
        >
          <div
            className={clsx(
              'absolute right-0 rounded-full',
              thumbToneClasses[tone],
              'w-1.5 group-hover:w-2.5',
              isDraggingThumb && 'w-2.5',
              isDraggingThumb
                ? 'transition-[width] duration-100 ease-out'
                : 'transition-[height,transform,width] duration-100 ease-out',
            )}
            onPointerDown={handleThumbPointerDown}
            style={{
              height: thumb.height,
              transform: `translateY(${thumb.top}px)`,
            }}
          />
        </div>
      )}
    </div>
  )
}
