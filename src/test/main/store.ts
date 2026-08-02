export const storeValues = new Map<string, unknown>()

export function createStoreMock() {
  return {
    getStoreValue: (key: string) => storeValues.get(key),
    setStoreValue: (key: string, value: unknown) => {
      storeValues.set(key, value)
    },
  }
}

export function resetStoreMock() {
  storeValues.clear()
}
