import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  id: string
  targetRef: React.RefObject<HTMLElement | null>
  children: React.ReactNode
}

interface TooltipTriggerProps {
  children: React.ReactNode
  className?: string
  onlyWhenTruncated?: boolean
  tooltip: string
}

interface TooltipPosition {
  left: number
  top: number
}

const VIEWPORT_PADDING = 8
const TARGET_GAP = 8
const TOOLTIP_OPEN_DELAY = 1000

export function useTooltipVisibility() {
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)

  const showTooltip = () => {
    if (openTimerRef.current !== null || isTooltipVisible) return

    openTimerRef.current = setTimeout(() => {
      openTimerRef.current = null
      setIsTooltipVisible(true)
    }, TOOLTIP_OPEN_DELAY)
  }

  const hideTooltip = () => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }

    setIsTooltipVisible(false)
  }

  useEffect(() => {
    return () => {
      if (openTimerRef.current !== null) {
        clearTimeout(openTimerRef.current)
      }
    }
  }, [])

  return { hideTooltip, isTooltipVisible, showTooltip }
}

function getTooltipPosition(
  targetBounds: DOMRect,
  tooltipBounds: DOMRect,
): TooltipPosition {
  const centeredLeft =
    targetBounds.left + (targetBounds.width - tooltipBounds.width) / 2
  const maxLeft = window.innerWidth - tooltipBounds.width - VIEWPORT_PADDING
  const left = Math.max(VIEWPORT_PADDING, Math.min(centeredLeft, maxLeft))
  const topAbove = targetBounds.top - tooltipBounds.height - TARGET_GAP
  const top =
    topAbove >= VIEWPORT_PADDING ? topAbove : targetBounds.bottom + TARGET_GAP

  return { left, top }
}

export function Tooltip({ id, targetRef, children }: TooltipProps) {
  const [tooltipElement, setTooltipElement] = useState<HTMLDivElement | null>(
    null,
  )
  const [position, setPosition] = useState<TooltipPosition | null>(null)

  useLayoutEffect(() => {
    const targetElement = targetRef.current
    if (!targetElement || !tooltipElement) return

    const updatePosition = () => {
      setPosition(
        getTooltipPosition(
          targetElement.getBoundingClientRect(),
          tooltipElement.getBoundingClientRect(),
        ),
      )
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    document.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      document.removeEventListener('scroll', updatePosition, true)
    }
  }, [targetRef, tooltipElement])

  return createPortal(
    <div
      ref={setTooltipElement}
      id={id}
      role="tooltip"
      style={position ?? { visibility: 'hidden' }}
      className="pointer-events-none fixed z-50 max-w-64 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-900 shadow-md dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
    >
      {children}
    </div>,
    document.body,
  )
}

export function TooltipTrigger({
  children,
  className,
  onlyWhenTruncated = false,
  tooltip,
}: TooltipTriggerProps) {
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipId = useId()
  const { hideTooltip, isTooltipVisible, showTooltip } = useTooltipVisibility()
  const handleMouseEnter = () => {
    const triggerElement = triggerRef.current

    if (
      onlyWhenTruncated &&
      triggerElement &&
      triggerElement.scrollWidth <= triggerElement.clientWidth
    ) {
      return
    }

    showTooltip()
  }

  return (
    <>
      <span
        ref={triggerRef}
        aria-describedby={isTooltipVisible ? tooltipId : undefined}
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={hideTooltip}
      >
        {children}
      </span>
      {isTooltipVisible ? (
        <Tooltip id={tooltipId} targetRef={triggerRef}>
          {tooltip}
        </Tooltip>
      ) : null}
    </>
  )
}
