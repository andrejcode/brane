import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Modal } from '../Modal'

beforeEach(() => {
  const modalRoot = document.createElement('div')
  modalRoot.id = 'modal-root'
  document.body.appendChild(modalRoot)
})

afterEach(() => {
  document.getElementById('modal-root')?.remove()
})

function renderModal(overrides: Partial<Parameters<typeof Modal>[0]> = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Settings',
    children: <div>Modal body</div>,
    ...overrides,
  }

  render(<Modal {...props} />)

  return props
}

describe('Modal visibility', () => {
  it('renders nothing when closed', () => {
    renderModal({ isOpen: false })

    expect(screen.queryByText('Settings')).not.toBeInTheDocument()
    expect(screen.queryByText('Modal body')).not.toBeInTheDocument()
  })

  it('renders the title and children when open', () => {
    renderModal()

    expect(
      screen.getByRole('heading', { name: 'Settings' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Modal body')).toBeInTheDocument()
  })

  it('renders into the modal-root portal target', () => {
    renderModal()

    const modalRoot = document.getElementById('modal-root')
    expect(modalRoot).toContainElement(screen.getByText('Modal body'))
  })
})

describe('Modal closing', () => {
  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()

    await user.click(screen.getByRole('button', { name: 'Close modal' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the backdrop is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()

    // The outermost overlay carries the close handler; `m-4` is unique to it.
    const overlay = screen.getByText('Modal body').closest('.m-4')
    await user.click(overlay as HTMLElement)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when the panel content is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()

    await user.click(screen.getByText('Modal body'))

    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('Modal scrolling', () => {
  it('places children in a scrollable region that can shrink', () => {
    renderModal()

    const scrollRegion = screen.getByText('Modal body').parentElement
    expect(scrollRegion).toHaveClass('overflow-y-auto')
    expect(scrollRegion).toHaveClass('min-h-0')
    expect(scrollRegion).toHaveClass('flex-1')
  })
})
