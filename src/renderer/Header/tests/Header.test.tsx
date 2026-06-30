import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AlertProvider } from '@/contexts/AlertContext'
import { ModalProvider, useModals } from '@/contexts/ModalContext'
import { ModelProvider } from '@/contexts/ModelContext'
import { Header } from '@/Header'
import {
  clearMockElectronApi,
  installMockElectronApi,
  type MockElectronApi,
} from '@test/electronApi'

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

  it('renders the toolbar buttons', () => {
    renderHeader()

    expect(
      screen.getByRole('button', { name: 'Toggle sidebar' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Select model' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Open settings' }),
    ).toBeInTheDocument()
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

  it('shows the model name once loading finishes', async () => {
    clearMockElectronApi()
    mock = installMockElectronApi({
      isMac: false,
      models: ['my-model.gguf'],
      selectedModel: 'my-model.gguf',
    })
    renderHeader()

    expect(await screen.findByText('my-model')).toBeInTheDocument()
    expect(
      screen.queryByRole('status', { name: 'Loading' }),
    ).not.toBeInTheDocument()
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
