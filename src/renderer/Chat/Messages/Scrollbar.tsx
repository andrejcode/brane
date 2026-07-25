import { clsx } from 'clsx'
import type { ScrollbarController } from './useScrollbar'

interface ScrollbarProps {
  controller: ScrollbarController
}

export function Scrollbar({ controller }: ScrollbarProps) {
  const {
    trackRef,
    isVisible,
    isActive,
    isDraggingThumb,
    thumbHeight,
    thumbTop,
    headerHeight,
    bottomInset,
    onTrackPointerDown,
    onThumbPointerDown,
    onTrackPointerEnter,
    onTrackPointerLeave,
  } = controller

  if (!isVisible) {
    return null
  }

  return (
    <div
      ref={trackRef}
      className={clsx(
        'absolute right-0.5 z-20 w-2 transition-opacity duration-150',
        isActive ? 'opacity-100' : 'opacity-0',
      )}
      // Start below the header and stop at the composer top for an accurate map
      style={{ top: headerHeight, bottom: bottomInset }}
      onPointerDown={onTrackPointerDown}
      onPointerEnter={onTrackPointerEnter}
      onPointerLeave={onTrackPointerLeave}
    >
      <div
        className={clsx(
          'absolute right-0 w-1.5 rounded-full',
          'bg-neutral-500/70 dark:bg-neutral-600/70',
          // Smooth streaming resizes, but let dragging track the pointer
          // without lag.
          !isDraggingThumb &&
            'transition-[height,transform] duration-100 ease-out',
        )}
        onPointerDown={onThumbPointerDown}
        style={{
          height: thumbHeight,
          transform: `translateY(${thumbTop}px)`,
        }}
      />
    </div>
  )
}
