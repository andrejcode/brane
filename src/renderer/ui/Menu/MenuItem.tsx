import { clsx } from 'clsx'
import { GhostButton } from '@/ui/buttons/GhostButton'
import { useMenu } from './MenuContext'

interface MenuItemProps {
  children: React.ReactNode
  onSelect: () => void
  isDestructive?: boolean
}

export function MenuItem({
  children,
  onSelect,
  isDestructive = false,
}: MenuItemProps) {
  const menu = useMenu()

  return (
    <GhostButton
      role="menuitem"
      className={clsx(
        'grid w-full grid-cols-[1rem_1fr] items-center gap-2 px-2 py-1.5 text-left text-sm whitespace-nowrap',
        isDestructive
          ? 'text-red-500 hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-400/15'
          : 'text-neutral-800 dark:text-neutral-100',
      )}
      onClick={() => {
        menu.close()
        onSelect()
      }}
    >
      {children}
    </GhostButton>
  )
}
