import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

interface ModelContextValue {
  models: string[]
  selectedModel: string | null
  isReady: boolean
  refreshModels: () => Promise<void>
  selectModel: (model: string) => Promise<void>
}

const ModelContext = createContext<ModelContextValue | null>(null)

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  const refreshModels = useCallback(async () => {
    const state = await window.electronApi.getModelState()
    setModels(state.models)
    setSelectedModel(state.selectedModel)
  }, [])

  useEffect(() => {
    let isMounted = true

    void window.electronApi
      .getModelState()
      .then((state) => {
        if (isMounted) {
          setModels(state.models)
          setSelectedModel(state.selectedModel)
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
  }, [])

  const selectModel = useCallback(async (model: string) => {
    const saved = await window.electronApi.setSelectedModel(model)
    setSelectedModel(saved)
  }, [])

  const value = useMemo(
    () => ({ models, selectedModel, isReady, refreshModels, selectModel }),
    [models, selectedModel, isReady, refreshModels, selectModel],
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
