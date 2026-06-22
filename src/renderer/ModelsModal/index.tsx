import { Check } from 'lucide-react'
import { useEffect } from 'react'
import { useModel } from '../contexts/ModelContext'
import { GhostButton } from '../ui/GhostButton'
import { Modal } from '../ui/Modal'

interface ModelsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ModelsModal({ isOpen, onClose }: ModelsModalProps) {
  const { models, selectedModel, refreshModels, selectModel } = useModel()

  // Re-scan the models directory each time the modal opens so newly added
  // files show up without restarting the app.
  useEffect(() => {
    if (isOpen) {
      void refreshModels()
    }
  }, [isOpen, refreshModels])

  const handleSelect = (model: string) => {
    void selectModel(model)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Models">
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

            return (
              <li key={model}>
                <GhostButton
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                  isActive={isSelected}
                  ariaLabel={model}
                  onClick={() => handleSelect(model)}
                >
                  <span className="min-w-0 truncate">{model}</span>
                  {isSelected && <Check size={18} className="shrink-0" />}
                </GhostButton>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
