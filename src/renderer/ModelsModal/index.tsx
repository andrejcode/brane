import { Check, CircleStop, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BaseButton } from '@/ui/BaseButton'
import { useModals } from '../contexts/ModalContext'
import { useModel } from '../contexts/ModelContext'
import { GhostButton } from '../ui/GhostButton'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Modal } from '../ui/Modal'
import { formatModelName } from '../utils/formatModelName'

export const SEARCH_DEBOUNCE_MS = 200

export function ModelsModal() {
  const { activeModal, closeModal } = useModals()
  const {
    models,
    selectedModel,
    loadingModel,
    loadedModel,
    refreshModels,
    selectModel,
    unloadModel,
  } = useModel()
  const isOpen = activeModal === 'models'
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [wasOpen, setWasOpen] = useState(isOpen)
  const searchRef = useRef<HTMLInputElement>(null)

  const hasModels = models.length > 0

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen)
    if (isOpen) {
      setQuery('')
      setDebouncedQuery('')
    }
  }

  useEffect(() => {
    if (isOpen) {
      void refreshModels()
    }
  }, [isOpen, refreshModels])

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedQuery(query),
      SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    if (!isOpen || !hasModels) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.length !== 1) return

      const input = searchRef.current
      if (!input || document.activeElement === input) return

      input.focus()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hasModels])

  const filteredModels = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase()
    if (!normalized) return models
    return models.filter((model) =>
      formatModelName(model).toLowerCase().includes(normalized),
    )
  }, [models, debouncedQuery])

  const isLoading = loadingModel !== null

  const handleSelect = (model: string) => {
    void selectModel(model)
  }

  const handleUnload = () => {
    void unloadModel()
  }

  return (
    <Modal isOpen={isOpen} onClose={closeModal} ariaLabelledBy="models-title">
      <h2 id="models-title" className="sr-only">
        Models
      </h2>

      <div className="flex shrink-0 items-center gap-2 p-3">
        <div role="search" className="flex min-w-0 flex-1 items-center gap-2">
          <Search
            size={18}
            aria-hidden
            className="shrink-0 text-neutral-500 dark:text-neutral-400"
          />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={!hasModels}
            placeholder="Search models"
            aria-label="Search models"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed"
          />
        </div>
        <BaseButton
          type="button"
          onClick={closeModal}
          title="Close models"
          className="rounded-lg"
        >
          <X />
        </BaseButton>
      </div>
      <hr className="shrink-0 border-neutral-200 dark:border-neutral-500" />

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {!hasModels ? (
          <p className="px-3 py-2 text-neutral-500 dark:text-neutral-400">
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
        ) : filteredModels.length === 0 ? (
          <p className="px-3 py-2 text-neutral-500 dark:text-neutral-400">
            No models match “{debouncedQuery}”.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {filteredModels.map((model) => {
              const isSelected = model === selectedModel
              const isModelLoading = model === loadingModel
              const isLoaded = model === loadedModel
              const displayName = formatModelName(model)

              return (
                <li key={model} className="flex items-stretch gap-1">
                  <GhostButton
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2 text-left"
                    isActive={isSelected}
                    disabled={isLoading}
                    title={displayName}
                    ariaLabel={displayName}
                    onClick={() => handleSelect(model)}
                  >
                    <span className="min-w-0 truncate">{displayName}</span>
                    {isModelLoading ? (
                      <LoadingSpinner
                        isLoading
                        size={18}
                        className="shrink-0"
                      />
                    ) : (
                      isLoaded && <Check size={18} className="shrink-0" />
                    )}
                  </GhostButton>
                  {isLoaded && !isModelLoading && (
                    <GhostButton
                      className="flex shrink-0 items-center justify-center px-2"
                      disabled={isLoading}
                      title="Unload model"
                      ariaLabel="Unload model"
                      onClick={handleUnload}
                    >
                      <CircleStop size={22} />
                    </GhostButton>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Modal>
  )
}
