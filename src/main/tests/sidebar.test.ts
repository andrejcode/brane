import { IpcChannels } from '@shared/types'
import {
  createElectronMock,
  getIpcHandler,
  resetElectronMock,
} from '@test/main/electron'
import { createStoreMock, resetStoreMock, storeValues } from '@test/main/store'
import { registerSidebarHandlers } from '../sidebar'

vi.mock('electron', () => createElectronMock())

vi.mock('../store', () => createStoreMock())

beforeEach(() => {
  resetStoreMock()
  resetElectronMock()
})

describe('registerSidebarHandlers', () => {
  function getHandler(channel: string) {
    registerSidebarHandlers()
    return getIpcHandler(channel)
  }

  it('returns the stored open state', () => {
    storeValues.set('isSidebarOpen', true)

    expect(getHandler(IpcChannels.getSidebarOpen)({})).toBe(true)
  })

  it('persists the open state', () => {
    const handler = getHandler(IpcChannels.setSidebarOpen)

    expect(handler({}, true)).toBe(true)
    expect(storeValues.get('isSidebarOpen')).toBe(true)
  })

  it('treats anything but true as closed', () => {
    storeValues.set('isSidebarOpen', true)
    const handler = getHandler(IpcChannels.setSidebarOpen)

    expect(handler({}, 'yes')).toBe(false)
    expect(storeValues.get('isSidebarOpen')).toBe(false)
  })
})
