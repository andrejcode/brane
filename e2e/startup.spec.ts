import { expect, test } from '@playwright/test'
import {
  createE2eWorkspace,
  electronExecutableExists,
  launchBrane,
  removeE2eWorkspace,
} from './fixtures'

test('starts with a usable fresh profile', async () => {
  expect(electronExecutableExists()).toBe(true)
  const workspace = createE2eWorkspace('startup')
  const pageErrors: string[] = []
  const electronApp = await launchBrane(workspace)

  try {
    const page = await electronApp.firstWindow()
    page.on('pageerror', (error) => pageErrors.push(error.message))

    await expect(
      page.getByRole('button', { name: 'Select model' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Open settings' }),
    ).toBeVisible()
    await expect(
      page.getByRole('textbox', { name: 'Ask anything' }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Toggle sidebar' }).click()
    await expect(page.getByText('No chats yet')).toBeVisible()
    expect(pageErrors).toEqual([])
  } finally {
    await electronApp.close()
    removeE2eWorkspace(workspace)
  }
})
