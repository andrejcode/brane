import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppAlert } from '@/components/AppAlert'
import { AlertProvider } from '@/contexts/AlertContext'
import { ShortcutsProvider } from '@/contexts/ShortcutsContext'
import { DEFAULT_SHORTCUTS } from '@shared/types'
import {
  clearMockElectronApi,
  installMockElectronApi,
  type MockElectronApi,
} from '@test/electronApi'
import { ShortcutsSettings } from '..'

let mock: MockElectronApi

beforeEach(() => {
  const modalRoot = document.createElement('div')
  modalRoot.id = 'modal-root'
  document.body.appendChild(modalRoot)
  mock = installMockElectronApi()
})

afterEach(() => {
  document.getElementById('modal-root')?.remove()
  clearMockElectronApi()
})

function renderShortcuts() {
  return render(
    <AlertProvider>
      <ShortcutsProvider>
        <ShortcutsSettings />
        <AppAlert />
      </ShortcutsProvider>
    </AlertProvider>,
  )
}

describe('ShortcutsSettings', () => {
  it('describes each action next to its shortcut', async () => {
    renderShortcuts()

    expect(
      await screen.findByText('Open or close settings'),
    ).toBeInTheDocument()
    expect(screen.getByText('Start a new chat')).toBeInTheDocument()
  })

  it('saves a newly recorded shortcut', async () => {
    renderShortcuts()
    const user = userEvent.setup()

    await user.click(
      await screen.findByRole('button', { name: 'Start a new chat' }),
    )
    await user.keyboard('{Control>}j{/Control}')

    await waitFor(() => {
      expect(mock.setShortcuts).toHaveBeenCalledWith({
        ...DEFAULT_SHORTCUTS,
        newChat: { key: 'j', mod: true, shift: false, alt: false },
      })
    })
  })

  it('surfaces a shortcut that could not be saved', async () => {
    renderShortcuts()
    mock.setShortcuts.mockRejectedValueOnce(new Error('read-only store'))
    const user = userEvent.setup()

    await user.click(
      await screen.findByRole('button', { name: 'Start a new chat' }),
    )
    await user.keyboard('{Control>}j{/Control}')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to save that shortcut. Please try again.',
    )
  })

  it('asks for confirmation instead of resetting straight away', async () => {
    renderShortcuts()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Reset' }))

    expect(screen.getByRole('alertdialog')).toHaveAccessibleName(
      'Reset shortcuts?',
    )
    expect(mock.setShortcuts).not.toHaveBeenCalled()
  })

  it('restores the defaults once the reset is confirmed', async () => {
    renderShortcuts()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Reset' }))

    await waitFor(() => {
      expect(mock.setShortcuts).toHaveBeenCalledWith(DEFAULT_SHORTCUTS)
    })
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: 'Restored' }),
    ).toBeInTheDocument()
  })

  it('surfaces a reset that could not be saved', async () => {
    renderShortcuts()
    mock.setShortcuts.mockRejectedValueOnce(new Error('read-only store'))
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Reset' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to reset the shortcuts. Please try again.',
    )
    expect(
      screen.queryByRole('button', { name: 'Restored' }),
    ).not.toBeInTheDocument()
  })

  it('leaves the shortcuts alone when the reset is cancelled', async () => {
    renderShortcuts()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(mock.setShortcuts).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
})
