import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  id: string
  targetRef: React.RefObject<HTMLElement | null>
  children: React.ReactNode
}

interface TooltipPosition {
  left: number
  top: number
}

const VIEWPORT_PADDING = 8
const TARGET_GAP = 8

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
