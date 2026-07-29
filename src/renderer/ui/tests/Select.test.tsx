import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Select } from '../Select'

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
] as const

describe('Select', () => {
  it('renders the current value and every option', () => {
    render(
      <Select
        ariaLabel="Choice"
        value="b"
        onChange={vi.fn()}
        options={OPTIONS}
      />,
    )

    expect(screen.getByRole('combobox', { name: 'Choice' })).toHaveValue('b')
    expect(screen.getByRole('option', { name: 'Alpha' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Beta' })).toBeInTheDocument()
  })

  it('does not fire onChange while disabled', async () => {
    const onChange = vi.fn()
    render(
      <Select
        ariaLabel="Choice"
        value="a"
        onChange={onChange}
        options={OPTIONS}
        disabled
      />,
    )

    expect(screen.getByRole('combobox', { name: 'Choice' })).toBeDisabled()
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Choice' }),
      'b',
    )

    expect(onChange).not.toHaveBeenCalled()
  })
})
