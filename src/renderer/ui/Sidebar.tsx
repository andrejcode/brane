import { clsx } from 'clsx'

interface SidebarProps {
  isSidebarOpen: boolean
  children: React.ReactNode
}

export function Sidebar({ isSidebarOpen, children }: SidebarProps) {
  return (
    <aside
      className={clsx(
        'flex h-full flex-col overflow-hidden transition-all duration-500 ease-in-out ',
        'bg-neutral-100 dark:bg-neutral-900',
        isSidebarOpen ? 'w-80' : 'w-0',
      )}
    >
      <div className="min-h-0 w-80 flex-1">{children}</div>
    </aside>
  )
}
