import { expect, test } from '@playwright/test'
import {
  createE2eWorkspace,
  initializeE2eDatabase,
  launchBrane,
  removeE2eWorkspace,
  seedChat,
} from './fixtures'

test('excludes code block controls from selected text', async () => {
  const workspace = createE2eWorkspace('markdown-selection')
  await initializeE2eDatabase(workspace)
  seedChat(workspace, {
    id: 'markdown-selection-chat',
    title: 'Markdown selection fixture',
    assistantMessage: '```typescript\nconst answer: number = 42\n```',
  })
  const electronApp = await launchBrane(workspace)

  try {
    const page = await electronApp.firstWindow()
    await page.getByRole('button', { name: 'Toggle sidebar' }).click()
    await page.getByText('Markdown selection fixture', { exact: true }).click()

    await expect(page.getByText('typescript', { exact: true })).toBeVisible()
    const selectedText = await page.evaluate<string>(`(() => {
      const languageLabel = [...document.querySelectorAll('span')].find(
        (element) => element.textContent === 'typescript',
      )
      const codeBlock = languageLabel?.parentElement?.parentElement
      if (!codeBlock) throw new Error('Code block container not found')

      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(codeBlock)
      selection?.removeAllRanges()
      selection?.addRange(range)

      return selection?.toString() ?? ''
    })()`)

    expect(selectedText).toContain('const answer: number = 42')
    expect(selectedText).not.toContain('typescript')
  } finally {
    await electronApp.close()
    removeE2eWorkspace(workspace)
  }
})
