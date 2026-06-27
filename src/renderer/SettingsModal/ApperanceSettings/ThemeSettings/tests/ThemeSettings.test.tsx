import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest'
import {
  clearMockElectronApi,
  installMockElectronApi,
  type MockElectronApi,
} from '@test/electronApi'
import { ThemeSettings } from '..'

let mock: MockElectronApi

afterEach(() => {
  clearMockElectronApi()
})

const ACTIVE_CLASS = 'bg-neutral-800'

function getThemeButton(name: 'Dark' | 'Light' | 'System') {
  return screen.getByRole('button', { name })
}

describe('ThemeSettings initial state', () => {
  it('marks the stored theme as active on mount', async () => {
    mock = installMockElectronApi({ theme: 'dark' })
    render(<ThemeSettings />)

    await waitFor(() => {
      expect(getThemeButton('Dark')).toHaveClass(ACTIVE_CLASS)
    })
    expect(getThemeButton('Light')).not.toHaveClass(ACTIVE_CLASS)
    expect(getThemeButton('System')).not.toHaveClass(ACTIVE_CLASS)
  })

  it('requests the current theme exactly once', async () => {
    mock = installMockElectronApi({ theme: 'light' })
    render(<ThemeSettings />)

    await waitFor(() => {
      expect(mock.getTheme).toHaveBeenCalledTimes(1)
    })
  })

  it('falls back to system when fetching the theme fails', async () => {
    mock = installMockElectronApi({ theme: 'dark' })
    ;(mock.getTheme as Mock).mockRejectedValueOnce(new Error('no store'))
    render(<ThemeSettings />)

    await waitFor(() => {
      expect(getThemeButton('System')).toHaveClass(ACTIVE_CLASS)
    })
  })
})

describe('ThemeSettings selection', () => {
  beforeEach(() => {
    mock = installMockElectronApi({ theme: 'system' })
  })

  it('persists the chosen theme and updates the active button', async () => {
    const user = userEvent.setup()
    render(<ThemeSettings />)

    await waitFor(() => {
      expect(getThemeButton('System')).toHaveClass(ACTIVE_CLASS)
    })

    await user.click(getThemeButton('Dark'))

    expect(mock.setTheme).toHaveBeenCalledWith('dark')
    await waitFor(() => {
      expect(getThemeButton('Dark')).toHaveClass(ACTIVE_CLASS)
    })
    expect(getThemeButton('System')).not.toHaveClass(ACTIVE_CLASS)
  })

  it('can switch between each theme option', async () => {
    const user = userEvent.setup()
    render(<ThemeSettings />)

    await user.click(getThemeButton('Light'))
    expect(mock.setTheme).toHaveBeenLastCalledWith('light')

    await user.click(getThemeButton('Dark'))
    expect(mock.setTheme).toHaveBeenLastCalledWith('dark')

    await user.click(getThemeButton('System'))
    expect(mock.setTheme).toHaveBeenLastCalledWith('system')
  })
})
