import { IpcChannels } from '@shared/types'
import {
  createElectronMock,
  getIpcHandler,
  nativeThemeState,
  resetElectronMock,
} from '@test/main/electron'
import { createStoreMock, resetStoreMock, storeValues } from '@test/main/store'
import { initializeTheme, registerAppearanceHandlers } from '../appearance'

vi.mock('electron', () => createElectronMock({ includeNativeTheme: true }))

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

describe('initializeTheme', () => {
  it('applies a previously stored theme', () => {
    storeValues.set('theme', 'dark')

    initializeTheme()

    expect(nativeThemeState.themeSource).toBe('dark')
    expect(storeValues.get('theme')).toBe('dark')
  })

  it('defaults to system when nothing valid is stored', () => {
    storeValues.set('theme', 'neon')

    initializeTheme()

    expect(nativeThemeState.themeSource).toBe('system')
    expect(storeValues.get('theme')).toBe('system')
  })
})

describe('registerAppearanceHandlers', () => {
  function getHandler(channel: string) {
    registerAppearanceHandlers()
    return getIpcHandler(channel)
  }

  it('returns the stored theme', () => {
    storeValues.set('theme', 'light')

    expect(getHandler(IpcChannels.getTheme)({})).toBe('light')
  })

  it('persists a valid theme and updates nativeTheme', () => {
    const handler = getHandler(IpcChannels.setTheme)

    handler({}, 'dark')

    expect(storeValues.get('theme')).toBe('dark')
    expect(nativeThemeState.themeSource).toBe('dark')
  })

  it('rejects an invalid theme and falls back to system', () => {
    storeValues.set('theme', 'light')
    const handler = getHandler(IpcChannels.setTheme)

    handler({}, 'neon')

    expect(storeValues.get('theme')).toBe('system')
    expect(nativeThemeState.themeSource).toBe('system')
  })

  it('clamps the message font size to the supported range', () => {
    const handler = getHandler(IpcChannels.setMessageFontSize)

    expect(handler({}, 8)).toBe(12)
    expect(storeValues.get('messageFontSize')).toBe(12)

    expect(handler({}, 32)).toBe(24)
    expect(storeValues.get('messageFontSize')).toBe(24)
  })

  it('defaults an invalid pointer cursor preference to disabled', () => {
    storeValues.set('showPointerCursor', 'yes')

    expect(getHandler(IpcChannels.getShowPointerCursor)({})).toBe(false)
    expect(storeValues.get('showPointerCursor')).toBe(false)
  })

  it('persists the pointer cursor preference', () => {
    const handler = getHandler(IpcChannels.setShowPointerCursor)

    expect(handler({}, true)).toBe(true)
    expect(storeValues.get('showPointerCursor')).toBe(true)
  })

  it('rejects an invalid pointer cursor preference', () => {
    const handler = getHandler(IpcChannels.setShowPointerCursor)

    expect(() => handler({}, 'yes')).toThrow(
      'Unable to save the pointer cursor preference.',
    )
    expect(storeValues.has('showPointerCursor')).toBe(false)
  })
})
