import { ContextUsageSettings } from './ContextUsageSettings'
import { MessageFontSizeSettings } from './MessageFontSizeSettings'
import { PointerCursorSettings } from './PointerCursorSettings'
import { ThemeSettings } from './ThemeSettings'

export function ApperanceSettings() {
  return (
    <div className="flex flex-col gap-6">
      <ThemeSettings />
      <MessageFontSizeSettings />
      <ContextUsageSettings />
      <PointerCursorSettings />
    </div>
  )
}
