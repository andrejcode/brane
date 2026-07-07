import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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
    <ChatSettingsProvider>
      <GeneralSettings />
    </ChatSettingsProvider>,
  )
  return mock
}

afterEach(() => {
  clearMockElectronApi()
})

describe('GeneralSettings send shortcut toggle', () => {
  it('is off by default', async () => {
    renderGeneralSettings()

    await waitFor(() => {
      expect(
        screen.getByRole('switch', { name: 'Send with Ctrl+Enter' }),
      ).not.toBeChecked()
    })
  })

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

describe('GeneralSettings on Windows/Linux', () => {
  beforeEach(() => {
    installMockElectronApi({ isMac: false })
  })

  it('uses the Ctrl label', async () => {
    render(
      <ChatSettingsProvider>
        <GeneralSettings />
      </ChatSettingsProvider>,
    )

    await waitFor(() => {
      expect(
        screen.getByRole('switch', { name: 'Send with Ctrl+Enter' }),
      ).toBeInTheDocument()
    })
  })
})
