import { render, screen, waitFor } from '@testing-library/react'
import { AlertProvider } from '@/contexts/AlertContext'
import { ModelProvider, useModel } from '@/contexts/ModelContext'
import { clearMockElectronApi, installMockElectronApi } from '@test/electronApi'

function ModelStatus() {
  const { selectedModel } = useModel()

  return <div>{selectedModel ?? 'No model selected'}</div>
}

function ModelLifecycleStatus() {
  const { isModelLoading, modelBeingLoaded, modelInMemory, selectModel } =
    useModel()

  return (
    <>
      <button type="button" onClick={() => void selectModel('model.gguf')}>
        Load model
      </button>
      <div>{isModelLoading ? 'Loading' : 'Idle'}</div>
      <div>{modelBeingLoaded ?? 'No model being loaded'}</div>
      <div>{modelInMemory ?? 'No model in memory'}</div>
    </>
  )
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

describe('ModelProvider loading state', () => {
  it('exposes the model loading lifecycle', async () => {
    const mock = installMockElectronApi({ models: ['model.gguf'] })
    let resolveLoad: () => void = () => {}
    mock.loadModel.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveLoad = resolve
      }),
    )

    render(
      <AlertProvider>
        <ModelProvider>
          <ModelLifecycleStatus />
        </ModelProvider>
      </AlertProvider>,
    )

    screen.getByRole('button', { name: 'Load model' }).click()

    expect(await screen.findByText('Loading')).toBeInTheDocument()
    expect(screen.getByText('model.gguf')).toBeInTheDocument()
    expect(screen.getByText('No model in memory')).toBeInTheDocument()

    resolveLoad()

    expect(await screen.findByText('Idle')).toBeInTheDocument()
    expect(screen.getByText('No model being loaded')).toBeInTheDocument()
    expect(screen.getByText('model.gguf')).toBeInTheDocument()
  })
})
