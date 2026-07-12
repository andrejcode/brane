import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IpcChannels } from '@shared/types'
import { initializeLocale, registerLocaleHandlers } from '../locale'

type IpcHandler = (...args: unknown[]) => unknown

const { storeValues, ipcHandlers, appLocales } = vi.hoisted(() => ({
  storeValues: new Map<string, unknown>(),
  ipcHandlers: new Map<string, IpcHandler>(),
  appLocales: { preferred: [] as string[], current: 'en-US' },
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: IpcHandler) => {
      ipcHandlers.set(channel, handler)
    },
  },
  app: {
    getPreferredSystemLanguages: () => appLocales.preferred,
    getLocale: () => appLocales.current,
  },
}))

vi.mock('../store', () => ({
  getStoreValue: (key: string) => storeValues.get(key),
  setStoreValue: (key: string, value: unknown) => {
    storeValues.set(key, value)
  },
}))

vi.mock('../logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn() },
}))

beforeEach(() => {
  storeValues.clear()
  ipcHandlers.clear()
  appLocales.preferred = []
  appLocales.current = 'en-US'
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('initializeLocale', () => {
  it('keeps a previously stored locale', () => {
    storeValues.set('locale', 'de')
    appLocales.preferred = ['hr-HR']

    initializeLocale()

    expect(storeValues.get('locale')).toBe('de')
  })

  it('adopts the first supported preferred system language', () => {
    appLocales.preferred = ['fr-FR', 'hr-HR', 'de-DE']

    initializeLocale()

    expect(storeValues.get('locale')).toBe('hr')
  })

  it('matches a script-tagged Serbian tag to sr', () => {
    appLocales.preferred = ['sr-Latn-RS']

    initializeLocale()

    expect(storeValues.get('locale')).toBe('sr')
  })

  it('falls back to English when no preferred language is supported', () => {
    appLocales.preferred = ['fr-FR', 'es-ES']
    appLocales.current = 'fr-FR'

    initializeLocale()

    expect(storeValues.get('locale')).toBe('en')
  })
})

describe('registerLocaleHandlers', () => {
  function getHandler(channel: string): IpcHandler {
    registerLocaleHandlers()
    const handler = ipcHandlers.get(channel)
    if (!handler) {
      throw new Error(`handler ${channel} was not registered`)
    }
    return handler
  }

  it('returns the stored locale', () => {
    storeValues.set('locale', 'hr')

    expect(getHandler(IpcChannels.getLocale)({})).toBe('hr')
  })

  it('defaults to English when nothing is stored', () => {
    expect(getHandler(IpcChannels.getLocale)({})).toBe('en')
  })

  it('persists and echoes a valid locale', () => {
    const handler = getHandler(IpcChannels.setLocale)

    expect(handler({}, 'sr')).toBe('sr')
    expect(storeValues.get('locale')).toBe('sr')
  })

  it('rejects an invalid locale and stores English', () => {
    const handler = getHandler(IpcChannels.setLocale)

    expect(handler({}, 'xx')).toBe('en')
    expect(storeValues.get('locale')).toBe('en')
  })
})
