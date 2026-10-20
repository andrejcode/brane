import { useCallback, useEffect, useRef, useState } from 'react'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import { computeBottomOverlayInset } from './chatLayout'

interface UseBottomOverlayInsetOptions {
  isEmpty: boolean
}

const COMPOSER_CLEARANCE = 12
const COMPOSER_TRANSITION_MEASUREMENT_DURATION = 600

export function useBottomOverlayInset({
  isEmpty,
}: UseBottomOverlayInsetOptions) {
  const [bottomOverlayInset, setBottomOverlayInset] = useState(0)
  const bottomOverlayRef = useRef<HTMLDivElement>(null)
  const bottomFadeRef = useRef<HTMLDivElement>(null)

  const updateBottomOverlayInset = useCallback(() => {
    const bottomOverlay = bottomOverlayRef.current

    if (!bottomOverlay) {
      return
    }

    const overlayTop = bottomOverlay.getBoundingClientRect().top
    const fadeTop = bottomFadeRef.current?.getBoundingClientRect().top

    setBottomOverlayInset(
      computeBottomOverlayInset({
        bottomEdge: window.innerHeight,
        clearance: COMPOSER_CLEARANCE,
        ...(fadeTop === undefined ? {} : { fadeTop }),
        overlayTop,
      }),
    )
  }, [])

  const getResizeTargets = useCallback(
    () => [bottomOverlayRef.current, bottomFadeRef.current],
    [],
  )

  useResizeObserver({
    getTargets: getResizeTargets,
    onResize: updateBottomOverlayInset,
  })

  useEffect(() => {
    const animationFrame = requestAnimationFrame(updateBottomOverlayInset)

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [updateBottomOverlayInset])

  useEffect(() => {
    if (isEmpty) {
      return
    }

    const start = performance.now()
    let animationFrame = requestAnimationFrame(function tick() {
      updateBottomOverlayInset()

      if (
        performance.now() - start <
        COMPOSER_TRANSITION_MEASUREMENT_DURATION
      ) {
        animationFrame = requestAnimationFrame(tick)
      }
    })

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [isEmpty, updateBottomOverlayInset])

  return { bottomOverlayRef, bottomFadeRef, bottomOverlayInset }
}
