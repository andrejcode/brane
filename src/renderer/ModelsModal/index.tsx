import { Check, X } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/ui/Button'
import { useModals } from '../contexts/ModalContext'
import { useModel } from '../contexts/ModelContext'
import { GhostButton } from '../ui/GhostButton'
import { Modal } from '../ui/Modal'
import { formatModelName } from '../utils/formatModelName'

export function ModelsModal() {
  const { activeModal, closeModal } = useModals()
  const { models, selectedModel, refreshModels, selectModel } = useModel()
  const isOpen = activeModal === 'models'

  // Re-scan the models directory each time the modal opens so newly added
  // files show up without restarting the app.
  useEffect(() => {
    if (isOpen) {
      void refreshModels()
    }
  }, [isOpen, refreshModels])

  const handleSelect = (model: string) => {
    void selectModel(model)
    closeModal()
  }

  return (
    <Modal isOpen={isOpen} onClose={closeModal} ariaLabelledBy="models-title">
      <div className="flex shrink-0 items-center justify-between p-3">
        <h2 id="models-title" className="text-xl">
          Models
        </h2>
        <Button
          type="button"
          onClick={closeModal}
          title="Close models"
          className="rounded-lg"
        >
          <X />
        </Button>
      </div>
      <hr className="shrink-0 border-neutral-200 dark:border-neutral-500" />

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {models.length === 0 ? (
          <p className="text-neutral-500 dark:text-neutral-400">
            No models found. Add{' '}
            <code className="rounded bg-neutral-200 px-1 py-0.5 text-sm dark:bg-neutral-600">
              .gguf
            </code>{' '}
            model files to{' '}
            <code className="rounded bg-neutral-200 px-1 py-0.5 text-sm dark:bg-neutral-600">
              ~/.brane/models
            </code>{' '}
            to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {models.map((model) => {
              const isSelected = model === selectedModel
              const displayName = formatModelName(model)

              return (
                <li key={model}>
                  <GhostButton
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                    isActive={isSelected}
                    title={displayName}
                    ariaLabel={displayName}
                    onClick={() => handleSelect(model)}
                  >
                    <span className="min-w-0 truncate">{displayName}</span>
                    {isSelected && <Check size={18} className="shrink-0" />}
                  </GhostButton>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Modal>
  )
}
