import { render, screen, waitFor } from '@testing-library/react'
import { AlertProvider } from '@/contexts/AlertContext'
import { ModelProvider, useModel } from '@/contexts/ModelContext'
import { clearMockElectronApi, installMockElectronApi } from '@test/electronApi'

function ModelStatus() {
  const { selectedModel } = useModel()

  return <div>{selectedModel ?? 'No model selected'}</div>
}

afterEach(() => {
  clearMockElectronApi()
})

describe('ModelProvider startup loading', () => {
  it('restores the selection without loading it by default', async () => {
    const mock = installMockElectronApi({
      models: ['model.gguf'],
      selectedModel: 'model.gguf',
    })

    render(
      <AlertProvider>
        <ModelProvider>
          <ModelStatus />
        </ModelProvider>
      </AlertProvider>,
    )

    await screen.findByText('model.gguf')
    expect(mock.loadModel).not.toHaveBeenCalled()
  })

  it('loads the restored selection when the preference is enabled', async () => {
    const mock = installMockElectronApi({
      models: ['model.gguf'],
      selectedModel: 'model.gguf',
      loadModelOnStartup: true,
    })

    render(
      <AlertProvider>
        <ModelProvider>
          <ModelStatus />
        </ModelProvider>
      </AlertProvider>,
    )

    await waitFor(() => {
      expect(mock.loadModel).toHaveBeenCalledWith('model.gguf')
    })
  })
})
