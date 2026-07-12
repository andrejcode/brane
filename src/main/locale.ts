import { app, ipcMain } from 'electron'
import {
  DEFAULT_LOCALE,
  IpcChannels,
  type Locale,
  LOCALES,
} from '@shared/types'
import { logger } from './logger'
import { getStoreValue, setStoreValue } from './store'

function isValidLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
  )
}

// OS locales arrive as BCP 47 tags like "de-DE" or "sr-Latn-RS"; only the
// primary language subtag maps onto the languages we ship.
function matchSupportedLocale(languageTag: string): Locale | null {
  const primarySubtag = languageTag.toLowerCase().split('-')[0]
  return isValidLocale(primarySubtag) ? primarySubtag : null
}

function detectSystemLocale(): Locale {
  const candidates = [...app.getPreferredSystemLanguages(), app.getLocale()]

  for (const candidate of candidates) {
    const matched = matchSupportedLocale(candidate)
    if (matched) {
      return matched
    }
  }

  return DEFAULT_LOCALE
}

// Runs once the app is ready: honor a previously stored choice, otherwise fall
// back to the computer's language when we support it, then English.
export function initializeLocale() {
  const stored = getStoreValue('locale')
  if (isValidLocale(stored)) {
    return
  }

  const detected = detectSystemLocale()
  logger.info(`No stored locale, using detected locale: ${detected}`)
  setStoreValue('locale', detected)
}

export function registerLocaleHandlers() {
  ipcMain.handle(IpcChannels.getLocale, () => {
    const stored = getStoreValue('locale')
    return isValidLocale(stored) ? stored : DEFAULT_LOCALE
  })

  ipcMain.handle(IpcChannels.setLocale, (_event, locale: unknown) => {
    if (isValidLocale(locale)) {
      logger.info(`Locale changed to ${locale}`)
      setStoreValue('locale', locale)
      return locale
    }

    logger.warn(
      `Invalid locale received, falling back to ${DEFAULT_LOCALE}: ${String(locale)}`,
    )
    setStoreValue('locale', DEFAULT_LOCALE)
    return DEFAULT_LOCALE
  })
}
