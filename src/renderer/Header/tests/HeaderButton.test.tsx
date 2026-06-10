import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HeaderButton } from '../HeaderButton'

describe('HeaderButton', () => {
  it('renders its children', () => {
    render(<HeaderButton>Settings</HeaderButton>)

    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('uses ariaLabel as its accessible name', () => {
    render(<HeaderButton ariaLabel="Open settings">icon</HeaderButton>)

    expect(
      screen.getByRole('button', { name: 'Open settings' }),
    ).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<HeaderButton onClick={onClick}>Settings</HeaderButton>)

    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('opts out of the window drag region and merges extra classes', () => {
    render(
      <HeaderButton className="px-2" ariaLabel="Select model">
        Select model
      </HeaderButton>,
    )

    const button = screen.getByRole('button', { name: 'Select model' })

    expect(button.className).toContain('[app-region:no-drag]')
    expect(button.className).toContain('px-2')
  })
})
