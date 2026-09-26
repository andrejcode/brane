import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import {
  createE2eWorkspace,
  initializeE2eDatabase,
  launchBrane,
  removeE2eWorkspace,
  seedChat,
} from './fixtures'

async function openSidebar(page: Page) {
  await page.getByRole('button', { name: 'Toggle sidebar' }).click()
  await expect(page.getByText('Recent chats')).toBeVisible()
}

test('persists the sidebar setting across a relaunch', async () => {
  const workspace = createE2eWorkspace('settings-persistence')
  let electronApp = await launchBrane(workspace)

  try {
    const firstPage = await electronApp.firstWindow()
    await openSidebar(firstPage)
    await expect(firstPage.getByText('No chats yet')).toBeVisible()
    await electronApp.close()

    electronApp = await launchBrane(workspace)
    const relaunchedPage = await electronApp.firstWindow()
    await expect(relaunchedPage.getByText('No chats yet')).toBeVisible()
  } finally {
    await electronApp.close()
    removeE2eWorkspace(workspace)
  }
})

test('loads persisted chat history after repeated relaunches', async () => {
  const workspace = createE2eWorkspace('history-persistence')
  await initializeE2eDatabase(workspace)
  seedChat(workspace, {
    id: 'history-chat',
    title: 'History fixture',
  })

  try {
    for (let launchNumber = 0; launchNumber < 2; launchNumber++) {
      const electronApp = await launchBrane(workspace)

      try {
        const page = await electronApp.firstWindow()
        await openSidebar(page)
        await page.getByText('History fixture', { exact: true }).click()
        await expect(page.getByText('Fixture user message')).toBeVisible()
        await expect(page.getByText('Fixture assistant response')).toBeVisible()
      } finally {
        await electronApp.close()
      }
    }
  } finally {
    removeE2eWorkspace(workspace)
  }
})

test('renames, searches, and permanently deletes a chat', async () => {
  const workspace = createE2eWorkspace('chat-management')
  await initializeE2eDatabase(workspace)
  seedChat(workspace, {
    id: 'managed-chat',
    title: 'Original fixture',
  })
  let electronApp = await launchBrane(workspace)

  try {
    const page = await electronApp.firstWindow()
    await openSidebar(page)

    await page
      .getByText('Original fixture', { exact: true })
      .click({ button: 'right' })
    await page.getByText('Rename', { exact: true }).click()
    const renameInput = page.getByRole('textbox', { name: 'Rename' })
    await renameInput.fill('Renamed fixture')
    await renameInput.press('Enter')
    await expect(
      page.getByText('Renamed fixture', { exact: true }),
    ).toBeVisible()

    const searchInput = page.getByRole('textbox', { name: 'Search chats' })
    await searchInput.fill('renamed')
    await expect(
      page.getByText('Renamed fixture', { exact: true }),
    ).toBeVisible()
    await searchInput.fill('missing')
    await expect(page.getByText('No chats match “missing”.')).toBeVisible()
    await searchInput.fill('')

    await page
      .getByText('Renamed fixture', { exact: true })
      .click({ button: 'right' })
    await page.getByText('Delete', { exact: true }).click()
    const dialog = page.getByRole('alertdialog', { name: 'Delete chat?' })
    await dialog.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('No chats yet')).toBeVisible()

    await electronApp.close()
    electronApp = await launchBrane(workspace)
    const relaunchedPage = await electronApp.firstWindow()
    await expect(relaunchedPage.getByText('No chats yet')).toBeVisible()
  } finally {
    await electronApp.close()
    removeE2eWorkspace(workspace)
  }
})
