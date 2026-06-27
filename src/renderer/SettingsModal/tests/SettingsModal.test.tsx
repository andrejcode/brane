import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type ModalName,
  ModalProvider,
  useModals,
} from '@/contexts/ModalContext'
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

// Opens a modal through the shared context as soon as it mounts, mirroring how
// the header triggers modals in the real app.
function OpenOnMount({ modal }: { modal: ModalName }) {
  const { openModal } = useModals()
  useEffect(() => openModal(modal), [openModal, modal])
  return null
}

function renderSettings({ open = true } = {}) {
  return render(
    <ModalProvider>
      {open && <OpenOnMount modal="settings" />}
      <SettingsModal />
    </ModalProvider>,
  )
}

describe('SettingsModal', () => {
  it('does not render its contents when closed', () => {
    renderSettings({ open: false })

    expect(screen.queryByText('Theme')).not.toBeInTheDocument()
  })

  it('renders the theme settings inside the modal when open', async () => {
    renderSettings()

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
    renderSettings()

    await user.click(screen.getByRole('button', { name: 'Close settings' }))

    expect(
      screen.queryByRole('heading', { name: 'Settings' }),
    ).not.toBeInTheDocument()
  })
})
