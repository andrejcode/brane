import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getErrorMessage } from '@shared/getErrorMessage'
import { useAlert } from './AlertContext'

interface ModelContextValue {
  models: string[]
  selectedModel: string | null
  isReady: boolean
  loadingModel: string | null
  loadedModel: string | null
  refreshModels: () => Promise<void>
  selectModel: (model: string) => Promise<void>
  unloadModel: () => Promise<void>
}

const ModelContext = createContext<ModelContextValue | null>(null)

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const { showAlert } = useAlert()
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [loadingModel, setLoadingModel] = useState<string | null>(null)
  const [loadedModel, setLoadedModel] = useState<string | null>(null)

  const refreshModels = useCallback(async () => {
    const state = await window.electronApi.getModelState()
    setModels(state.models)
    setSelectedModel(state.selectedModel)
  }, [])

  const loadModel = useCallback(
    async (model: string) => {
      setLoadingModel(model)

      try {
        await window.electronApi.loadModel()
        setLoadedModel(model)
      } catch (error) {
        setLoadedModel(null)
        showAlert(getErrorMessage(error), 'error')
      } finally {
        setLoadingModel(null)
      }
    },
    [showAlert],
  )

  useEffect(() => {
    let isMounted = true

    void window.electronApi
      .getModelState()
      .then((state) => {
        if (!isMounted) {
          return
        }

        setModels(state.models)
        setSelectedModel(state.selectedModel)

        // Load the persisted selection up front so the model is ready before
        // the first prompt instead of paying the cost on send.
        if (state.selectedModel !== null) {
          void loadModel(state.selectedModel)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsReady(true)
        }
      })

    return () => {
      isMounted = false
    }
  }, [loadModel])

  const selectModel = useCallback(
    async (model: string) => {
      if (loadingModel !== null || model === loadedModel) {
        return
      }

      const previousModel = loadedModel
      setLoadingModel(model)
      setLoadedModel(null)

      try {
        if (previousModel !== null) {
          await window.electronApi.unloadModel()
        }

        const saved = await window.electronApi.setSelectedModel(model)
        setSelectedModel(saved)

        if (saved !== null) {
          await window.electronApi.loadModel()
          setLoadedModel(saved)
        }
      } catch (error) {
        setLoadedModel(null)
        showAlert(getErrorMessage(error), 'error')
      } finally {
        setLoadingModel(null)
      }
    },
    [loadingModel, loadedModel, showAlert],
  )

  const unloadModel = useCallback(async () => {
    try {
      await window.electronApi.unloadModel()
      await window.electronApi.setSelectedModel(null)
      setLoadedModel(null)
      setSelectedModel(null)
    } catch (error) {
      showAlert(getErrorMessage(error), 'error')
    }
  }, [showAlert])

  const value = useMemo(
    () => ({
      models,
      selectedModel,
      isReady,
      loadingModel,
      loadedModel,
      refreshModels,
      selectModel,
      unloadModel,
    }),
    [
      models,
      selectedModel,
      isReady,
      loadingModel,
      loadedModel,
      refreshModels,
      selectModel,
      unloadModel,
    ],
  )

  return <ModelContext value={value}>{children}</ModelContext>
}

export function useModel() {
  const context = use(ModelContext)

  if (!context) {
    throw new Error('useModel must be used within a ModelProvider')
  }

  return context
}
