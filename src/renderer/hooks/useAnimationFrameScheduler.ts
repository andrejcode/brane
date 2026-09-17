import { useCallback, useEffect, useRef } from 'react'

export function useAnimationFrameScheduler(callback: () => void) {
  const animationFrameRef = useRef<number | null>(null)

  const schedule = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = null
      callback()
    })
  }, [callback])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return schedule
}
