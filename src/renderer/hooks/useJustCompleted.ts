import { useCallback, useEffect, useRef, useState } from 'react'

const FLAG_RESET_DELAY = 2000

// Marks an action as just finished for a moment, so a button can confirm itself
// in place. Actions whose result the user can't see otherwise need some
// feedback, but not a dismissable alert over the whole window.
export function useJustCompleted(resetDelay = FLAG_RESET_DELAY) {
  const [hasJustCompleted, setHasJustCompleted] = useState(false)
  const resetTimeoutRef = useRef<number | null>(null)

  const clearResetTimeout = useCallback(() => {
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
  }, [])

  useEffect(() => clearResetTimeout, [clearResetTimeout])

  const markCompleted = useCallback(() => {
    clearResetTimeout()
    setHasJustCompleted(true)

    resetTimeoutRef.current = window.setTimeout(() => {
      resetTimeoutRef.current = null
      setHasJustCompleted(false)
    }, resetDelay)
  }, [clearResetTimeout, resetDelay])

  return [hasJustCompleted, markCompleted] as const
}
