import type { BrowserWindow } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import type { E2eWorkspace } from './fixtures'
import {
  createE2eWorkspace,
  electronExecutableExists,
  launchBrane,
  removeE2eWorkspace,
} from './fixtures'

interface NativeWindowState {
  isMaximized: boolean
  isVisible: boolean
}

async function launchAndVerify(workspace: E2eWorkspace, requestQuit = false) {
  const electronApp = await launchBrane(workspace)
  const electronProcess = electronApp.process()

  try {
    const page = await electronApp.firstWindow()
    await expect(
      page.getByRole('button', { name: 'Select model' }),
    ).toBeVisible()

    const browserWindow = await electronApp.browserWindow(page)
    await expect
      .poll(() =>
        browserWindow.evaluate(
          (window: BrowserWindow): NativeWindowState => ({
            isMaximized: window.isMaximized(),
            isVisible: window.isVisible(),
          }),
        ),
      )
      .toEqual({ isMaximized: true, isVisible: true })

    if (requestQuit) {
      const exitCode = new Promise<number | null>((resolve) => {
        electronProcess.once('exit', resolve)
      })

      await electronApp.evaluate(({ app }) => app.quit())
      await expect(exitCode).resolves.toBe(0)
    }
  } finally {
    if (electronProcess.exitCode === null) {
      await electronApp.close()
    }
  }
}

test('quits fully and shows a maximized window on relaunch', async () => {
  expect(electronExecutableExists()).toBe(true)
  const workspace = createE2eWorkspace('maximized-launch')

  try {
    fs.writeFileSync(
      path.join(workspace.userDataDir, 'settings.json'),
      JSON.stringify({
        window: {
          width: 1200,
          height: 800,
          x: null,
          y: null,
          isMaximized: true,
        },
      }),
    )

    await launchAndVerify(workspace, true)
    await launchAndVerify(workspace)
  } finally {
    removeE2eWorkspace(workspace)
  }
})
