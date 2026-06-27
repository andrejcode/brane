import { clsx } from 'clsx'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  ariaLabelledBy?: string
  children: React.ReactNode
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function Modal({
  isOpen,
  onClose,
  ariaLabelledBy,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Move focus into the dialog when it opens, and restore it to whatever was
  // focused before once it closes.
  useEffect(() => {
    if (!isOpen) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    panelRef.current?.focus()

    return () => previouslyFocused?.focus()
  }, [isOpen])

  // Close on Escape and keep Tab focus trapped within the dialog.
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      )
      const first = focusable[0] ?? panel
      const last = focusable[focusable.length - 1] ?? panel
      const active = document.activeElement

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-40 m-4 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-neutral-900/50 dark:bg-neutral-900/80" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
        className={clsx(
          'bg-neutral-50 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100',
          'rounded-2xl border border-neutral-200 dark:border-none',
          'z-40 flex w-2xl h-2/3 flex-col shadow-lg outline-none',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.getElementById('modal-root') as HTMLElement,
  )
}
