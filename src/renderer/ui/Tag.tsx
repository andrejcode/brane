import { clsx } from 'clsx'

export type TagSurface = 'content' | 'sidebar'

interface TagProps {
  children: React.ReactNode
  surface?: TagSurface
  className?: string
}

const surfaceClasses: Record<TagSurface, string> = {
  content:
    'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
  sidebar:
    'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
}

export function Tag({ children, surface = 'content', className }: TagProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-lg px-2 py-1 text-xs leading-none',
        surfaceClasses[surface],
        className,
      )}
    >
      {children}
    </span>
  )
}
