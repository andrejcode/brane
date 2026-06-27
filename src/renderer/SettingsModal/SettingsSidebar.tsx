import { type LucideIcon, Palette, Settings } from 'lucide-react'
import { useRef } from 'react'
import { GhostButton } from '@/ui/GhostButton'

export type SettingsTabId = 'general' | 'appearance'

export const TABS: ReadonlyArray<{
  id: SettingsTabId
  label: string
  icon: LucideIcon
}> = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

type SettingsSidebarProps = {
  activeTab: SettingsTabId
  onTabChange: (tab: SettingsTabId) => void
}

export function SettingsSidebar({
  activeTab,
  onTabChange,
}: SettingsSidebarProps) {
  const tablistRef = useRef<HTMLDivElement>(null)

  // Vertical tablist keyboard support (WAI-ARIA Tabs pattern). Moving focus
  // also activates the tab, which is the recommended behavior when revealing
  // the associated panel is inexpensive.
  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = TABS.findIndex((tab) => tab.id === activeTab)
    let nextIndex: number | null = null

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % TABS.length
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + TABS.length) % TABS.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = TABS.length - 1
        break
      default:
        return
    }

    const nextTab = TABS[nextIndex]
    if (!nextTab) return

    event.preventDefault()
    onTabChange(nextTab.id)
    tablistRef.current
      ?.querySelector<HTMLButtonElement>(`#settings-tab-${nextTab.id}`)
      ?.focus()
  }

  return (
    <div className="w-1/4 border-r border-neutral-200 dark:border-neutral-500 p-3">
      <h2
        id="settings-title"
        className="text-sm font-bold text-neutral-500 dark:text-neutral-400"
      >
        Settings
      </h2>
      <div
        ref={tablistRef}
        role="tablist"
        aria-orientation="vertical"
        aria-label="Settings sections"
        onKeyDown={handleTabKeyDown}
        className="flex flex-col gap-1 mt-2"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab
          const Icon = tab.icon
          return (
            <GhostButton
              key={tab.id}
              id={`settings-tab-${tab.id}`}
              role="tab"
              ariaSelected={isActive}
              ariaControls={`settings-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              isActive={isActive}
              title={tab.label}
              onClick={() => onTabChange(tab.id)}
              className="flex w-full items-center gap-2 px-2 text-left"
            >
              <Icon size={16} className="shrink-0" />
              {tab.label}
            </GhostButton>
          )
        })}
      </div>
    </div>
  )
}
