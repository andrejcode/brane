import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { createE2eWorkspace, launchBrane, removeE2eWorkspace } from './fixtures'

test('updates model discovery when GGUF files change on disk', async () => {
  const workspace = createE2eWorkspace('model-discovery')
  const electronApp = await launchBrane(workspace)

  try {
    const page = await electronApp.firstWindow()
    await page.getByRole('button', { name: 'Select model' }).click()
    await expect(page.getByText(/No models found/)).toBeVisible()

    const modelPath = path.join(workspace.modelsDir, 'Watcher fixture.gguf')
    fs.writeFileSync(modelPath, 'fixture model bytes')
    await expect(
      page.getByRole('button', { name: 'Watcher fixture' }),
    ).toBeVisible()

    fs.rmSync(modelPath)
    await expect(page.getByText(/No models found/)).toBeVisible()
  } finally {
    await electronApp.close()
    removeE2eWorkspace(workspace)
  }
})
