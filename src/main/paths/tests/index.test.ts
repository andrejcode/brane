import os from 'node:os'
import path from 'node:path'
import { createElectronMock } from '@test/main/electron'
import { resolveDataDir } from '../index'

vi.mock('electron', () => createElectronMock())

describe('resolveDataDir', () => {
  it('uses an explicit override when provided', () => {
    expect(
      resolveDataDir({
        appPath: '/project',
        isPackaged: false,
        override: '/temporary/brane',
      }),
    ).toBe('/temporary/brane')
  })

  it('stores development data inside the project', () => {
    expect(
      resolveDataDir({
        appPath: '/project',
        isPackaged: false,
        override: undefined,
      }),
    ).toBe(path.join('/project', '.brane-dev'))
  })

  it('stores packaged application data in the Brane home directory', () => {
    expect(
      resolveDataDir({
        appPath: '/project',
        isPackaged: true,
        override: undefined,
      }),
    ).toBe(path.join(os.homedir(), '.brane'))
  })
})
