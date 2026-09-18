import { clsx } from 'clsx'
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
import { ScrollArea } from '@/ui/ScrollArea'
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
        <CloseButton onClick={closeModal} ariaLabel={t('models.close')} />
      </div>
      <hr className="shrink-0 border-neutral-200 dark:border-neutral-500" />

      <ScrollArea className="flex-1" viewportClassName="p-3">
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
              const showEjectButton = isModelLoading || isLoaded
              const displayName = formatModelName(model)

              return (
                <li key={model} className="flex items-stretch">
                  <GhostButton
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2 text-left"
                    isActive={isSelected}
                    disabled={isLoading}
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
                  <div
                    aria-hidden={!showEjectButton}
                    className={clsx(
                      'min-w-0 overflow-hidden transition-[width,opacity] duration-200 ease-out',
                      showEjectButton
                        ? 'w-11 opacity-100'
                        : 'pointer-events-none w-0 opacity-0',
                    )}
                  >
                    <GhostButton
                      className="ml-1 flex h-full aspect-square items-center justify-center px-2"
                      disabled={!showEjectButton || (isLoaded && isLoading)}
                      tabIndex={showEjectButton ? undefined : -1}
                      ariaLabel={
                        isModelLoading
                          ? t('models.stopLoading')
                          : t('models.unload')
                      }
                      onClick={handleUnload}
                    >
                      <CircleStop size={22} />
                    </GhostButton>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </ScrollArea>
    </Modal>
  )
}
