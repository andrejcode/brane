import { useEffect, useRef, useState } from 'react'

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
