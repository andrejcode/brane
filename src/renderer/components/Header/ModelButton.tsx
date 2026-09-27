import { ChevronRight } from 'lucide-react'
import { useTranslation } from '@/contexts/LocaleContext'
import { useModals } from '@/contexts/ModalContext'
import { useModel } from '@/contexts/ModelContext'
import { useShortcuts } from '@/contexts/ShortcutsContext'
import { GhostButton } from '@/ui/buttons/GhostButton'
import { LoadingSpinner } from '@/ui/LoadingSpinner'
import { ShortcutTooltip } from '@/ui/ShortcutTooltip'
import { formatModelName, formatShortcut } from '@/utils'

export function ModelButton() {
  const isMac = window.electronApi.isMac
  const { openModal } = useModals()
  const { isModelLoading, selectedModel } = useModel()
  const { shortcuts } = useShortcuts()
  const { t } = useTranslation()
  const modelLabel = selectedModel
    ? formatModelName(selectedModel)
    : t('header.selectModel')
  const selectModelShortcut = formatShortcut(shortcuts.toggleModels, isMac)

  return (
    <GhostButton
      className="flex items-center gap-0.5 px-2"
      tooltip={
        <ShortcutTooltip
          label={selectedModel ? t('header.selectModel') : null}
          shortcut={selectModelShortcut}
        />
      }
      ariaLabel={t('header.selectModel')}
      onClick={() => openModal('models')}
    >
      {isModelLoading ? (
        <LoadingSpinner isLoading size={20} />
      ) : (
        <span className="max-w-64 truncate">{modelLabel}</span>
      )}
      <ChevronRight size={18} className="shrink-0" />
    </GhostButton>
  )
}
