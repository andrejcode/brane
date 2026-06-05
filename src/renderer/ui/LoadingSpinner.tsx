import { clsx } from 'clsx'
import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface LoadingSpinnerProps {
  isLoading: boolean
  className?: string
}

export function LoadingSpinner({ isLoading, className }: LoadingSpinnerProps) {
  const [fadeClass, setFadeClass] = useState<'opacity-0' | 'opacity-100'>(
    'opacity-0',
  )

  useEffect(() => {
    if (!isLoading) {
      return
    }

    // Defer one tick so the initial 'opacity-0' commits before fading in
    const timeout = window.setTimeout(() => {
      setFadeClass('opacity-100')
    }, 10)

    return () => {
      setFadeClass('opacity-0')
      window.clearTimeout(timeout)
    }
  }, [isLoading])

  if (!isLoading) {
    return null
  }

  return (
    <LoaderCircle
      role="status"
      aria-label="Loading"
      className={clsx(
        'animate-spin transition-opacity duration-500 ease-in-out',
        fadeClass,
        className,
      )}
    />
  )
}
