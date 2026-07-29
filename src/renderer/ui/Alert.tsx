import { clsx } from 'clsx'
import { useEffect, useState } from 'react'
import { useTranslation } from '@/contexts/LocaleContext'
import type { MessageKey } from '@/i18n'
import { CloseButton } from './buttons/CloseButton'

export type AlertVariant = 'error' | 'success' | 'info'

interface AlertProps {
  message: string | null
  onDismiss: () => void
  variant: AlertVariant
  className?: string
}

const indicatorClasses: Record<AlertVariant, string> = {
  error: 'bg-red-500 dark:bg-red-400',
  success: 'bg-green-500 dark:bg-green-400',
  info: 'bg-neutral-400 dark:bg-neutral-500',
}

const variantLabelKey: Record<AlertVariant, MessageKey> = {
  error: 'alert.error',
  success: 'alert.success',
  info: 'alert.info',
}

export default function Alert({
  message,
  variant,
  className,
  onDismiss,
}: AlertProps) {
  const { t } = useTranslation()
  const [showAlert, setShowAlert] = useState(true)
  const [fadeClass, setFadeClass] = useState<'opacity-0' | 'opacity-100'>(
    'opacity-0',
  )
  const [previousMessage, setPreviousMessage] = useState(message)

  if (message !== previousMessage) {
    setPreviousMessage(message)
    setShowAlert(message !== null)
    setFadeClass('opacity-0')
  }

  useEffect(() => {
    if (!message) {
      return
    }

    const timeout = setTimeout(() => {
      setFadeClass('opacity-100')
    }, 10)

    return () => clearTimeout(timeout)
  }, [message])

  const handleClose = () => {
    setFadeClass('opacity-0')

    setTimeout(() => {
      onDismiss()
      setShowAlert(false)
    }, 500)
  }

  return (
    showAlert &&
    message && (
      <div
        role={variant === 'error' ? 'alert' : 'status'}
        className={clsx(
          'flex max-w-md items-start rounded-2xl border p-4 shadow-lg transition-opacity duration-500 ease-in-out',
          'border-neutral-200 bg-white text-neutral-800',
          'dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100',
          fadeClass,
          className,
        )}
      >
        <span
          aria-hidden="true"
          className={clsx(
            'mt-1.5 mr-3 size-2.5 shrink-0 rounded-full',
            indicatorClasses[variant],
          )}
        />
        <span className="max-h-40 min-w-0 flex-1 overflow-y-auto wrap-break-word whitespace-pre-wrap">
          <span className="sr-only">{t(variantLabelKey[variant])}: </span>
          {message}
        </span>
        <CloseButton
          onClick={handleClose}
          className="ml-2 shrink-0 rounded"
          title={t('alert.close')}
        />
      </div>
    )
  )
}
