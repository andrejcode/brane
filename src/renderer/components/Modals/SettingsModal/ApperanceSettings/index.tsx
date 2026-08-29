import { MessageFontSizeSettings } from './MessageFontSizeSettings'
import { ThemeSettings } from './ThemeSettings'

export function ApperanceSettings() {
  return (
    <div className="flex flex-col gap-4">
      <ThemeSettings />
      <MessageFontSizeSettings />
    </div>
  )
}
