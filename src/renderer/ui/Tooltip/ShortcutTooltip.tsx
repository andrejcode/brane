import { Tag } from '@/ui/Tag'

interface ShortcutTooltipProps {
  label?: React.ReactNode
  shortcut: string
}

export function ShortcutTooltip({ label, shortcut }: ShortcutTooltipProps) {
  if (!label) {
    return <span>{shortcut}</span>
  }

  return (
    <span className="flex items-center gap-2">
      {label}
      <Tag>{shortcut}</Tag>
    </span>
  )
}
