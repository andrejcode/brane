import { useState } from 'react'
import { CloseButton } from '@/ui/CloseButton'
import { ApperanceSettings } from './ApperanceSettings'
import { GeneralSettings } from './GeneralSettings'
import { type SettingsTabId, SettingsSidebar, TABS } from './SettingsSidebar'
import { useTranslation } from '../contexts/LocaleContext'
import { useModals } from '../contexts/ModalContext'
import { Modal } from '../ui/Modal'

export function SettingsModal() {
  const { activeModal, closeModal } = useModals()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general')

  const activeTabLabelKey = TABS.find((tab) => tab.id === activeTab)?.labelKey
  const activeLabel = activeTabLabelKey ? t(activeTabLabelKey) : ''

  return (
    <Modal
      isOpen={activeModal === 'settings'}
      onClose={closeModal}
      ariaLabelledBy="settings-title"
    >
      <div className="flex min-h-0 flex-1">
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Setting title and close button */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between p-3">
            <h3 className="text-xl">{activeLabel}</h3>
            <CloseButton
              onClick={closeModal}
              title={t('settings.close')}
              className="rounded-lg"
            />
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
