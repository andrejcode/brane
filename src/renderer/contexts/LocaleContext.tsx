import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { type MessageKey, translate, type TranslationParams } from '@/i18n'
import { DEFAULT_LOCALE, type Locale } from '@shared/types'

interface LocaleContextValue {
  locale: Locale
  isReady: boolean
  setLocale: (locale: Locale) => Promise<void>
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

// Unlike the app's other contexts, translation is a leaf-level concern that many
// components (and their isolated tests) use without the full provider tree, so
// missing the provider degrades to English rather than throwing.
const fallbackValue: LocaleContextValue = {
  locale: DEFAULT_LOCALE,
  isReady: true,
  setLocale: () => Promise.resolve(),
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadLocale = async () => {
      try {
        const currentLocale = await window.electronApi.getLocale()
        if (isMounted) {
          setLocaleState(currentLocale)
        }
      } catch {
        if (isMounted) {
          setLocaleState(DEFAULT_LOCALE)
        }
      } finally {
        if (isMounted) {
          setIsReady(true)
        }
      }
    }

    void loadLocale()

    return () => {
      isMounted = false
    }
  }, [])

  const setLocale = useCallback(async (next: Locale) => {
    const saved = await window.electronApi.setLocale(next)
    setLocaleState(saved)
  }, [])

  const value = useMemo(
    () => ({ locale, isReady, setLocale }),
    [locale, isReady, setLocale],
  )

  return <LocaleContext value={value}>{children}</LocaleContext>
}

export function useLocale() {
  return use(LocaleContext) ?? fallbackValue
}

export function useTranslation() {
  const { locale } = useLocale()

  const t = useCallback(
    (key: MessageKey, params?: TranslationParams) =>
      translate(locale, key, params),
    [locale],
  )

  return { t, locale }
}
