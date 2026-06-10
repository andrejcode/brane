import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Header } from '@/Header'
import {
  clearMockElectronApi,
  installMockElectronApi,
  type MockElectronApi,
} from '@test/electronApi'

let mock: MockElectronApi

afterEach(() => {
  clearMockElectronApi()
})

describe('Header on non-mac', () => {
  beforeEach(() => {
    mock = installMockElectronApi({ isMac: false })
  })

  it('renders the toolbar buttons', () => {
    render(<Header openSettingsModal={vi.fn()} />)

    expect(
      screen.getByRole('button', { name: 'Toggle sidebar' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Select model' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Open settings' }),
    ).toBeInTheDocument()
  })

  it('does not query fullscreen state', () => {
    render(<Header openSettingsModal={vi.fn()} />)

    expect(mock.getIsFullScreen).not.toHaveBeenCalled()
  })

  it('uses the compact left margin', () => {
    const { container } = render(<Header openSettingsModal={vi.fn()} />)

    expect(container.querySelector('.z-10')?.className).toContain('ml-4')
  })

  it('opens settings when the settings button is clicked', async () => {
    const user = userEvent.setup()
    const openSettingsModal = vi.fn()
    render(<Header openSettingsModal={openSettingsModal} />)

    await user.click(screen.getByRole('button', { name: 'Open settings' }))

    expect(openSettingsModal).toHaveBeenCalledTimes(1)
  })
})

describe('Header on mac', () => {
  beforeEach(() => {
    mock = installMockElectronApi({ isMac: true, isFullScreen: false })
  })

  it('queries fullscreen state and reserves room for the traffic lights', async () => {
    const { container } = render(<Header openSettingsModal={vi.fn()} />)

    await waitFor(() => {
      expect(mock.getIsFullScreen).toHaveBeenCalledTimes(1)
    })
    expect(container.querySelector('.z-10')?.className).toContain('ml-24')
  })

  it('drops the traffic-light margin when entering fullscreen', async () => {
    const { container } = render(<Header openSettingsModal={vi.fn()} />)

    await waitFor(() => {
      expect(mock.onFullScreenChange).toHaveBeenCalled()
    })

    act(() => {
      mock.emitFullScreenChange(true)
    })

    expect(container.querySelector('.z-10')?.className).toContain('ml-4')
  })

  it('unsubscribes from fullscreen changes on unmount', async () => {
    const { unmount } = render(<Header openSettingsModal={vi.fn()} />)

    await waitFor(() => {
      expect(mock.onFullScreenChange).toHaveBeenCalled()
    })

    unmount()

    expect(mock.fullScreenUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
