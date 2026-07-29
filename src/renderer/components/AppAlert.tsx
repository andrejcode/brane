import { useAlert } from '@/contexts/AlertContext'
import { Alert } from '@/ui/Alert'

export function AppAlert() {
  const { alert, dismissAlert } = useAlert()

  if (!alert) {
    return null
  }

  return (
    <Alert
      message={alert.message}
      variant={alert.variant}
      onDismiss={dismissAlert}
      className="absolute top-14 right-0 z-50 mr-4 ml-4"
    />
  )
}
