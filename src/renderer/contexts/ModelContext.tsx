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
  refreshModels: () => Promise<void>
  selectModel: (model: string) => Promise<void>
}

const ModelContext = createContext<ModelContextValue | null>(null)

// Reads the available models and the persisted selection (which the main
// process validates against disk) in a single round-trip.
async function fetchModelState() {
  const [models, selectedModel] = await Promise.all([
    window.electronApi.listModels(),
    window.electronApi.getSelectedModel(),
  ])

  return { models, selectedModel }
}

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string | null>(null)

  const refreshModels = useCallback(async () => {
    const state = await fetchModelState()
    setModels(state.models)
    setSelectedModel(state.selectedModel)
  }, [])

  useEffect(() => {
    let isMounted = true

    void fetchModelState().then((state) => {
      if (isMounted) {
        setModels(state.models)
        setSelectedModel(state.selectedModel)
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
    () => ({ models, selectedModel, refreshModels, selectModel }),
    [models, selectedModel, refreshModels, selectModel],
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
