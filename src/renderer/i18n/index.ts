import type { Locale } from '@shared/types'
import { de } from './de'
import { en } from './en'
import { hr } from './hr'
import { sr } from './sr'
import type { MessageKey, Messages } from './types'

export type { MessageKey, Messages } from './types'
export { introMessagesByLocale } from './introMessages'

export const messages: Record<Locale, Messages> = { en, de, hr, sr }

// Language names shown in their own language (autonyms), the convention users
// expect in a language picker regardless of the app's current language.
export const LOCALE_OPTIONS: ReadonlyArray<{ id: Locale; label: string }> = [
  { id: 'en', label: 'English' },
  { id: 'de', label: 'Deutsch' },
  { id: 'hr', label: 'Hrvatski' },
  { id: 'sr', label: 'Srpski' },
]

export type TranslationParams = Record<string, string | number>

export function translate(
  locale: Locale,
  key: MessageKey,
  params?: TranslationParams,
) {
  const template = messages[locale][key]

  if (!params) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}
