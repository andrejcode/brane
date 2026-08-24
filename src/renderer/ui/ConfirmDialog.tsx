import { useId, useRef } from 'react'
import { useTranslation } from '@/contexts/LocaleContext'
import { Button } from './buttons/Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  isDestructive?: boolean
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const messageId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)

  // A pending decision shouldn't be lost to a stray click outside, so only an
  // explicit choice (or Escape) closes this.
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      role="alertdialog"
      ariaLabelledBy={titleId}
      ariaDescribedBy={messageId}
      className="w-full max-w-md gap-3 p-4"
      closeOnBackdropClick={false}
      initialFocusRef={cancelRef}
    >
      <h2 id={titleId} className="text-lg font-medium">
        {title}
      </h2>
      <p
        id={messageId}
        className="text-sm text-neutral-500 dark:text-neutral-400"
      >
        {message}
      </p>

      <div className="mt-1 flex justify-end gap-2">
        <Button ref={cancelRef} variant="outline" onClick={onCancel}>
          {t('confirm.cancel')}
        </Button>
        <Button
          variant={isDestructive ? 'danger' : 'solid'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
