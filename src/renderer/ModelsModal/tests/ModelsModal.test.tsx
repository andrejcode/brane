import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ModelProvider } from '@/contexts/ModelContext'
import {
  clearMockElectronApi,
  installMockElectronApi,
  type MockElectronApi,
} from '@test/electronApi'
import { ModelsModal } from '..'

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

function renderModal(
  props: Partial<React.ComponentProps<typeof ModelsModal>> = {},
) {
  return render(
    <ModelProvider>
      <ModelsModal isOpen onClose={vi.fn()} {...props} />
    </ModelProvider>,
  )
}

describe('ModelsModal', () => {
  it('does not render its contents when closed', () => {
    mock = installMockElectronApi({ models: ['a.gguf'] })

    render(
      <ModelProvider>
        <ModelsModal isOpen={false} onClose={vi.fn()} />
      </ModelProvider>,
    )

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
      await screen.findByRole('button', { name: 'alpha.gguf' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'beta.gguf' }),
    ).toBeInTheDocument()
  })

  it('marks the selected model as active', async () => {
    mock = installMockElectronApi({
      models: ['alpha.gguf', 'beta.gguf'],
      selectedModel: 'beta.gguf',
    })

    renderModal()

    const selected = await screen.findByRole('button', { name: 'beta.gguf' })

    expect(selected.className).toContain('bg-neutral-300')
  })

  it('persists the selection and closes when a model is clicked', async () => {
    mock = installMockElectronApi({
      models: ['alpha.gguf', 'beta.gguf'],
      selectedModel: null,
    })
    const onClose = vi.fn()
    const user = userEvent.setup()

    renderModal({ onClose })

    await user.click(await screen.findByRole('button', { name: 'alpha.gguf' }))

    await waitFor(() => {
      expect(mock.setSelectedModel).toHaveBeenCalledWith('alpha.gguf')
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
