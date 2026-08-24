import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    <ShortcutsProvider>
      <ShortcutsSettings />
    </ShortcutsProvider>,
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
