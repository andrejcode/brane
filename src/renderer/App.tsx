import { clsx } from 'clsx'
import { Chat } from './Chat'
import { Header } from './Header'

export function App() {
  return (
    <div
      className={clsx(
        'relative flex h-dvh flex-col overflow-hidden',
        'bg-neutral-50 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100',
      )}
    >
      <Header />
      <Chat />
    </div>
  )
}
