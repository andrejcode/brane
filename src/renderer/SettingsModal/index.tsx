import { ThemeSettings } from './ThemeSettings'
import { Modal } from '../ui/Modal'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="flex flex-col gap-4">
        <ThemeSettings />
      </div>
    </Modal>
  )
}
