import { Check, CircleStop } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from '@/contexts/LocaleContext'
import { useModals } from '@/contexts/ModalContext'
import { useModel } from '@/contexts/ModelContext'
import { useDebouncedQuery } from '@/hooks/useDebouncedQuery'
import { CloseButton } from '@/ui/buttons/CloseButton'
import { GhostButton } from '@/ui/buttons/GhostButton'
import { LoadingSpinner } from '@/ui/LoadingSpinner'
import { Modal } from '@/ui/Modal'
import { SearchInput } from '@/ui/SearchInput'
import { formatModelName } from '@/utils'

export { SEARCH_DEBOUNCE_MS } from '@/hooks/useDebouncedQuery'

export function ModelsModal() {
  const { activeModal, closeModal } = useModals()
  const { t } = useTranslation()
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
  const { query, debouncedQuery, normalizedQuery, setQuery } =
    useDebouncedQuery({ resetOnActivate: isOpen })
  const searchRef = useRef<HTMLInputElement>(null)

  const hasModels = models.length > 0

  useEffect(() => {
    if (isOpen) {
      void refreshModels()
    }
  }, [isOpen, refreshModels])

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
    if (!normalizedQuery) return models
    return models.filter((model) =>
      formatModelName(model).toLowerCase().includes(normalizedQuery),
    )
  }, [models, normalizedQuery])

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
        {t('models.title')}
      </h2>

      <div className="flex shrink-0 items-center gap-2 p-3">
        <SearchInput
          inputRef={searchRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={!hasModels}
          placeholder={t('models.search')}
          ariaLabel={t('models.search')}
          className="flex-1"
        />
        <CloseButton
          onClick={closeModal}
          title={t('models.close')}
          className="rounded-lg"
        />
      </div>
      <hr className="shrink-0 border-neutral-200 dark:border-neutral-500" />

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {!hasModels ? (
          <p className="px-3 py-2 text-neutral-500 dark:text-neutral-400">
            {t('models.emptyBeforeExtension')}
            <code className="rounded bg-neutral-200 px-1 py-0.5 text-sm dark:bg-neutral-600">
              .gguf
            </code>
            {t('models.emptyBetween')}
            <code className="rounded bg-neutral-200 px-1 py-0.5 text-sm dark:bg-neutral-600">
              ~/.brane/models
            </code>
            {t('models.emptyAfterPath')}
          </p>
        ) : filteredModels.length === 0 ? (
          <p className="px-3 py-2 text-neutral-500 dark:text-neutral-400">
            {t('models.noMatch', { query: debouncedQuery })}
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
                  {isModelLoading ? (
                    <GhostButton
                      className="flex shrink-0 items-center justify-center px-2"
                      title={t('models.stopLoading')}
                      ariaLabel={t('models.stopLoading')}
                      onClick={handleUnload}
                    >
                      <CircleStop size={22} />
                    </GhostButton>
                  ) : (
                    isLoaded && (
                      <GhostButton
                        className="flex shrink-0 items-center justify-center px-2"
                        disabled={isLoading}
                        title={t('models.unload')}
                        ariaLabel={t('models.unload')}
                        onClick={handleUnload}
                      >
                        <CircleStop size={22} />
                      </GhostButton>
                    )
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
