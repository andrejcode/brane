import { AlertProvider } from './contexts/AlertContext'
import { ChatProvider } from './contexts/ChatContext'
import { ChatSettingsProvider } from './contexts/ChatSettingsContext'
import { LocaleProvider } from './contexts/LocaleContext'
import { ModalProvider } from './contexts/ModalContext'
import { ModelProvider } from './contexts/ModelContext'
import { ShortcutsProvider } from './contexts/ShortcutsContext'
import { SidebarProvider } from './contexts/SidebarContext'
import { ThemeProvider } from './contexts/ThemeContext'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AlertProvider>
        <ModalProvider>
          <ModelProvider>
            <ThemeProvider>
              <ChatSettingsProvider>
                <ShortcutsProvider>
                  <SidebarProvider>
                    <ChatProvider>{children}</ChatProvider>
                  </SidebarProvider>
                </ShortcutsProvider>
              </ChatSettingsProvider>
            </ThemeProvider>
          </ModelProvider>
        </ModalProvider>
      </AlertProvider>
    </LocaleProvider>
  )
}
