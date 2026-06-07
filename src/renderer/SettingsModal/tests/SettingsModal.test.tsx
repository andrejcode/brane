import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearMockElectronApi, installMockElectronApi } from '@test/electronApi'
import { SettingsModal } from '..'

beforeEach(() => {
  const modalRoot = document.createElement('div')
  modalRoot.id = 'modal-root'
  document.body.appendChild(modalRoot)
  installMockElectronApi({ theme: 'system' })
})

afterEach(() => {
  document.getElementById('modal-root')?.remove()
  clearMockElectronApi()
})

describe('SettingsModal', () => {
  it('does not render its contents when closed', () => {
    render(<SettingsModal isOpen={false} onClose={vi.fn()} />)

    expect(screen.queryByText('Theme')).not.toBeInTheDocument()
  })

  it('renders the theme settings inside the modal when open', async () => {
    render(<SettingsModal isOpen onClose={vi.fn()} />)

    expect(
      screen.getByRole('heading', { name: 'Settings' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Theme')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'System' })).toHaveClass(
        'bg-neutral-800',
      )
    })
  })

  it('closes via the close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<SettingsModal isOpen onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Close modal' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
