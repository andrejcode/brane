import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

interface ChatSettingsContextValue {
  sendWithModifierEnter: boolean
  isReady: boolean
  setSendWithModifierEnter: (enabled: boolean) => Promise<void>
}

const ChatSettingsContext = createContext<ChatSettingsContextValue | null>(null)

export function ChatSettingsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [sendWithModifierEnter, setSendWithModifierEnterState] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadSettings = async () => {
      try {
        const enabled = await window.electronApi.getSendWithModifierEnter()
        if (isMounted) {
          setSendWithModifierEnterState(enabled)
        }
      } catch {
        if (isMounted) {
          setSendWithModifierEnterState(false)
        }
      } finally {
        if (isMounted) {
          setIsReady(true)
        }
      }
    }

    void loadSettings()

    return () => {
      isMounted = false
    }
  }, [])

  const setSendWithModifierEnter = useCallback(async (enabled: boolean) => {
    const saved = await window.electronApi.setSendWithModifierEnter(enabled)
    setSendWithModifierEnterState(saved)
  }, [])

  const value = useMemo(
    () => ({ sendWithModifierEnter, isReady, setSendWithModifierEnter }),
    [sendWithModifierEnter, isReady, setSendWithModifierEnter],
  )

  return <ChatSettingsContext value={value}>{children}</ChatSettingsContext>
}

export function useChatSettings() {
  const context = use(ChatSettingsContext)

  if (!context) {
    throw new Error(
      'useChatSettings must be used within a ChatSettingsProvider',
    )
  }

  return context
}
