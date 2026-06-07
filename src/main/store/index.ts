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
