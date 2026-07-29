import { clsx } from 'clsx'
import { useState } from 'react'
import { useTranslation } from '@/contexts/LocaleContext'
import { introMessagesByLocale } from '@/i18n'

export const introMessages = introMessagesByLocale.en

// The locale catalogs share the same greetings by index, so picking an index
// once keeps the greeting stable across re-renders while still translating it
// when the language changes.
function pickIntroIndex() {
  return Math.floor(Math.random() * introMessagesByLocale.en.length)
}

interface IntroMessageProps {
  isVisible: boolean
}

export function IntroMessage({ isVisible }: IntroMessageProps) {
  const { locale } = useTranslation()
  const [introIndex] = useState(pickIntroIndex)
  const introMessage = introMessagesByLocale[locale][introIndex]

  return (
    <h1
      data-testid="intro-greeting"
      className={clsx(
        'pointer-events-none absolute inset-x-0 bottom-full mb-10 text-center',
        'text-2xl font-normal',
        'transition-opacity duration-300 ease-out',
        isVisible ? 'opacity-100' : 'opacity-0',
      )}
    >
      {introMessage}
    </h1>
  )
}
