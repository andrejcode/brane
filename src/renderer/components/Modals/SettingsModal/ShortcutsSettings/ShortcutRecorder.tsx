import { clsx } from 'clsx'
import { useEffect, useState } from 'react'
import { Button } from '@/ui/buttons/Button'
import { eventToBinding, formatShortcut } from '@/utils'
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

      if (
        event.key === 'Escape' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey
      ) {
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
    <Button
      variant="outline"
      ariaLabelledBy={ariaLabelledBy}
      ariaPressed={isRecording}
      onClick={() => setIsRecording((recording) => !recording)}
      onBlur={() => setIsRecording(false)}
      className={clsx(
        'min-w-28 px-3 py-1.5',
        isRecording
          ? 'border-neutral-800 text-neutral-500 hover:bg-transparent dark:border-neutral-200 dark:text-neutral-400 dark:hover:bg-transparent'
          : undefined,
      )}
    >
      {isRecording ? recordingHint : formatShortcut(binding, isMac)}
    </Button>
  )
}
