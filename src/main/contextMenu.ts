import {
  Menu,
  shell,
  type BrowserWindow,
  type ContextMenuParams,
  type MenuItemConstructorOptions,
} from 'electron'
import { logger } from './logger'

interface TextContextMenuOptions {
  platform?: NodeJS.Platform
  lookUpSelection: () => void
  searchWithGoogle: (selectionText: string) => void
}

export function buildTextContextMenuTemplate(
  {
    selectionText,
    editFlags,
  }: Pick<ContextMenuParams, 'selectionText' | 'editFlags'>,
  options: TextContextMenuOptions,
) {
  const template: MenuItemConstructorOptions[] = []
  const trimmedSelection = selectionText.trim()

  if (
    (options.platform ?? process.platform) === 'darwin' &&
    trimmedSelection.length > 0
  ) {
    template.push(
      { label: 'Look Up', click: options.lookUpSelection },
      {
        label: 'Search with Google',
        click: () => options.searchWithGoogle(trimmedSelection),
      },
    )

    if (editFlags.canCut || editFlags.canCopy || editFlags.canPaste) {
      template.push({ type: 'separator' })
    }
  }

  if (editFlags.canCut) {
    template.push({ role: 'cut' })
  }
  if (editFlags.canCopy) {
    template.push({ role: 'copy' })
  }
  if (editFlags.canPaste) {
    template.push({ role: 'paste' })
  }

  return template
}

export function registerContextMenu(window: BrowserWindow) {
  window.webContents.on('context-menu', (_event, params) => {
    const template = buildTextContextMenuTemplate(params, {
      lookUpSelection: () => window.webContents.showDefinitionForSelection(),
      searchWithGoogle: (selectionText) => {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(selectionText)}`

        void shell.openExternal(searchUrl).catch((error: unknown) => {
          logger.error('Failed to open selected text in Google', error)
        })
      },
    })

    if (template.length === 0) {
      return
    }

    Menu.buildFromTemplate(template).popup({ window })
  })
}
