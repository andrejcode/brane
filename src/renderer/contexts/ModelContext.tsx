import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAlert } from './AlertContext'
import { useTranslation } from './LocaleContext'

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
  const { t } = useTranslation()
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [loadingModel, setLoadingModel] = useState<string | null>(null)
  const [loadedModel, setLoadedModel] = useState<string | null>(null)

  // Bumped whenever a load is cancelled or superseded, so a stale in-flight load
  // can't clobber newer UI state when it finally settles.
  const loadRequestRef = useRef(0)

  const refreshModels = useCallback(async () => {
    const state = await window.electronApi.getModelState()
    setModels(state.models)
    setSelectedModel(state.selectedModel)
  }, [])

  const loadIntoMemory = useCallback(
    async (model: string, requestId: number) => {
      try {
        await window.electronApi.loadModel(model)
        if (loadRequestRef.current !== requestId) {
          return
        }
        setLoadedModel(model)
      } catch {
        // A cancel bumps the request id and settles its own state, so ignore the
        // resulting rejection instead of surfacing it as a load failure.
        if (loadRequestRef.current !== requestId) {
          return
        }
        setLoadedModel(null)
        showAlert(t('models.loadFailed'), 'error')
      } finally {
        if (loadRequestRef.current === requestId) {
          setLoadingModel(null)
        }
      }
    },
    [showAlert, t],
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
          const requestId = ++loadRequestRef.current
          setLoadingModel(state.selectedModel)
          void loadIntoMemory(state.selectedModel, requestId)
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
  }, [loadIntoMemory])

  // The main process watches the models directory and has already unloaded a
  // model whose file disappeared, so this only has to catch the UI up.
  useEffect(() => {
    return window.electronApi.onModelStateChange((state) => {
      setModels(state.models)
      setSelectedModel(state.selectedModel)

      if (state.selectedModel === null) {
        loadRequestRef.current++
        setLoadingModel(null)
        setLoadedModel(null)
      }
    })
  }, [])

  const selectModel = useCallback(
    async (model: string) => {
      if (loadingModel !== null || model === loadedModel) {
        return
      }

      const requestId = ++loadRequestRef.current
      const previousModel = loadedModel
      setLoadingModel(model)
      setLoadedModel(null)

      try {
        if (previousModel !== null) {
          await window.electronApi.unloadModel()
        }

        const saved = await window.electronApi.setSelectedModel(model)
        if (loadRequestRef.current !== requestId) {
          return
        }
        setSelectedModel(saved)

        if (saved !== null) {
          await loadIntoMemory(saved, requestId)
        } else {
          setLoadingModel(null)
        }
      } catch {
        if (loadRequestRef.current !== requestId) {
          return
        }
        setLoadingModel(null)
        setLoadedModel(null)
        showAlert(t('models.loadFailed'), 'error')
      }
    },
    [loadingModel, loadedModel, loadIntoMemory, showAlert, t],
  )

  // Serves both ejecting a loaded model and cancelling one that's still loading:
  // the main process aborts whatever is in flight and disposes the model.
  const unloadModel = useCallback(async () => {
    loadRequestRef.current++
    setLoadingModel(null)
    setLoadedModel(null)

    try {
      await window.electronApi.unloadModel()
      await window.electronApi.setSelectedModel(null)
      setSelectedModel(null)
    } catch {
      showAlert(t('models.unloadFailed'), 'error')
    }
  }, [showAlert, t])

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
