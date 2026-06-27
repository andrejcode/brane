import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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
    <ModalProvider>
      <ModelProvider>
        {open && <OpenOnMount modal="models" />}
        <ModelsModal />
      </ModelProvider>
    </ModalProvider>,
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

  it('persists the selection and closes when a model is clicked', async () => {
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
    expect(
      screen.queryByRole('heading', { name: 'Models' }),
    ).not.toBeInTheDocument()
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
