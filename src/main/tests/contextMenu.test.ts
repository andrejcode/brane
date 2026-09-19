import type { ContextMenuParams } from 'electron'
import { buildTextContextMenuTemplate } from '../contextMenu'

const EDIT_FLAGS = {
  canUndo: false,
  canRedo: false,
  canCut: false,
  canCopy: true,
  canPaste: false,
  canDelete: false,
  canSelectAll: false,
  canEditRichly: false,
}

function contextMenuParams(
  overrides: Partial<ContextMenuParams> = {},
): ContextMenuParams {
  return {
    selectionText: '',
    editFlags: { ...EDIT_FLAGS, canCopy: false },
    ...overrides,
  } as ContextMenuParams
}

describe('context menu', () => {
  const actions = {
    lookUpSelection: vi.fn(),
    searchWithGoogle: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds lookup and web search for selected text on macOS', () => {
    const template = buildTextContextMenuTemplate(
      contextMenuParams({
        selectionText: ' selected text ',
        editFlags: EDIT_FLAGS,
      }),
      { ...actions, platform: 'darwin' },
    )

    expect(template).toMatchObject([
      { label: 'Look Up' },
      { label: 'Search with Google' },
      { type: 'separator' },
      { role: 'copy' },
    ])

    template[0]?.click?.({} as never, undefined, {} as never)
    template[1]?.click?.({} as never, undefined, {} as never)

    expect(actions.lookUpSelection).toHaveBeenCalledOnce()
    expect(actions.searchWithGoogle).toHaveBeenCalledWith('selected text')
  })

  it('only offers native copy for selected read-only text outside macOS', () => {
    const template = buildTextContextMenuTemplate(
      contextMenuParams({
        selectionText: 'selected text',
        editFlags: EDIT_FLAGS,
      }),
      { ...actions, platform: 'win32' },
    )

    expect(template).toEqual([{ role: 'copy' }])
  })

  it('offers the available editing actions in editable fields', () => {
    expect(
      buildTextContextMenuTemplate(
        contextMenuParams({
          selectionText: 'text',
          editFlags: {
            ...EDIT_FLAGS,
            canCut: true,
            canPaste: true,
          },
        }),
        { ...actions, platform: 'win32' },
      ),
    ).toEqual([{ role: 'cut' }, { role: 'copy' }, { role: 'paste' }])
  })

  it('offers paste without requiring selected text', () => {
    expect(
      buildTextContextMenuTemplate(
        contextMenuParams({
          editFlags: { ...EDIT_FLAGS, canCopy: false, canPaste: true },
        }),
        { ...actions, platform: 'win32' },
      ),
    ).toEqual([{ role: 'paste' }])
  })

  it('does not open for ordinary right-clicks', () => {
    expect(buildTextContextMenuTemplate(contextMenuParams(), actions)).toEqual(
      [],
    )
  })
})
