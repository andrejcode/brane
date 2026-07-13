import { useCallback, useEffect, useRef, useState } from 'react'
import type { CopyStatus } from '@/ui/CopyButton'

const STATUS_RESET_DELAY = 2000

// Copies text to the clipboard and exposes a short-lived status so callers can
// flash a "copied"/"failed" affordance that reverts to idle on its own.
export function useCopyToClipboard() {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const resetTimeoutRef = useRef<number | null>(null)

  const clearResetTimeout = useCallback(() => {
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
  }, [])

  useEffect(() => clearResetTimeout, [clearResetTimeout])

  const copy = useCallback(
    async (text: string) => {
      clearResetTimeout()

      try {
        await navigator.clipboard.writeText(text)
        setCopyStatus('copied')
      } catch {
        setCopyStatus('error')
      }

      resetTimeoutRef.current = window.setTimeout(() => {
        resetTimeoutRef.current = null
        setCopyStatus('idle')
      }, STATUS_RESET_DELAY)
    },
    [clearResetTimeout],
  )

  return { copyStatus, copy }
}
