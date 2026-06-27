import { type LucideIcon, Palette, Settings, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/ui/Button'
import { GhostButton } from '@/ui/GhostButton'
import { ApperanceSettings } from './ApperanceSettings'
import { GeneralSettings } from './GeneralSettings'
import { useModals } from '../contexts/ModalContext'
import { Modal } from '../ui/Modal'

type SettingsTabId = 'general' | 'appearance'

const TABS: ReadonlyArray<{
  id: SettingsTabId
  label: string
  icon: LucideIcon
}> = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

export function SettingsModal() {
  const { activeModal, closeModal } = useModals()
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general')
  const tablistRef = useRef<HTMLDivElement>(null)

  const activeLabel = TABS.find((tab) => tab.id === activeTab)?.label ?? ''

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
    setActiveTab(nextTab.id)
    tablistRef.current
      ?.querySelector<HTMLButtonElement>(`#settings-tab-${nextTab.id}`)
      ?.focus()
  }

  return (
    <Modal
      isOpen={activeModal === 'settings'}
      onClose={closeModal}
      ariaLabelledBy="settings-title"
    >
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
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
                  onClick={() => setActiveTab(tab.id)}
                  className="flex w-full items-center gap-2 px-2 text-left"
                >
                  <Icon size={16} className="shrink-0" />
                  {tab.label}
                </GhostButton>
              )
            })}
          </div>
        </div>

        {/* Setting title and close button */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between p-3">
            <h3 className="text-xl">{activeLabel}</h3>
            <Button
              type="button"
              onClick={closeModal}
              title="Close settings"
              className="rounded-lg"
            >
              <X />
            </Button>
          </div>

          <hr className="shrink-0 border-neutral-200 dark:border-neutral-500" />

          {/* Settings content */}
          <div
            id={`settings-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`settings-tab-${activeTab}`}
            tabIndex={0}
            className="min-h-0 flex-1 overflow-y-auto rounded-br-2xl p-3 focus:outline-none focus-visible:inset-ring"
          >
            <div className="flex flex-col gap-4">
              {activeTab === 'general' && <GeneralSettings />}
              {activeTab === 'appearance' && <ApperanceSettings />}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
