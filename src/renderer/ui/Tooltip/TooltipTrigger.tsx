import { useId, useRef } from 'react'
import { Tooltip } from './Tooltip'
import { useTooltipVisibility } from './useTooltipVisibility'

interface TooltipTriggerProps {
  children: React.ReactNode
  className?: string
  onlyWhenTruncated?: boolean
  tabIndex?: number
  tooltip: string
}

export function TooltipTrigger({
  children,
  className,
  onlyWhenTruncated = false,
  tabIndex,
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
        tabIndex={tabIndex}
        onBlur={hideTooltip}
        onFocus={showTooltip}
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
