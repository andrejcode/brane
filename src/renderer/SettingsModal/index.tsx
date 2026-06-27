import { ThemeSettings } from './ThemeSettings'
import { useModals } from '../contexts/ModalContext'
import { Modal } from '../ui/Modal'

export function SettingsModal() {
  const { activeModal, closeModal } = useModals()

  return (
    <Modal
      isOpen={activeModal === 'settings'}
      onClose={closeModal}
      title="Settings"
    >
      <div className="flex flex-col gap-4">
        <ThemeSettings />
      </div>
    </Modal>
  )
}
