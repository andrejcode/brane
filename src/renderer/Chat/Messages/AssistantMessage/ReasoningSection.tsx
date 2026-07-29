import { clsx } from 'clsx'
import { useId, useState } from 'react'
import { useTranslation } from '@/contexts/LocaleContext'
import { ChevronToggleButton } from '@/ui/buttons/ChevronToggleButton'

interface ReasoningSectionProps {
  reasoning: string
  isThinking: boolean
}

export function ReasoningSection({
  reasoning,
  isThinking,
}: ReasoningSectionProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const contentId = useId()

  return (
    <div className="flex flex-col">
      <ChevronToggleButton
        buttonText={t('chat.thinking')}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded((expanded) => !expanded)}
        ariaControls={contentId}
        textClassName={clsx(
          !isThinking && 'text-neutral-600 dark:text-neutral-400',
          // While streaming, sweep a bright band across the label as a live
          // "thinking" cue. The band brightens toward each theme's foreground.
          isThinking && [
            'bg-clip-text text-transparent',
            'bg-gradient-to-r from-neutral-400 via-neutral-800 to-neutral-400',
            'dark:from-neutral-500 dark:via-neutral-100 dark:to-neutral-500',
            'bg-[length:200%_100%]',
            'will-change-[background-position]',
            'animate-wipe',
          ],
        )}
      />

      <div
        id={contentId}
        className={clsx(
          'grid transition-all duration-200 ease-out',
          isExpanded
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <p
            className={clsx(
              'mt-1 border-l-2  pl-3 text-sm whitespace-pre-wrap select-text',
              'text-neutral-500 dark:text-neutral-400',
              'border-neutral-200 dark:border-neutral-600',
            )}
          >
            {reasoning}
          </p>
        </div>
      </div>
    </div>
  )
}
