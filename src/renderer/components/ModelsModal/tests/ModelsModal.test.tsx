import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { AlertProvider } from '@/contexts/AlertContext'
import {
  type ModalName,
  ModalProvider,
  useModals,
} from '@/contexts/ModalContext'
import { ModelProvider } from '@/contexts/ModelContext'
import {
  clearMockElectronApi,
  installMockElectronApi,
  type MockElectronApi,
} from '@test/electronApi'
import { ModelsModal, SEARCH_DEBOUNCE_MS } from '..'

let mock: MockElectronApi

beforeEach(() => {
  const modalRoot = document.createElement('div')
  modalRoot.id = 'modal-root'
  document.body.appendChild(modalRoot)
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

function renderModal({ open = true } = {}) {
  return render(
    <AlertProvider>
      <ModalProvider>
        <ModelProvider>
          {open && <OpenOnMount modal="models" />}
          <ModelsModal />
        </ModelProvider>
      </ModalProvider>
    </AlertProvider>,
  )
}

describe('ModelsModal', () => {
  it('does not render its contents when closed', () => {
    mock = installMockElectronApi({ models: ['a.gguf'] })

    renderModal({ open: false })

    expect(
      screen.queryByRole('heading', { name: 'Models' }),
    ).not.toBeInTheDocument()
  })

  it('shows an empty state when there are no models', async () => {
    mock = installMockElectronApi({ models: [], selectedModel: null })

    renderModal()

    expect(screen.getByRole('heading', { name: 'Models' })).toBeInTheDocument()
    expect(await screen.findByText(/No models found/i)).toBeInTheDocument()
  })

  it('lists the available models', async () => {
    mock = installMockElectronApi({
      models: ['alpha.gguf', 'beta.gguf'],
      selectedModel: null,
    })

    renderModal()

    expect(
      await screen.findByRole('button', { name: 'alpha' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'beta' })).toBeInTheDocument()
  })

  it('marks the selected model as active', async () => {
    mock = installMockElectronApi({
      models: ['alpha.gguf', 'beta.gguf'],
      selectedModel: 'beta.gguf',
    })

    renderModal()

    const selected = await screen.findByRole('button', { name: 'beta' })

    expect(selected.className).toContain('bg-neutral-300')
  })

  it('persists and loads the model when clicked, keeping the modal open', async () => {
    mock = installMockElectronApi({
      models: ['alpha.gguf', 'beta.gguf'],
      selectedModel: null,
    })
    const user = userEvent.setup()

    renderModal()

    await user.click(await screen.findByRole('button', { name: 'alpha' }))

    await waitFor(() => {
      expect(mock.setSelectedModel).toHaveBeenCalledWith('alpha.gguf')
    })
    expect(mock.loadModel).toHaveBeenCalled()
    // The modal stays open so the user can watch the load settle.
    expect(screen.getByRole('heading', { name: 'Models' })).toBeInTheDocument()
  })

  it('shows a spinner while loading then a checkmark once loaded', async () => {
    mock = installMockElectronApi({
      models: ['alpha.gguf'],
      selectedModel: null,
    })
    let resolveLoad: () => void = () => {}
    mock.loadModel.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveLoad = resolve
      }),
    )
    const user = userEvent.setup()

    renderModal()

    await user.click(await screen.findByRole('button', { name: 'alpha' }))

    expect(
      await screen.findByRole('status', { name: 'Loading' }),
    ).toBeInTheDocument()

    act(() => {
      resolveLoad()
    })

    await waitFor(() => {
      expect(
        screen.queryByRole('status', { name: 'Loading' }),
      ).not.toBeInTheDocument()
    })
    expect(
      screen.getByRole('button', { name: 'Unload model' }),
    ).toBeInTheDocument()
  })

  it('cancels an in-flight load and ignores its late resolution when Stop loading is clicked', async () => {
    mock = installMockElectronApi({
      models: ['alpha.gguf'],
      selectedModel: null,
    })
    let resolveLoad: () => void = () => {}
    mock.loadModel.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveLoad = resolve
      }),
    )
    const user = userEvent.setup()

    renderModal()

    await user.click(await screen.findByRole('button', { name: 'alpha' }))

    await user.click(
      await screen.findByRole('button', { name: 'Stop loading' }),
    )

    await waitFor(() => {
      expect(mock.unloadModel).toHaveBeenCalled()
    })
    expect(mock.setSelectedModel).toHaveBeenCalledWith(null)
    expect(
      screen.queryByRole('status', { name: 'Loading' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Stop loading' }),
    ).not.toBeInTheDocument()

    // A load that finishes after the cancel must not mark the model as loaded.
    act(() => {
      resolveLoad()
    })

    await waitFor(() => {
      expect(mock.setSelectedModel).toHaveBeenCalledWith(null)
    })
    expect(
      screen.queryByRole('button', { name: 'Unload model' }),
    ).not.toBeInTheDocument()
  })

  it('unloads the current model before loading a newly selected one, hiding the eject button while loading', async () => {
    mock = installMockElectronApi({
      models: ['alpha.gguf', 'beta.gguf'],
      selectedModel: 'alpha.gguf',
    })
    let resolveSwitchLoad: () => void = () => {}
    mock.loadModel.mockResolvedValueOnce(undefined).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveSwitchLoad = resolve
      }),
    )
    const user = userEvent.setup()

    renderModal()

    // Wait for the persisted model to finish its startup load.
    await screen.findByRole('button', { name: 'Unload model' })

    await user.click(screen.getByRole('button', { name: 'beta' }))

    await waitFor(() => {
      expect(mock.unloadModel).toHaveBeenCalledTimes(1)
    })
    expect(mock.setSelectedModel).toHaveBeenCalledWith('beta.gguf')
    // The outgoing model must be unloaded before the new one starts loading.
    const unloadOrder = mock.unloadModel.mock.invocationCallOrder[0]
    const switchLoadOrder = mock.loadModel.mock.invocationCallOrder[1]
    expect(unloadOrder).toBeGreaterThan(0)
    expect(switchLoadOrder).toBeGreaterThan(0)
    expect(unloadOrder).toBeLessThan(switchLoadOrder ?? 0)

    // No model can be ejected while the new one is still loading.
    expect(
      screen.queryByRole('button', { name: 'Unload model' }),
    ).not.toBeInTheDocument()
    expect(
      await screen.findByRole('status', { name: 'Loading' }),
    ).toBeInTheDocument()

    act(() => {
      resolveSwitchLoad()
    })

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Unload model' }),
      ).toBeInTheDocument()
    })
  })

  it('unloads the loaded model and clears the selection when unloaded', async () => {
    mock = installMockElectronApi({
      models: ['alpha.gguf'],
      selectedModel: 'alpha.gguf',
    })
    const user = userEvent.setup()

    renderModal()

    const unloadButton = await screen.findByRole('button', {
      name: 'Unload model',
    })
    await user.click(unloadButton)

    await waitFor(() => {
      expect(mock.unloadModel).toHaveBeenCalledTimes(1)
    })
    expect(mock.setSelectedModel).toHaveBeenCalledWith(null)
    expect(
      screen.queryByRole('button', { name: 'Unload model' }),
    ).not.toBeInTheDocument()

    const row = await screen.findByRole('button', { name: 'alpha' })
    expect(row.classList.contains('bg-neutral-300')).toBe(false)
  })
})

describe('ModelsModal search', () => {
  const getSearchBox = () =>
    screen.getByRole('textbox', { name: 'Search models' })

  it('disables the search box when there are no models', async () => {
    mock = installMockElectronApi({ models: [], selectedModel: null })

    renderModal()

    expect(await screen.findByText(/No models found/i)).toBeInTheDocument()
    expect(getSearchBox()).toBeDisabled()
  })

  it('filters the model list by the query', async () => {
    mock = installMockElectronApi({
      models: ['alpha.gguf', 'beta.gguf'],
      selectedModel: null,
    })
    const user = userEvent.setup()

    renderModal()

    await user.type(await screen.findByRole('textbox'), 'alph')

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'beta' }),
      ).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'alpha' })).toBeInTheDocument()
  })

  it('shows a no-match message when nothing matches', async () => {
    mock = installMockElectronApi({
      models: ['alpha.gguf'],
      selectedModel: null,
    })
    const user = userEvent.setup()

    renderModal()

    await user.type(await screen.findByRole('textbox'), 'zzz')

    expect(await screen.findByText(/No models match/i)).toBeInTheDocument()
  })

  it('focuses the search box when the user starts typing', async () => {
    mock = installMockElectronApi({
      models: ['alpha.gguf'],
      selectedModel: null,
    })
    const user = userEvent.setup()

    renderModal()

    await screen.findByRole('button', { name: 'alpha' })
    const search = getSearchBox()
    expect(search).not.toHaveFocus()

    await user.keyboard('a')

    expect(search).toHaveFocus()
  })

  it('debounces the filter so it applies only after the user pauses', async () => {
    expect(SEARCH_DEBOUNCE_MS).toBeGreaterThan(0)

    mock = installMockElectronApi({
      models: ['alpha.gguf', 'beta.gguf'],
      selectedModel: null,
    })

    renderModal()

    await screen.findByRole('button', { name: 'beta' })

    fireEvent.change(getSearchBox(), { target: { value: 'alpha' } })

    // Immediately after the change the debounce timer is still pending, so the
    // non-matching model has not been filtered out yet.
    expect(screen.getByRole('button', { name: 'beta' })).toBeInTheDocument()

    // Once the debounce window elapses, the filter is applied.
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'beta' }),
      ).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'alpha' })).toBeInTheDocument()
  })
})
