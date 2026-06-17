import { createContext, use, useCallback, useMemo, useState } from 'react'
import type { AlertVariant } from '../ui/Alert'

interface AlertState {
  message: string
  variant: AlertVariant
}

interface AlertContextValue {
  alert: AlertState | null
  showAlert: (message: string, variant: AlertVariant) => void
  dismissAlert: () => void
}

const AlertContext = createContext<AlertContextValue | null>(null)

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertState | null>(null)

  const showAlert = useCallback((message: string, variant: AlertVariant) => {
    setAlert({ message, variant })
  }, [])

  const dismissAlert = useCallback(() => {
    setAlert(null)
  }, [])

  const value = useMemo(
    () => ({ alert, showAlert, dismissAlert }),
    [alert, showAlert, dismissAlert],
  )

  return <AlertContext value={value}>{children}</AlertContext>
}

export function useAlert() {
  const context = use(AlertContext)

  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider')
  }

  return context
}
