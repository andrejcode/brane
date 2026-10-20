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

test('keeps one visible backdrop when confirming chat deletion from settings', async () => {
  const workspace = createE2eWorkspace('modal-backdrop')
  const electronApp = await launchBrane(workspace)

  try {
    const page = await electronApp.firstWindow()
    await page.getByRole('button', { name: 'Open settings' }).click()

    const settings = page.getByRole('dialog')
    const settingsBackdrop = settings
      .locator('..')
      .locator('[data-modal-backdrop]')
    const visibleBackdrops = page.locator('[data-modal-backdrop]:visible')

    await expect(settingsBackdrop).toBeVisible()
    await expect(visibleBackdrops).toHaveCount(1)

    await settings.getByRole('button', { name: 'Delete all chats' }).click()

    const confirmation = page.getByRole('alertdialog', {
      name: 'Delete all chats?',
    })
    await expect(confirmation).toBeVisible()
    await expect(settings).toBeVisible()
    await expect(settingsBackdrop).toBeHidden()
    await expect(visibleBackdrops).toHaveCount(1)
    await expect(
      confirmation.locator('..').locator('[data-modal-backdrop]'),
    ).toBeVisible()

    await confirmation.getByRole('button', { name: 'Cancel' }).click()

    await expect(confirmation).not.toBeVisible()
    await expect(settings).toBeVisible()
    await expect(settingsBackdrop).toBeVisible()
    await expect(visibleBackdrops).toHaveCount(1)

    await page.keyboard.press('Escape')
    await expect(settings).not.toBeVisible()
    await expect(visibleBackdrops).toHaveCount(0)
  } finally {
    await electronApp.close()
    removeE2eWorkspace(workspace)
  }
})
