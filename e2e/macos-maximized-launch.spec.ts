import type { BrowserWindow } from 'electron'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect, test, _electron as electron } from '@playwright/test'

const ELECTRON_EXECUTABLE = path.resolve(
  'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron',
)
const APP_DIRECTORY = path.resolve('.')

interface NativeWindowState {
  isMaximized: boolean
  isVisible: boolean
}

async function launchAndVerify(userDataDir: string, requestQuit = false) {
  const electronApp = await electron.launch({
    executablePath: ELECTRON_EXECUTABLE,
    args: [APP_DIRECTORY, `--user-data-dir=${userDataDir}`],
    env: { ...process.env, BRANE_E2E: '1' },
  })
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
  test.skip(process.platform !== 'darwin', 'macOS-specific window regression')
  expect(fs.existsSync(ELECTRON_EXECUTABLE)).toBe(true)

  const userDataDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'brane-maximized-launch-'),
  )

  try {
    fs.writeFileSync(
      path.join(userDataDir, 'settings.json'),
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

    await launchAndVerify(userDataDir, true)
    await launchAndVerify(userDataDir)
  } finally {
    fs.rmSync(userDataDir, { force: true, recursive: true })
  }
})
