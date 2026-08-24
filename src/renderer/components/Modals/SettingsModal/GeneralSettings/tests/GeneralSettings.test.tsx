import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppAlert } from '@/components/AppAlert'
import { AlertProvider } from '@/contexts/AlertContext'
import { ChatSettingsProvider } from '@/contexts/ChatSettingsContext'
import {
  clearMockElectronApi,
  installMockElectronApi,
  type MockElectronApiOptions,
} from '@test/electronApi'
import { GeneralSettings } from '..'

function renderGeneralSettings(options: MockElectronApiOptions = {}) {
  const mock = installMockElectronApi(options)
  render(
    <AlertProvider>
      <ChatSettingsProvider>
        <GeneralSettings />
        <AppAlert />
      </ChatSettingsProvider>
    </AlertProvider>,
  )
  return mock
}

beforeEach(() => {
  const modalRoot = document.createElement('div')
  modalRoot.id = 'modal-root'
  document.body.appendChild(modalRoot)
})

afterEach(() => {
  clearMockElectronApi()
  document.getElementById('modal-root')?.remove()
})

describe('GeneralSettings send shortcut toggle', () => {
  it('reflects the persisted enabled state', async () => {
    renderGeneralSettings({ sendWithModifierEnter: true })

    await waitFor(() => {
      expect(
        screen.getByRole('switch', { name: 'Send with Ctrl+Enter' }),
      ).toBeChecked()
    })
  })

  it('persists the setting when toggled on', async () => {
    const user = userEvent.setup()
    const { setSendWithModifierEnter } = renderGeneralSettings()

    const toggle = await screen.findByRole('switch', {
      name: 'Send with Ctrl+Enter',
    })
    await user.click(toggle)

    expect(setSendWithModifierEnter).toHaveBeenCalledWith(true)
    await waitFor(() => expect(toggle).toBeChecked())
  })

  it('uses the macOS Cmd symbol in the label', async () => {
    renderGeneralSettings({ isMac: true })

    await waitFor(() => {
      expect(
        screen.getByRole('switch', { name: 'Send with ⌘+Enter' }),
      ).toBeInTheDocument()
    })
  })
})

describe('GeneralSettings logs', () => {
  it('opens the logs folder straight away', async () => {
    const { openLogs } = renderGeneralSettings()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Open' }))

    expect(openLogs).toHaveBeenCalledTimes(1)
  })

  it('asks for confirmation before deleting the logs', async () => {
    const { deleteLogs } = renderGeneralSettings()

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Delete' }))

    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Delete logs?')
    expect(deleteLogs).not.toHaveBeenCalled()
  })

  it('deletes the logs once the deletion is confirmed', async () => {
    const { deleteLogs } = renderGeneralSettings()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(deleteLogs).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  // Nothing else on screen changes when the log files go, so the button says so.
  it('confirms the deletion on the button itself', async () => {
    renderGeneralSettings()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(
      await screen.findByRole('button', { name: 'Deleted' }),
    ).toBeInTheDocument()
  })

  it('surfaces a failed delete without claiming it worked', async () => {
    const mock = renderGeneralSettings()
    mock.deleteLogs.mockRejectedValueOnce(new Error('locked'))
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to delete the logs. Please try again.',
    )
    expect(
      screen.queryByRole('button', { name: 'Deleted' }),
    ).not.toBeInTheDocument()
  })

  it('surfaces a folder that cannot be opened', async () => {
    const mock = renderGeneralSettings()
    mock.openLogs.mockRejectedValueOnce(new Error('no such directory'))

    await userEvent.setup().click(screen.getByRole('button', { name: 'Open' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to open the logs folder. Please try again.',
    )
  })

  it('keeps the logs when the deletion is cancelled', async () => {
    const { deleteLogs } = renderGeneralSettings()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(deleteLogs).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
})
