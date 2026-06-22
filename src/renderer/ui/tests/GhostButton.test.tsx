import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GhostButton } from '../GhostButton'

describe('GhostButton', () => {
  it('renders its children', () => {
    render(<GhostButton>Settings</GhostButton>)

    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('uses ariaLabel as its accessible name', () => {
    render(<GhostButton ariaLabel="Open settings">icon</GhostButton>)

    expect(
      screen.getByRole('button', { name: 'Open settings' }),
    ).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<GhostButton onClick={onClick}>Settings</GhostButton>)

    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('opts out of the window drag region and merges extra classes', () => {
    render(
      <GhostButton className="px-2" ariaLabel="Select model">
        Select model
      </GhostButton>,
    )

    const button = screen.getByRole('button', { name: 'Select model' })

    expect(button.className).toContain('[app-region:no-drag]')
    expect(button.className).toContain('px-2')
  })

  it('applies the active background when isActive is set', () => {
    render(
      <GhostButton isActive ariaLabel="Active item">
        item
      </GhostButton>,
    )

    expect(
      screen.getByRole('button', { name: 'Active item' }).className,
    ).toContain('bg-neutral-300')
  })
})
