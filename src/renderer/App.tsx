import { Chat } from './Chat'
import { TitleBar } from './TitleBar'

export function App() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-neutral-50 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100">
      <TitleBar />
      <Chat />
    </div>
  )
}
