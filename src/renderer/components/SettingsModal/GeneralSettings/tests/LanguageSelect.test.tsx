import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatSettingsProvider } from '@/contexts/ChatSettingsContext'
import { LocaleProvider } from '@/contexts/LocaleContext'
import {
  clearMockElectronApi,
  installMockElectronApi,
  type MockElectronApiOptions,
} from '@test/electronApi'
import { GeneralSettings } from '..'

function renderGeneralSettings(options: MockElectronApiOptions = {}) {
  const mock = installMockElectronApi(options)
  render(
    <LocaleProvider>
      <ChatSettingsProvider>
        <GeneralSettings />
      </ChatSettingsProvider>
    </LocaleProvider>,
  )
  return mock
}

afterEach(() => {
  clearMockElectronApi()
})

describe('GeneralSettings language selector', () => {
  it('reflects the persisted locale', async () => {
    renderGeneralSettings({ locale: 'de' })

    const select = await screen.findByLabelText('Sprache')
    await waitFor(() => expect(select).toHaveValue('de'))
  })

  it('lists every supported language by its autonym', async () => {
    renderGeneralSettings()

    await screen.findByRole('option', { name: 'English' })
    expect(screen.getByRole('option', { name: 'Deutsch' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Hrvatski' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Srpski' })).toBeInTheDocument()
  })

  it('persists the chosen language and re-renders the UI in it', async () => {
    const user = userEvent.setup()
    const mock = renderGeneralSettings()

    const select = await screen.findByLabelText('Language')
    await user.selectOptions(select, 'hr')

    expect(mock.setLocale).toHaveBeenCalledWith('hr')
    await waitFor(() =>
      expect(screen.getByLabelText('Jezik')).toBeInTheDocument(),
    )
  })
})
