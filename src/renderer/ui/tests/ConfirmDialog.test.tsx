import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '../ConfirmDialog'

beforeEach(() => {
  const modalRoot = document.createElement('div')
  modalRoot.id = 'modal-root'
  document.body.appendChild(modalRoot)
})

afterEach(() => {
  document.getElementById('modal-root')?.remove()
})

function renderDialog(
  overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {},
) {
  const props = {
    isOpen: true,
    title: 'Delete chat?',
    message: '“Sourdough tips” will be permanently deleted.',
    confirmLabel: 'Delete',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  }

  render(<ConfirmDialog {...props} />)

  return props
}

describe('ConfirmDialog', () => {
  it('renders nothing until it is asked to open', () => {
    renderDialog({ isOpen: false })

    expect(screen.queryByText('Delete chat?')).not.toBeInTheDocument()
  })

  it('announces itself as an alert dialog named and described by its copy', () => {
    renderDialog()

    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveAccessibleName('Delete chat?')
    expect(dialog).toHaveAccessibleDescription(
      '“Sourdough tips” will be permanently deleted.',
    )
  })

  it('confirms only when the confirm button is pressed', async () => {
    const { onConfirm, onCancel } = renderDialog()

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Delete' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('cancels from the cancel button', async () => {
    const { onConfirm, onCancel } = renderDialog()

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('cancels on Escape without confirming', async () => {
    const { onConfirm, onCancel } = renderDialog()

    await userEvent.setup().keyboard('{Escape}')

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  // A stray click outside must not throw away a decision the user still owes.
  it('ignores clicks on the backdrop', async () => {
    const { onConfirm, onCancel } = renderDialog()

    const overlay = screen.getByRole('alertdialog').closest('.m-4')
    await userEvent.setup().click(overlay as HTMLElement)

    expect(onCancel).not.toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  // Focusing the safe choice means Enter and Escape both cancel.
  it('opens with the cancel button focused', () => {
    renderDialog()

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })
})
