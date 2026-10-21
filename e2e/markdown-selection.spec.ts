import { expect, test } from '@playwright/test'
import {
  createE2eWorkspace,
  initializeE2eDatabase,
  launchBrane,
  removeE2eWorkspace,
  seedChat,
} from './fixtures'

test('copies selected KaTeX as TeX with surrounding prose', async () => {
  const workspace = createE2eWorkspace('math-selection')
  await initializeE2eDatabase(workspace)
  seedChat(workspace, {
    id: 'math-selection-chat',
    title: 'Math selection fixture',
    assistantMessage: 'Before $\\frac{a}{b}$ after.\n\n$$\nx^2 + y^2\n$$',
  })
  const electronApp = await launchBrane(workspace)

  try {
    const page = await electronApp.firstWindow()
    await page.getByRole('button', { name: 'Toggle sidebar' }).click()
    await page.getByText('Math selection fixture', { exact: true }).click()
    await expect(page.getByText('Before', { exact: false })).toBeVisible()

    const copied = await page.evaluate<string[]>(`(() => {
      const root = document.querySelector('.prose')
      const paragraph = root.querySelector('p')
      const inlineMath = paragraph.querySelector('.katex-html')
      const displayMath = root.querySelector('.katex-display')
      const selection = window.getSelection()
      return [paragraph, inlineMath, displayMath].map((element) => {
        const range = document.createRange()
        range.selectNodeContents(element)
        selection.removeAllRanges()
        selection.addRange(range)
        let text = ''
        document.addEventListener('copy', (event) => {
          text = event.clipboardData?.getData('text/plain') ?? ''
        }, { once: true })
        document.execCommand('copy')
        return text
      })
    })()`)

    expect(copied).toEqual([
      'Before $\\frac{a}{b}$ after.',
      '$\\frac{a}{b}$',
      '$$\nx^2 + y^2\n$$',
    ])
  } finally {
    await electronApp.close()
    removeE2eWorkspace(workspace)
  }
})
