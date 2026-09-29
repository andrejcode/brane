import { IpcChannels } from '@shared/types'
import {
  createElectronMock,
  getIpcHandler,
  resetElectronMock,
  shellOpenExternal,
} from '@test/main/electron'
import { registerExternalLinkHandlers } from '../externalLinks'

vi.mock('electron', () => createElectronMock({ includeShell: true }))

vi.mock('../logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}))

beforeEach(() => {
  resetElectronMock()
  registerExternalLinkHandlers()
})

describe('registerExternalLinkHandlers', () => {
  it('opens HTTPS URLs in the default browser', async () => {
    const handler = getIpcHandler(IpcChannels.openExternal)

    await handler({}, 'https://example.com/docs')

    expect(shellOpenExternal).toHaveBeenCalledWith('https://example.com/docs')
  })

  it.each(['javascript:alert(1)', 'file:///tmp/private', 'not a URL'])(
    'rejects the unsafe URL %s',
    async (url) => {
      const handler = getIpcHandler(IpcChannels.openExternal)

      await expect(handler({}, url)).rejects.toThrow('cannot be opened')
      expect(shellOpenExternal).not.toHaveBeenCalled()
    },
  )
})
