import { clsx } from 'clsx'
import { LoaderCircle } from 'lucide-react'

interface LoadingSpinnerProps {
  isLoading: boolean
  className?: string
  size?: number
}

export function LoadingSpinner({
  isLoading,
  className,
  size,
}: LoadingSpinnerProps) {
  if (!isLoading) {
    return null
  }

  return (
    <LoaderCircle
      role="status"
      aria-label="Loading"
      {...(size === undefined ? {} : { size })}
      className={clsx(
        'animate-spin opacity-100 transition-opacity duration-500 ease-in-out starting:opacity-0',
        className,
      )}
    />
  )
}
