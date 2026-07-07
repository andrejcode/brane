import { useChatSettings } from '@/contexts/ChatSettingsContext'
import { Switch } from '@/ui/Switch'

export function GeneralSettings() {
  const { sendWithModifierEnter, setSendWithModifierEnter } = useChatSettings()

  const sendShortcut = window.electronApi.isMac ? '⌘' : 'Ctrl'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <h3 id="send-with-modifier-enter-label">
            Send with {sendShortcut}+Enter
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Use {sendShortcut}+Enter to send a message. Enter adds a new line.
          </p>
        </div>
        <Switch
          checked={sendWithModifierEnter}
          onChange={(checked) => void setSendWithModifierEnter(checked)}
          ariaLabelledBy="send-with-modifier-enter-label"
        />
      </div>
    </div>
  )
}
