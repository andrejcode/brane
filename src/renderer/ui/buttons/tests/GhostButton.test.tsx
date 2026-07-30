import { render, screen } from '@testing-library/react'
import { GhostButton } from '../GhostButton'

describe('GhostButton', () => {
  it('uses ariaLabel as its accessible name', () => {
    render(<GhostButton ariaLabel="Open settings">icon</GhostButton>)

    expect(
      screen.getByRole('button', { name: 'Open settings' }),
    ).toBeInTheDocument()
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
