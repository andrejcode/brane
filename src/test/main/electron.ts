export type IpcHandler = (...args: unknown[]) => unknown

export const ipcHandlers = new Map<string, IpcHandler>()

export const appLocales = {
  preferred: [] as string[],
  current: 'en-US',
}

export const nativeThemeState = {
  themeSource: 'system' as string,
}

export const shellOpenExternal = vi.fn((): Promise<void> => Promise.resolve())

interface CreateElectronMockOptions {
  includeApp?: boolean
  includeNativeTheme?: boolean
  includeShell?: boolean
}

export function createElectronMock({
  includeApp = false,
  includeNativeTheme = false,
  includeShell = false,
}: CreateElectronMockOptions = {}) {
  return {
    ipcMain: {
      handle: (channel: string, handler: IpcHandler) => {
        ipcHandlers.set(channel, handler)
      },
    },
    ...(includeApp
      ? {
          app: {
            getPreferredSystemLanguages: () => appLocales.preferred,
            getLocale: () => appLocales.current,
          },
        }
      : {}),
    ...(includeNativeTheme
      ? {
          nativeTheme: {
            get themeSource() {
              return nativeThemeState.themeSource
            },
            set themeSource(value: string) {
              nativeThemeState.themeSource = value
            },
          },
        }
      : {}),
    ...(includeShell
      ? {
          shell: {
            openExternal: shellOpenExternal,
          },
        }
      : {}),
  }
}

export function getIpcHandler(channel: string): IpcHandler {
  const handler = ipcHandlers.get(channel)

  if (!handler) {
    throw new Error(`No handler registered for ${channel}`)
  }

  return handler
}

export function resetElectronMock() {
  ipcHandlers.clear()
  appLocales.preferred = []
  appLocales.current = 'en-US'
  nativeThemeState.themeSource = 'system'
  shellOpenExternal.mockReset()
  shellOpenExternal.mockResolvedValue()
}
