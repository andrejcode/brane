import {
  type PointerEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  clamp,
  computeScrollbarMetrics,
  computeTailBottomInset,
} from './messagesLayout'
import type { ChatMessage } from '.'

interface MessagesProps {
  bottomInset: number
  messages: ChatMessage[]
}

const headerHeight = 48
// Give short final turns enough scroll room to sit alone below the header
const messageTailCount = 2
const minimumThumbHeight = 20
const scrollbarThumbScale = 0.85
const scrollbarHideDelay = 900

export function Messages({ bottomInset, messages }: MessagesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollbarTrackRef = useRef<HTMLDivElement>(null)
  const scrollbarUpdateAnimationFrameRef = useRef<number | null>(null)
  const tailMessagesRef = useRef<HTMLDivElement>(null)
  const tailSpacerUpdateAnimationFrameRef = useRef<number | null>(null)
  const scrollbarHideTimeoutRef = useRef<number | null>(null)
  const lastUserMessageRef = useRef<HTMLElement | null>(null)
  const scrolledUserMessageIdRef = useRef<string | null>(null)
  const [scrollbar, setScrollbar] = useState({
    isVisible: false,
    thumbHeight: minimumThumbHeight,
    thumbTop: 0,
  })
  const [isScrollbarActive, setIsScrollbarActive] = useState(false)
  const [tailBottomInset, setTailBottomInset] = useState(0)
  const contentBottomInset = Math.max(bottomInset, tailBottomInset)
  const tailStartIndex = Math.max(messages.length - messageTailCount, 0)
  const earlierMessages = messages.slice(0, tailStartIndex)
  const tailMessages = messages.slice(tailStartIndex)
  const lastUserMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index]

      if (message?.role === 'user') {
        return message.id
      }
    }

    return null
  }, [messages])

  const updateScrollbar = useCallback(() => {
    const scrollContainer = scrollContainerRef.current

    if (!scrollContainer) {
      return
    }

    const metrics = computeScrollbarMetrics({
      scrollHeight: scrollContainer.scrollHeight,
      clientHeight: scrollContainer.clientHeight,
      scrollTop: scrollContainer.scrollTop,
      headerHeight,
      minimumThumbHeight,
      thumbScale: scrollbarThumbScale,
    })

    if (!metrics.isVisible) {
      setScrollbar((currentScrollbar) => ({
        ...currentScrollbar,
        isVisible: false,
        thumbTop: 0,
      }))
      return
    }

    setScrollbar({
      isVisible: true,
      thumbHeight: metrics.thumbHeight,
      thumbTop: metrics.thumbTop,
    })
  }, [])

  const scheduleScrollbarUpdate = useCallback(() => {
    if (scrollbarUpdateAnimationFrameRef.current !== null) {
      cancelAnimationFrame(scrollbarUpdateAnimationFrameRef.current)
    }

    scrollbarUpdateAnimationFrameRef.current = requestAnimationFrame(() => {
      scrollbarUpdateAnimationFrameRef.current = null
      updateScrollbar()
    })
  }, [updateScrollbar])

  const updateTailBottomInset = useCallback(() => {
    const scrollContainer = scrollContainerRef.current
    const tailMessagesElement = tailMessagesRef.current

    if (!scrollContainer || !tailMessagesElement || messages.length === 0) {
      setTailBottomInset(0)
      return
    }

    setTailBottomInset(
      computeTailBottomInset({
        clientHeight: scrollContainer.clientHeight,
        headerHeight,
        tailHeight: tailMessagesElement.getBoundingClientRect().height,
      }),
    )
  }, [messages.length])

  const scheduleTailSpacerUpdate = useCallback(() => {
    if (tailSpacerUpdateAnimationFrameRef.current !== null) {
      cancelAnimationFrame(tailSpacerUpdateAnimationFrameRef.current)
    }

    tailSpacerUpdateAnimationFrameRef.current = requestAnimationFrame(() => {
      tailSpacerUpdateAnimationFrameRef.current = null
      updateTailBottomInset()
    })
  }, [updateTailBottomInset])

  const clearScrollbarHideTimeout = useCallback(() => {
    if (scrollbarHideTimeoutRef.current !== null) {
      window.clearTimeout(scrollbarHideTimeoutRef.current)
      scrollbarHideTimeoutRef.current = null
    }
  }, [])

  const showScrollbarTemporarily = useCallback(() => {
    clearScrollbarHideTimeout()
    setIsScrollbarActive(true)

    scrollbarHideTimeoutRef.current = window.setTimeout(() => {
      scrollbarHideTimeoutRef.current = null
      setIsScrollbarActive(false)
    }, scrollbarHideDelay)
  }, [clearScrollbarHideTimeout])

  useEffect(() => {
    scheduleScrollbarUpdate()
  }, [contentBottomInset, messages, scheduleScrollbarUpdate])

  useEffect(() => {
    scheduleTailSpacerUpdate()
  }, [messages, scheduleTailSpacerUpdate])

  // Bring a freshly sent message to the top, just below the header
  useEffect(() => {
    if (!lastUserMessageId) {
      return
    }

    if (lastUserMessageId === scrolledUserMessageIdRef.current) {
      return
    }

    scrolledUserMessageIdRef.current = lastUserMessageId

    let secondFrame: number | null = null

    const scrollUserMessageToTop = () => {
      const scrollContainer = scrollContainerRef.current
      const userMessage = lastUserMessageRef.current

      if (!scrollContainer || !userMessage) {
        return
      }

      const containerRect = scrollContainer.getBoundingClientRect()
      const messageRect = userMessage.getBoundingClientRect()

      scrollContainer.scrollTo({
        top:
          scrollContainer.scrollTop +
          (messageRect.top - containerRect.top - headerHeight),
        behavior: 'smooth',
      })
    }

    // Wait two frames so the tail spacer commits and leaves room to scroll
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(scrollUserMessageToTop)
    })

    return () => {
      cancelAnimationFrame(firstFrame)

      if (secondFrame !== null) {
        cancelAnimationFrame(secondFrame)
      }
    }
  }, [lastUserMessageId])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current

    if (!scrollContainer) {
      return
    }

    const resizeObserver = new ResizeObserver(updateScrollbar)
    resizeObserver.observe(scrollContainer)

    if (scrollContainer.firstElementChild) {
      resizeObserver.observe(scrollContainer.firstElementChild)
    }

    scheduleScrollbarUpdate()

    return () => {
      resizeObserver.disconnect()
    }
  }, [scheduleScrollbarUpdate, updateScrollbar])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    const tailMessagesElement = tailMessagesRef.current

    if (!scrollContainer || !tailMessagesElement) {
      return
    }

    const resizeObserver = new ResizeObserver(scheduleTailSpacerUpdate)
    resizeObserver.observe(scrollContainer)
    resizeObserver.observe(tailMessagesElement)
    scheduleTailSpacerUpdate()

    return () => {
      resizeObserver.disconnect()
    }
  }, [scheduleTailSpacerUpdate])

  useEffect(() => {
    return () => {
      if (scrollbarUpdateAnimationFrameRef.current !== null) {
        cancelAnimationFrame(scrollbarUpdateAnimationFrameRef.current)
      }

      if (tailSpacerUpdateAnimationFrameRef.current !== null) {
        cancelAnimationFrame(tailSpacerUpdateAnimationFrameRef.current)
      }

      clearScrollbarHideTimeout()
    }
  }, [clearScrollbarHideTimeout])

  const handleScroll = useCallback(() => {
    updateScrollbar()
    showScrollbarTemporarily()
  }, [showScrollbarTemporarily, updateScrollbar])

  const handleTrackPointerDown: PointerEventHandler<HTMLDivElement> = (
    event,
  ) => {
    if (event.target !== event.currentTarget) {
      return
    }

    const scrollContainer = scrollContainerRef.current

    if (!scrollContainer) {
      return
    }

    const trackRect = event.currentTarget.getBoundingClientRect()
    const maxThumbTop = event.currentTarget.clientHeight - scrollbar.thumbHeight

    if (maxThumbTop <= 0) {
      return
    }

    const nextThumbTop = clamp(
      event.clientY - trackRect.top - scrollbar.thumbHeight / 2,
      0,
      maxThumbTop,
    )

    scrollContainer.scrollTop =
      (nextThumbTop / maxThumbTop) *
      (scrollContainer.scrollHeight - scrollContainer.clientHeight)

    showScrollbarTemporarily()
  }

  const handleThumbPointerDown: PointerEventHandler<HTMLDivElement> = (
    event,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    const scrollContainer = scrollContainerRef.current
    const scrollbarTrack = scrollbarTrackRef.current

    if (!scrollContainer || !scrollbarTrack) {
      return
    }

    const startY = event.clientY
    const startScrollTop = scrollContainer.scrollTop
    const maxScrollTop =
      scrollContainer.scrollHeight - scrollContainer.clientHeight
    const maxThumbTop = scrollbarTrack.clientHeight - scrollbar.thumbHeight

    if (maxThumbTop <= 0) {
      return
    }

    clearScrollbarHideTimeout()
    setIsScrollbarActive(true)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      scrollContainer.scrollTop =
        startScrollTop +
        ((moveEvent.clientY - startY) / maxThumbTop) * maxScrollTop
    }

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      showScrollbarTemporarily()
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const renderMessage = (message: ChatMessage) => (
    <article
      key={message.id}
      ref={message.id === lastUserMessageId ? lastUserMessageRef : undefined}
      className={
        message.role === 'user'
          ? 'self-end rounded-2xl bg-neutral-200 px-4 py-2 whitespace-pre-wrap dark:bg-neutral-700'
          : 'self-start whitespace-pre-wrap'
      }
    >
      {message.content}
    </article>
  )

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollContainerRef}
        // Opt out of Chromium's keyboard-focusable scrollers so the pane isn't
        // a Tab stop that paints a focus ring around the whole message area
        tabIndex={-1}
        // Native scrollbars start at the viewport top. This pane uses an aligned custom one
        className="h-full overflow-y-auto outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={handleScroll}
      >
        <div
          className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-8 pt-12"
          style={{ paddingBottom: contentBottomInset }}
        >
          {earlierMessages.map(renderMessage)}
          <div ref={tailMessagesRef} className="flex flex-col gap-3">
            {tailMessages.map(renderMessage)}
          </div>
        </div>
      </div>

      {scrollbar.isVisible && (
        <div
          ref={scrollbarTrackRef}
          className={`absolute top-12 right-0.5 bottom-0 z-20 w-2 transition-opacity duration-150 ${
            isScrollbarActive ? 'opacity-100' : 'opacity-0'
          }`}
          onPointerDown={handleTrackPointerDown}
          onPointerEnter={() => {
            clearScrollbarHideTimeout()
            setIsScrollbarActive(true)
          }}
          onPointerLeave={showScrollbarTemporarily}
        >
          <div
            className="absolute right-0 w-1.5 rounded-full bg-neutral-500/70 dark:bg-neutral-600/70"
            onPointerDown={handleThumbPointerDown}
            style={{
              height: scrollbar.thumbHeight,
              transform: `translateY(${scrollbar.thumbTop}px)`,
            }}
          />
        </div>
      )}
    </div>
  )
}
