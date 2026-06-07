import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ThemeButton } from '../ThemeButton'

describe('ThemeButton', () => {
  it('calls onClick when pressed', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <ThemeButton active={false} onClick={onClick}>
        Dark
      </ThemeButton>,
    )

    await user.click(screen.getByRole('button', { name: 'Dark' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('uses the active styling when active', () => {
    render(
      <ThemeButton active onClick={vi.fn()}>
        Dark
      </ThemeButton>,
    )

    expect(screen.getByRole('button', { name: 'Dark' })).toHaveClass(
      'bg-neutral-800',
    )
  })

  it('uses the inactive styling when not active', () => {
    render(
      <ThemeButton active={false} onClick={vi.fn()}>
        Dark
      </ThemeButton>,
    )

    expect(screen.getByRole('button', { name: 'Dark' })).not.toHaveClass(
      'bg-neutral-800',
    )
  })

  it('drops the divider border on the last button', () => {
    render(
      <ThemeButton active={false} onClick={vi.fn()} isLast>
        System
      </ThemeButton>,
    )

    expect(screen.getByRole('button', { name: 'System' })).not.toHaveClass(
      'border-r',
    )
  })
})
