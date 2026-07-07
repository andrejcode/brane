import Store from 'electron-store'
import type { Theme } from '@shared/types'

interface WindowSettings {
  width: number
  height: number
  x: number | null
  y: number | null
  isMaximized: boolean
}

interface StoreSchema {
  window: WindowSettings
  theme: Theme
  // Filename (e.g. "Qwen3-4B-Q5_K_M.gguf") of the last selected model, or null
  // when no model has been chosen yet.
  selectedModel: string | null
  // When true, Cmd/Ctrl+Enter sends a message and plain Enter inserts a newline.
  // When false (default), plain Enter sends.
  sendWithModifierEnter: boolean
}

const defaults: StoreSchema = {
  window: {
    width: 1200,
    height: 800,
    x: null,
    y: null,
    isMaximized: false,
  },
  theme: 'system',
  selectedModel: null,
  sendWithModifierEnter: false,
}

const store = new Store<StoreSchema>({
  name: 'settings',
  defaults,
})

export function getStoreValue<K extends keyof StoreSchema>(key: K) {
  return store.get(key)
}

export function setStoreValue<K extends keyof StoreSchema>(
  key: K,
  value: StoreSchema[K],
) {
  store.set(key, value)
}
