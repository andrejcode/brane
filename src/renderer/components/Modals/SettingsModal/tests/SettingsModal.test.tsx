import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { AlertProvider } from '@/contexts/AlertContext'
import { ChatSettingsProvider } from '@/contexts/ChatSettingsContext'
import {
  type ModalName,
  ModalProvider,
  useModals,
} from '@/contexts/ModalContext'
import { ShortcutsProvider } from '@/contexts/ShortcutsContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
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
    <AlertProvider>
      <ModalProvider>
        <ThemeProvider>
          <ChatSettingsProvider>
            <ShortcutsProvider>
              {open && <OpenOnMount modal="settings" />}
              <SettingsModal />
            </ShortcutsProvider>
          </ChatSettingsProvider>
        </ThemeProvider>
      </ModalProvider>
    </AlertProvider>,
  )
}

describe('SettingsModal', () => {
  it('does not render its contents when closed', () => {
    renderSettings({ open: false })

    expect(screen.queryByText('Theme')).not.toBeInTheDocument()
  })

  it('renders the general panel by default when open', () => {
    renderSettings()

    expect(
      screen.getByRole('heading', { name: 'Settings' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('switch', { name: 'Send with Ctrl+Enter' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Theme')).not.toBeInTheDocument()
  })

  it('closes via the close button', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(screen.getByRole('button', { name: 'Close settings' }))

    expect(
      screen.queryByRole('heading', { name: 'Settings' }),
    ).not.toBeInTheDocument()
  })

  it('exposes the sidebar as a tablist with accessible tabs', () => {
    renderSettings()

    expect(
      screen.getByRole('tablist', { name: 'Settings sections' }),
    ).toBeInTheDocument()

    const generalTab = screen.getByRole('tab', { name: 'General' })
    const appearanceTab = screen.getByRole('tab', { name: 'Appearance' })

    expect(generalTab).toHaveAttribute('aria-selected', 'true')
    expect(appearanceTab).toHaveAttribute('aria-selected', 'false')

    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', generalTab.id)
    expect(generalTab).toHaveAttribute('aria-controls', panel.id)
  })

  it('switches the active panel when a tab is clicked', async () => {
    const user = userEvent.setup()
    renderSettings()

    expect(
      screen.getByRole('switch', { name: 'Send with Ctrl+Enter' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Appearance' }))

    expect(screen.getByRole('tab', { name: 'Appearance' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      screen.getByRole('heading', { name: 'Appearance' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('switch', { name: 'Send with Ctrl+Enter' }),
    ).not.toBeInTheDocument()
  })

  // A confirmation opens on top of the modal, so dismissing it must not take
  // the modal underneath with it.
  it('stays open when a confirmation inside it is dismissed', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(screen.getByRole('tab', { name: 'Shortcuts' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Shortcuts' }),
    ).toBeInTheDocument()
  })

  it('moves between tabs with the arrow keys', async () => {
    const user = userEvent.setup()
    renderSettings()

    const generalTab = screen.getByRole('tab', { name: 'General' })
    generalTab.focus()

    await user.keyboard('{ArrowDown}')

    const appearanceTab = screen.getByRole('tab', { name: 'Appearance' })
    expect(appearanceTab).toHaveAttribute('aria-selected', 'true')
    expect(appearanceTab).toHaveFocus()
  })
})
