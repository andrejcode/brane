import { clsx } from 'clsx'
import { useTranslation } from '@/contexts/LocaleContext'
import { FOCUS_RING } from '@/ui/styles/focusRing'
import { TooltipTrigger } from '@/ui/Tooltip'

interface ContextUsageIndicatorProps {
  percentage?: number
  usedTokens?: number
  totalTokens?: number
}

export function ContextUsageIndicator({
  percentage,
  usedTokens,
  totalTokens,
}: ContextUsageIndicatorProps) {
  const { t, locale } = useTranslation()
  const isAvailable =
    percentage !== undefined &&
    usedTokens !== undefined &&
    totalTokens !== undefined &&
    totalTokens > 0
  const clampedPercentage = Math.min(
    100,
    Math.max(0, isAvailable && Number.isFinite(percentage) ? percentage : 0),
  )
  const roundedPercentage = Math.round(clampedPercentage)
  const remainingTokens = Math.max(0, (totalTokens ?? 0) - (usedTokens ?? 0))
  const formatTokens = (tokens: number) => tokens.toLocaleString(locale)
  const summary = !isAvailable
    ? t('chat.contextUsageUnavailable')
    : clampedPercentage >= 100
      ? t('chat.contextLimitReached', {
          used: formatTokens(usedTokens),
          size: formatTokens(totalTokens),
        })
      : t('chat.contextUsageSummary', {
          percentage: roundedPercentage,
          used: formatTokens(usedTokens),
          size: formatTokens(totalTokens),
          remaining: formatTokens(remainingTokens),
        })

  return (
    <TooltipTrigger
      className={clsx('inline-flex rounded-full', FOCUS_RING)}
      tabIndex={0}
      tooltip={summary}
    >
      <span
        role="img"
        aria-label={summary}
        className="inline-flex text-neutral-500 dark:text-neutral-300"
      >
        <span className="relative size-8 shrink-0">
          <svg
            viewBox="0 0 32 32"
            aria-hidden="true"
            className="size-8 -rotate-90"
          >
            <circle
              cx="16"
              cy="16"
              r="13"
              pathLength="100"
              fill="none"
              strokeWidth="2.5"
              className="stroke-neutral-200 dark:stroke-neutral-600"
            />
            <circle
              cx="16"
              cy="16"
              r="13"
              pathLength="100"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="100"
              strokeDashoffset={100 - clampedPercentage}
              className="stroke-neutral-800 transition-[stroke-dashoffset] duration-500 ease-out dark:stroke-neutral-100"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-neutral-700 dark:text-neutral-100">
            {isAvailable ? `${roundedPercentage}%` : t('chat.notAvailable')}
          </span>
        </span>
      </span>
    </TooltipTrigger>
  )
}
