import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Message } from '..'
import { ChatMessage } from './ChatMessage'
import { computeTailBottomInset } from './messagesLayout'
import { Scrollbar } from './Scrollbar'
import { ScrollToBottomButton } from './ScrollToBottomButton'
import { useScrollbar } from './useScrollbar'

interface MessagesProps {
  bottomInset: number
  messages: Message[]
}

const headerHeight = 56
// Give short final turns enough scroll room to sit alone below the header
const messageTailCount = 2
// Slack before the exact bottom so the button hides once effectively there
const scrollToBottomThreshold = 24
// Content grows a frame before the tail spacer shrinks to match, so require the
// reading to hold before flipping the button, absorbing that transient spike.
const scrollToBottomStabilizeDelay = 160

export function Messages({ bottomInset, messages }: MessagesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const tailMessagesRef = useRef<HTMLDivElement>(null)
  const tailSpacerUpdateAnimationFrameRef = useRef<number | null>(null)
  const lastUserMessageRef = useRef<HTMLElement | null>(null)
  const scrolledUserMessageIdRef = useRef<string | null>(null)
  const awayFromBottomRef = useRef(false)
  const awayFromBottomStabilizeTimeoutRef = useRef<number | null>(null)
  // Pinning a sent message to the top is a programmatic jump, not the reader
  // scrolling away, so keep the button hidden until they scroll themselves.
  const suppressAwayUntilUserScrollRef = useRef(false)
  const [isAwayFromBottom, setIsAwayFromBottom] = useState(false)
  const [tailBottomInset, setTailBottomInset] = useState(0)
  const contentBottomInset = Math.max(bottomInset, tailBottomInset)
  const tailStartIndex = Math.max(messages.length - messageTailCount, 0)
  const earlierMessages = messages.slice(0, tailStartIndex)
  const tailMessages = messages.slice(tailStartIndex)

  const scrollbar = useScrollbar({
    scrollContainerRef,
    headerHeight,
    bottomInset,
  })
  const {
    update: updateScrollbar,
    scheduleUpdate: scheduleScrollbarUpdate,
    showTemporarily: showScrollbarTemporarily,
  } = scrollbar

  const lastUserMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index]

      if (message?.role === 'user') {
        return message.id
      }
    }

    return null
  }, [messages])

  const stabilizeAwayFromBottom = useCallback((nextAway: boolean) => {
    const targetAway = suppressAwayUntilUserScrollRef.current ? false : nextAway

    if (targetAway === awayFromBottomRef.current) {
      if (awayFromBottomStabilizeTimeoutRef.current !== null) {
        window.clearTimeout(awayFromBottomStabilizeTimeoutRef.current)
        awayFromBottomStabilizeTimeoutRef.current = null
      }
      return
    }

    if (awayFromBottomStabilizeTimeoutRef.current !== null) {
      return
    }

    awayFromBottomStabilizeTimeoutRef.current = window.setTimeout(() => {
      awayFromBottomStabilizeTimeoutRef.current = null
      awayFromBottomRef.current = targetAway
      setIsAwayFromBottom(targetAway)
    }, scrollToBottomStabilizeDelay)
  }, [])

  const updateAwayFromBottom = useCallback(() => {
    const scrollContainer = scrollContainerRef.current

    if (!scrollContainer) {
      return
    }

    const maxScrollTop =
      scrollContainer.scrollHeight - scrollContainer.clientHeight
    stabilizeAwayFromBottom(
      maxScrollTop > scrollToBottomThreshold &&
        maxScrollTop - scrollContainer.scrollTop > scrollToBottomThreshold,
    )
  }, [stabilizeAwayFromBottom])

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

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current

    if (!scrollContainer) {
      return
    }

    const releaseSuppression = () => {
      suppressAwayUntilUserScrollRef.current = false
    }

    scrollContainer.addEventListener('wheel', releaseSuppression, {
      passive: true,
    })
    scrollContainer.addEventListener('touchmove', releaseSuppression, {
      passive: true,
    })

    return () => {
      scrollContainer.removeEventListener('wheel', releaseSuppression)
      scrollContainer.removeEventListener('touchmove', releaseSuppression)
    }
  }, [])

  useEffect(() => {
    scheduleScrollbarUpdate()
    updateAwayFromBottom()
  }, [
    contentBottomInset,
    messages,
    scheduleScrollbarUpdate,
    updateAwayFromBottom,
  ])

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

    suppressAwayUntilUserScrollRef.current = true

    if (awayFromBottomStabilizeTimeoutRef.current !== null) {
      window.clearTimeout(awayFromBottomStabilizeTimeoutRef.current)
      awayFromBottomStabilizeTimeoutRef.current = null
    }

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
    const tailMessagesElement = tailMessagesRef.current

    if (!scrollContainer || !tailMessagesElement) {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      scheduleTailSpacerUpdate()
      updateAwayFromBottom()
    })
    resizeObserver.observe(scrollContainer)
    resizeObserver.observe(tailMessagesElement)
    scheduleTailSpacerUpdate()

    return () => {
      resizeObserver.disconnect()
    }
  }, [scheduleTailSpacerUpdate, updateAwayFromBottom])

  useEffect(() => {
    return () => {
      if (tailSpacerUpdateAnimationFrameRef.current !== null) {
        cancelAnimationFrame(tailSpacerUpdateAnimationFrameRef.current)
      }

      if (awayFromBottomStabilizeTimeoutRef.current !== null) {
        window.clearTimeout(awayFromBottomStabilizeTimeoutRef.current)
      }
    }
  }, [])

  const handleScroll = useCallback(() => {
    updateScrollbar()
    updateAwayFromBottom()
    showScrollbarTemporarily()
  }, [showScrollbarTemporarily, updateAwayFromBottom, updateScrollbar])

  const scrollToBottom = useCallback(() => {
    const scrollContainer = scrollContainerRef.current

    if (!scrollContainer) {
      return
    }

    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: 'smooth',
    })
  }, [])

  const renderMessage = (message: Message) => (
    <ChatMessage
      key={message.id}
      message={message}
      ref={message.id === lastUserMessageId ? lastUserMessageRef : undefined}
    />
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
          className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-8 pt-14"
          style={{ paddingBottom: contentBottomInset }}
        >
          {earlierMessages.map(renderMessage)}
          <div ref={tailMessagesRef} className="flex flex-col gap-3">
            {tailMessages.map(renderMessage)}
          </div>
        </div>
      </div>

      <ScrollToBottomButton
        bottomInset={bottomInset}
        isVisible={isAwayFromBottom}
        onClick={scrollToBottom}
      />

      <Scrollbar controller={scrollbar} />
    </div>
  )
}
