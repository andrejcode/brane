import { AlertProvider } from './contexts/AlertContext'
import { ChatSettingsProvider } from './contexts/ChatSettingsContext'
import { LocaleProvider } from './contexts/LocaleContext'
import { ModalProvider } from './contexts/ModalContext'
import { ModelProvider } from './contexts/ModelContext'
import { ShortcutsProvider } from './contexts/ShortcutsContext'
import { ThemeProvider } from './contexts/ThemeContext'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AlertProvider>
        <ModalProvider>
          <ModelProvider>
            <ThemeProvider>
              <ChatSettingsProvider>
                <ShortcutsProvider>{children}</ShortcutsProvider>
              </ChatSettingsProvider>
            </ThemeProvider>
          </ModelProvider>
        </ModalProvider>
      </AlertProvider>
    </LocaleProvider>
  )
}
