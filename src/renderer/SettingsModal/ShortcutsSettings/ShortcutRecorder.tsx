import { clsx } from 'clsx'
import { useEffect, useState } from 'react'
import { FOCUS_RING } from '@/ui/focusRing'
import { eventToBinding, formatShortcut } from '@/utils/shortcut'
import type { ShortcutBinding } from '@shared/types'

interface ShortcutRecorderProps {
  binding: ShortcutBinding
  onChange: (binding: ShortcutBinding) => void
  ariaLabelledBy: string
  recordingHint: string
}

export function ShortcutRecorder({
  binding,
  onChange,
  ariaLabelledBy,
  recordingHint,
}: ShortcutRecorderProps) {
  const isMac = window.electronApi.isMac
  const [isRecording, setIsRecording] = useState(false)

  // Capture at the window level so the combination is swallowed before the
  // app's global shortcut listener (and the modal's Escape handler) can react
  // to whatever the user presses while recording.
  useEffect(() => {
    if (!isRecording) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (event.key === 'Escape') {
        setIsRecording(false)
        return
      }

      const next = eventToBinding(event, isMac)
      if (!next) {
        return
      }

      onChange(next)
      setIsRecording(false)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isRecording, isMac, onChange])

  return (
    <button
      type="button"
      aria-labelledby={ariaLabelledBy}
      aria-pressed={isRecording}
      onClick={() => setIsRecording((recording) => !recording)}
      onBlur={() => setIsRecording(false)}
      className={clsx(
        'min-w-28 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors duration-200',
        FOCUS_RING,
        isRecording
          ? 'border-neutral-800 text-neutral-500 dark:border-neutral-200 dark:text-neutral-400'
          : 'border-neutral-300 text-neutral-800 hover:bg-neutral-200 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-600',
      )}
    >
      {isRecording ? recordingHint : formatShortcut(binding, isMac)}
    </button>
  )
}
