import {
  BrowserWindow,
  ipcMain,
  Menu,
  type MenuItemConstructorOptions,
} from 'electron'
import {
  DEFAULT_SHORTCUTS,
  IpcChannels,
  normalizeShortcuts,
  type ApplicationMenuAction,
  type ApplicationMenuChat,
  type ApplicationMenuState,
  type ShortcutBinding,
} from '@shared/types'

const MAX_RECENT_CHATS = 9

function toAccelerator(binding: ShortcutBinding) {
  const parts: string[] = []
  if (binding.mod) parts.push('CommandOrControl')
  if (binding.alt) parts.push('Alt')
  if (binding.shift) parts.push('Shift')

  const key = binding.key === '+' ? 'Plus' : binding.key
  parts.push(key.length === 1 ? key.toUpperCase() : key)
  return parts.join('+')
}

function normalizeChats(value: unknown): ApplicationMenuChat[] {
  if (!Array.isArray(value)) {
    return []
  }

  return (value as unknown[])
    .filter((chat): chat is ApplicationMenuChat => {
      if (!chat || typeof chat !== 'object') {
        return false
      }

      const candidate = chat as Record<string, unknown>
      return (
        typeof candidate['id'] === 'string' &&
        candidate['id'].length > 0 &&
        typeof candidate['title'] === 'string' &&
        candidate['title'].length > 0
      )
    })
    .slice(0, MAX_RECENT_CHATS)
}

export function normalizeApplicationMenuState(
  value: unknown,
): ApplicationMenuState {
  const source =
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

  return {
    shortcuts: normalizeShortcuts(source['shortcuts']),
    chats: normalizeChats(source['chats']),
  }
}

function sendAction(action: ApplicationMenuAction) {
  const window = BrowserWindow.getFocusedWindow()
  if (window && !window.isDestroyed()) {
    window.webContents.send(IpcChannels.applicationMenuAction, action)
  }
}

export function buildApplicationMenuTemplate({
  shortcuts,
  chats,
}: ApplicationMenuState): MenuItemConstructorOptions[] {
  const template: MenuItemConstructorOptions[] = []

  if (process.platform === 'darwin') {
    template.push({ role: 'appMenu' })
  }

  template.push(
    {
      label: 'File',
      submenu: [
        {
          label: 'New Chat',
          accelerator: toAccelerator(shortcuts.newChat),
          registerAccelerator: false,
          click: () => sendAction({ type: 'newChat' }),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: toAccelerator(shortcuts.toggleSidebar),
          registerAccelerator: false,
          click: () => sendAction({ type: 'toggleSidebar' }),
        },
        { type: 'separator' },
        {
          label: 'Increase Message Font Size',
          accelerator: 'CommandOrControl+Plus',
          registerAccelerator: false,
          click: () => sendAction({ type: 'increaseMessageFontSize' }),
        },
        {
          label: 'Decrease Message Font Size',
          accelerator: 'CommandOrControl+-',
          registerAccelerator: false,
          click: () => sendAction({ type: 'decreaseMessageFontSize' }),
        },
        {
          label: 'Reset Message Font Size',
          accelerator: 'CommandOrControl+0',
          registerAccelerator: false,
          click: () => sendAction({ type: 'resetMessageFontSize' }),
        },
      ],
    },
    {
      label: 'Chats',
      submenu:
        chats.length === 0
          ? [{ label: 'No Recent Chats', enabled: false }]
          : chats.map((chat, index) => ({
              label: `${index + 1}. ${chat.title.replaceAll('&', '&&')}`,
              accelerator: `CommandOrControl+${index + 1}`,
              click: () => sendAction({ type: 'openChat', chatId: chat.id }),
            })),
    },
  )

  return template
}

function applyApplicationMenu(state: ApplicationMenuState) {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate(buildApplicationMenuTemplate(state)),
  )
}

export function registerApplicationMenu() {
  applyApplicationMenu({ shortcuts: DEFAULT_SHORTCUTS, chats: [] })

  ipcMain.handle(
    IpcChannels.applicationMenuUpdate,
    (_event, value: unknown) => {
      applyApplicationMenu(normalizeApplicationMenuState(value))
    },
  )
}
