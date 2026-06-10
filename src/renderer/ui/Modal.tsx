import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { Button } from './Button'
import { useTrackModalOpen } from '../contexts/ModalContext'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useTrackModalOpen(isOpen)

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-40 m-4 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-neutral-900/50 dark:bg-neutral-900/80" />

      <div
        className={clsx(
          'bg-neutral-50 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100',
          'z-40 flex w-2xl h-2/3 flex-col rounded-2xl border border-neutral-200 p-6 shadow-lg dark:border-none',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between">
          <h2 className="text-xl">{title}</h2>
          <Button type="button" onClick={onClose} title="Close modal">
            <X />
          </Button>
        </div>
        <hr className="my-4 shrink-0 border-neutral-200 dark:border-neutral-500" />

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.getElementById('modal-root') as HTMLElement,
  )
}
