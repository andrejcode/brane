import type { MenuItemConstructorOptions } from 'electron'
import {
  DEFAULT_SHORTCUTS,
  IpcChannels,
  type ApplicationMenuState,
} from '@shared/types'
import {
  buildApplicationMenuTemplate,
  normalizeApplicationMenuState,
} from '../applicationMenu'

const electronMock = vi.hoisted(() => ({
  send: vi.fn(),
  handle: vi.fn(),
  buildFromTemplate: vi.fn(),
  setApplicationMenu: vi.fn(),
}))

vi.mock('electron', () => ({
  BrowserWindow: {
    getFocusedWindow: () => ({
      isDestroyed: () => false,
      webContents: { send: electronMock.send },
    }),
  },
  ipcMain: { handle: electronMock.handle },
  Menu: {
    buildFromTemplate: electronMock.buildFromTemplate,
    setApplicationMenu: electronMock.setApplicationMenu,
  },
}))

function getSubmenu(
  template: MenuItemConstructorOptions[],
  label: string,
): MenuItemConstructorOptions[] {
  const submenu = template.find((item) => item.label === label)?.submenu
  if (!Array.isArray(submenu)) {
    throw new Error(`Missing ${label} submenu`)
  }
  return submenu
}

function menuState(
  overrides: Partial<ApplicationMenuState> = {},
): ApplicationMenuState {
  return { shortcuts: DEFAULT_SHORTCUTS, chats: [], ...overrides }
}

describe('application menu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows current shortcuts and standard editing commands', () => {
    const template = buildApplicationMenuTemplate(menuState())
    const file = getSubmenu(template, 'File')
    const edit = getSubmenu(template, 'Edit')
    const view = getSubmenu(template, 'View')

    expect(file[0]).toMatchObject({
      label: 'New Chat',
      accelerator: 'CommandOrControl+N',
      registerAccelerator: false,
    })
    expect(edit.map((item) => item.role).filter(Boolean)).toEqual([
      'undo',
      'redo',
      'cut',
      'copy',
      'paste',
      'selectAll',
    ])
    expect(view[0]).toMatchObject({
      label: 'Toggle Sidebar',
      accelerator: 'CommandOrControl+B',
      registerAccelerator: false,
    })
  })

  it('lists at most nine recent chats with numbered accelerators', () => {
    const chats = Array.from({ length: 12 }, (_, index) => ({
      id: `chat-${index + 1}`,
      title: `Chat ${index + 1}`,
    }))
    const state = normalizeApplicationMenuState({
      shortcuts: DEFAULT_SHORTCUTS,
      chats,
    })
    const recentChats = getSubmenu(buildApplicationMenuTemplate(state), 'Chats')

    expect(recentChats).toHaveLength(9)
    expect(recentChats[0]).toMatchObject({
      label: '1. Chat 1',
      accelerator: 'CommandOrControl+1',
    })
    expect(recentChats[8]).toMatchObject({
      label: '9. Chat 9',
      accelerator: 'CommandOrControl+9',
    })
  })

  it('dispatches the selected chat to the focused renderer', () => {
    const chats = getSubmenu(
      buildApplicationMenuTemplate(
        menuState({ chats: [{ id: 'chat-1', title: 'First chat' }] }),
      ),
      'Chats',
    )

    chats[0]?.click?.({} as never, undefined, {} as never)

    expect(electronMock.send).toHaveBeenCalledWith(
      IpcChannels.applicationMenuAction,
      { type: 'openChat', chatId: 'chat-1' },
    )
  })

  it('falls back to safe defaults for malformed menu state', () => {
    expect(normalizeApplicationMenuState(null)).toEqual({
      shortcuts: DEFAULT_SHORTCUTS,
      chats: [],
    })
    expect(
      normalizeApplicationMenuState({ chats: [{ id: '', title: 2 }] }).chats,
    ).toEqual([])
  })
})
