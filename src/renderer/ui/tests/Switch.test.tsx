import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Switch } from '../Switch'

describe('Switch', () => {
  it('exposes its checked state through the switch role', () => {
    render(<Switch checked ariaLabel="Toggle" onChange={vi.fn()} />)

    expect(screen.getByRole('switch', { name: 'Toggle' })).toBeChecked()
  })

  it('reports an unchecked state', () => {
    render(<Switch checked={false} ariaLabel="Toggle" onChange={vi.fn()} />)

    expect(screen.getByRole('switch', { name: 'Toggle' })).not.toBeChecked()
  })

  it('calls onChange with the toggled value when clicked', async () => {
    const onChange = vi.fn()
    render(<Switch checked={false} ariaLabel="Toggle" onChange={onChange} />)

    await userEvent.click(screen.getByRole('switch', { name: 'Toggle' }))

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('toggles from checked to unchecked', async () => {
    const onChange = vi.fn()
    render(<Switch checked ariaLabel="Toggle" onChange={onChange} />)

    await userEvent.click(screen.getByRole('switch', { name: 'Toggle' }))

    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('does not call onChange while disabled', async () => {
    const onChange = vi.fn()
    render(
      <Switch
        checked={false}
        ariaLabel="Toggle"
        onChange={onChange}
        disabled
      />,
    )

    await userEvent.click(screen.getByRole('switch', { name: 'Toggle' }))

    expect(onChange).not.toHaveBeenCalled()
  })
})
