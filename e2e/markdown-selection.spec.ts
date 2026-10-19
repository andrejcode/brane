import { expect, test } from '@playwright/test'
import {
  createE2eWorkspace,
  initializeE2eDatabase,
  launchBrane,
  removeE2eWorkspace,
  seedChat,
} from './fixtures'

test('copies a Markdown selection as semantic plain text', async () => {
  const workspace = createE2eWorkspace('markdown-selection')
  await initializeE2eDatabase(workspace)
  seedChat(workspace, {
    id: 'markdown-selection-chat',
    title: 'Markdown selection fixture',
    assistantMessage:
      '# Result\n\n```typescript\nconst answer: number = 42\n```\n\n$$\nx = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\n$$\n\n1. One\n2. Two\n3. Three\n4. Four\n5. Five',
    assistantReasoning: 'Hidden fixture reasoning',
  })
  const electronApp = await launchBrane(workspace)

  try {
    const page = await electronApp.firstWindow()
    await page.getByRole('button', { name: 'Toggle sidebar' }).click()
    await page.getByText('Markdown selection fixture', { exact: true }).click()

    await expect(page.getByText('typescript', { exact: true })).toBeVisible()
    const [nativeCodeSelection, copiedText, copiedList, copiedConversation] =
      await page.evaluate<[string, string, string, string]>(`(() => {
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
      const nativeCodeSelection = selection?.toString() ?? ''

      const markdown = languageLabel.closest('.prose')
      if (!markdown) throw new Error('Markdown container not found')

      range.selectNodeContents(markdown)
      selection?.removeAllRanges()
      selection?.addRange(range)

      let copiedText = ''
      document.addEventListener(
        'copy',
        (event) => {
          copiedText = event.clipboardData?.getData('text/plain') ?? ''
        },
        { once: true },
      )
      document.execCommand('copy')

      const list = markdown.querySelector('ol')
      const firstItemText = list?.firstElementChild?.firstChild
      const lastItemText = list?.lastElementChild?.firstChild
      if (!firstItemText || !lastItemText) {
        throw new Error('Ordered list boundaries not found')
      }

      range.setStart(firstItemText, 0)
      range.setEnd(lastItemText, lastItemText.textContent?.length ?? 0)
      selection?.removeAllRanges()
      selection?.addRange(range)

      let copiedList = ''
      document.addEventListener(
        'copy',
        (event) => {
          copiedList = event.clipboardData?.getData('text/plain') ?? ''
        },
        { once: true },
      )
      document.execCommand('copy')

      const userMessage = [...document.querySelectorAll('div')].find(
        (element) => element.textContent === 'Fixture user message',
      )
      const userText = userMessage?.firstChild
      const visualMath = markdown.querySelector('.katex-html')?.firstChild
      if (!userText || !visualMath) {
        throw new Error('Conversation selection boundaries not found')
      }

      range.setStart(userText, 0)
      range.setEnd(visualMath, 1)
      selection?.removeAllRanges()
      selection?.addRange(range)

      let copiedConversation = ''
      document.addEventListener(
        'copy',
        (event) => {
          copiedConversation = event.clipboardData?.getData('text/plain') ?? ''
        },
        { once: true },
      )
      document.execCommand('copy')

      return [
        nativeCodeSelection,
        copiedText,
        copiedList,
        copiedConversation,
      ]
    })()`)

    expect(nativeCodeSelection).toContain('const answer: number = 42')
    expect(nativeCodeSelection).not.toContain('typescript')
    expect(copiedText).toBe(
      'Result\n\nconst answer: number = 42\n\n$$\nx = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\n$$\n\n1. One\n2. Two\n3. Three\n4. Four\n5. Five',
    )
    expect(copiedList).toBe('1. One\n2. Two\n3. Three\n4. Four\n5. Five')
    expect(copiedConversation).toBe(
      'Fixture user message\n\nResult\n\nconst answer: number = 42\n\n$$\nx = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\n$$',
    )
  } finally {
    await electronApp.close()
    removeE2eWorkspace(workspace)
  }
})
