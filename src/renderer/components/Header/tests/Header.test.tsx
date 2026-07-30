import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AlertProvider } from '@/contexts/AlertContext'
import { ModalProvider, useModals } from '@/contexts/ModalContext'
import { ModelProvider } from '@/contexts/ModelContext'
import {
  clearMockElectronApi,
  installMockElectronApi,
  type MockElectronApi,
} from '@test/electronApi'
import { Header } from '..'

let mock: MockElectronApi

// Surfaces the currently active modal so tests can assert that the header
// triggers the right modal through the shared context.
function ActiveModalProbe() {
  const { activeModal } = useModals()
  return <div data-testid="active-modal">{activeModal ?? 'none'}</div>
}

function renderHeader(
  props: Partial<React.ComponentProps<typeof Header>> = {},
) {
  return render(
    <AlertProvider>
      <ModalProvider>
        <ModelProvider>
          <Header {...props} />
          <ActiveModalProbe />
        </ModelProvider>
      </ModalProvider>
    </AlertProvider>,
  )
}

afterEach(() => {
  clearMockElectronApi()
})

describe('Header on non-mac', () => {
  beforeEach(() => {
    mock = installMockElectronApi({ isMac: false })
  })

  it('does not query fullscreen state', () => {
    renderHeader()

    expect(mock.getIsFullScreen).not.toHaveBeenCalled()
  })

  it('uses the compact left margin', () => {
    const { container } = renderHeader()

    expect(container.querySelector('.z-10')?.className).toContain('ml-4')
  })

  it('opens settings when the settings button is clicked', async () => {
    const user = userEvent.setup()
    renderHeader()

    await user.click(screen.getByRole('button', { name: 'Open settings' }))

    expect(screen.getByTestId('active-modal')).toHaveTextContent('settings')
  })

  it('opens the model modal when the model button is clicked', async () => {
    const user = userEvent.setup()
    renderHeader()

    await user.click(screen.getByRole('button', { name: 'Select model' }))

    expect(screen.getByTestId('active-modal')).toHaveTextContent('models')
  })

  it('shows the selected model name on the button', async () => {
    clearMockElectronApi()
    mock = installMockElectronApi({
      isMac: false,
      models: ['my-model.gguf'],
      selectedModel: 'my-model.gguf',
    })
    renderHeader()

    expect(await screen.findByText('my-model')).toBeInTheDocument()
  })

  it('shows a loading spinner instead of the name while the model loads', async () => {
    clearMockElectronApi()
    mock = installMockElectronApi({
      isMac: false,
      models: ['my-model.gguf'],
      selectedModel: 'my-model.gguf',
    })
    // Keep the load in flight so the spinner stays on screen.
    mock.loadModel.mockReturnValue(new Promise<void>(() => {}))

    renderHeader()

    expect(
      await screen.findByRole('status', { name: 'Loading' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('my-model')).not.toBeInTheDocument()
  })

  it('falls back to "Select model" when the selected model never finishes loading', async () => {
    clearMockElectronApi()
    mock = installMockElectronApi({
      isMac: false,
      models: ['my-model.gguf'],
      selectedModel: 'my-model.gguf',
    })
    // A model that's selected but fails to load (or is canceled) must not show
    // its name, since it isn't actually loaded.
    mock.loadModel.mockRejectedValue(new Error('load failed'))

    renderHeader()

    await waitFor(() => {
      expect(screen.getByText('Select model')).toBeInTheDocument()
    })
    expect(screen.queryByText('my-model')).not.toBeInTheDocument()
  })
})

describe('Header on mac', () => {
  beforeEach(() => {
    mock = installMockElectronApi({ isMac: true, isFullScreen: false })
  })

  it('queries fullscreen state and reserves room for the traffic lights', async () => {
    const { container } = renderHeader()

    await waitFor(() => {
      expect(mock.getIsFullScreen).toHaveBeenCalledTimes(1)
    })
    expect(container.querySelector('.z-10')?.className).toContain('ml-24')
  })

  it('drops the traffic-light margin when entering fullscreen', async () => {
    const { container } = renderHeader()

    await waitFor(() => {
      expect(mock.onFullScreenChange).toHaveBeenCalled()
    })

    act(() => {
      mock.emitFullScreenChange(true)
    })

    expect(container.querySelector('.z-10')?.className).toContain('ml-4')
  })

  it('unsubscribes from fullscreen changes on unmount', async () => {
    const { unmount } = renderHeader()

    await waitFor(() => {
      expect(mock.onFullScreenChange).toHaveBeenCalled()
    })

    unmount()

    expect(mock.fullScreenUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
