import { clsx } from 'clsx'

interface SidebarProps {
  isSidebarOpen: boolean
  children: React.ReactNode
  className?: string
}

export function Sidebar({ isSidebarOpen, children, className }: SidebarProps) {
  return (
    <aside
      className={clsx(
        'flex h-full flex-col overflow-hidden transition-all duration-500 ease-in-out ',
        'bg-neutral-100 dark:bg-neutral-900',
        isSidebarOpen ? 'w-80' : 'w-0',
      )}
    >
      <div className={clsx('min-h-0 w-80 flex-1', className)}>{children}</div>
    </aside>
  )
}
