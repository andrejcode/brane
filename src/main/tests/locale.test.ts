import { IpcChannels } from '@shared/types'
import {
  appLocales,
  createElectronMock,
  getIpcHandler,
  resetElectronMock,
} from '@test/main/electron'
import { createStoreMock, resetStoreMock, storeValues } from '@test/main/store'
import { initializeLocale, registerLocaleHandlers } from '../locale'

vi.mock('electron', () => createElectronMock({ includeApp: true }))

vi.mock('../store', () => createStoreMock())

vi.mock('../logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn() },
}))

beforeEach(() => {
  resetStoreMock()
  resetElectronMock()
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

  it('falls back to the system locale when preferred languages are unsupported', () => {
    appLocales.preferred = ['fr-FR', 'es-ES']
    appLocales.current = 'de-DE'

    initializeLocale()

    expect(storeValues.get('locale')).toBe('de')
  })

  it('falls back to English when no preferred or system language is supported', () => {
    appLocales.preferred = ['fr-FR', 'es-ES']
    appLocales.current = 'fr-FR'

    initializeLocale()

    expect(storeValues.get('locale')).toBe('en')
  })

  it('re-detects when the stored locale is invalid', () => {
    storeValues.set('locale', 'xx')
    appLocales.preferred = ['hr-HR']

    initializeLocale()

    expect(storeValues.get('locale')).toBe('hr')
  })
})

describe('registerLocaleHandlers', () => {
  function getHandler(channel: string) {
    registerLocaleHandlers()
    return getIpcHandler(channel)
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
