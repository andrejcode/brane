export type IpcHandler = (...args: unknown[]) => unknown

export const ipcHandlers = new Map<string, IpcHandler>()

export const appLocales = {
  preferred: [] as string[],
  current: 'en-US',
}

export const nativeThemeState = {
  themeSource: 'system' as string,
}

interface CreateElectronMockOptions {
  includeApp?: boolean
  includeNativeTheme?: boolean
}

export function createElectronMock({
  includeApp = false,
  includeNativeTheme = false,
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
}
