import { useChatSettings } from '@/contexts/ChatSettingsContext'
import { Button } from '@/ui/Button'
import { Switch } from '@/ui/Switch'

export function GeneralSettings() {
  const { sendWithModifierEnter, setSendWithModifierEnter } = useChatSettings()

  const sendShortcut = window.electronApi.isMac ? '⌘' : 'Ctrl'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <h4 id="send-with-modifier-enter-label">
            Send with {sendShortcut}+Enter
          </h4>
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

      <div className="flex flex-col gap-2">
        <h4 className="text-lg font-medium">Logs</h4>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <h5>Open logs</h5>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Open the logs folder in your file explorer.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => void window.electronApi.openLogs()}
            >
              Open
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <h5>Delete logs</h5>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Permanently delete all log files from the logs folder.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => void window.electronApi.deleteLogs()}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
