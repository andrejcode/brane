import { clsx } from 'clsx'

export function TitleBar() {
  return (
    <div
      className={clsx(
        '[app-region:drag] h-8 flex shrink-0 justify-center items-center font-semibold',
        'border-b border-neutral-200 dark:border-neutral-700',
      )}
    >
      Brane Chat
    </div>
  )
}
