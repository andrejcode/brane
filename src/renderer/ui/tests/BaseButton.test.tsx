import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BaseButton } from '../BaseButton'

describe('BaseButton', () => {
  it('renders its children', () => {
    render(<BaseButton type="button">Send</BaseButton>)

    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
  })

  it('uses ariaLabel as its accessible name', () => {
    render(
      <BaseButton type="button" ariaLabel="Send message">
        →
      </BaseButton>,
    )

    expect(
      screen.getByRole('button', { name: 'Send message' }),
    ).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(
      <BaseButton type="button" onClick={onClick}>
        Send
      </BaseButton>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not fire onClick while disabled', async () => {
    const onClick = vi.fn()
    render(
      <BaseButton type="button" onClick={onClick} disabled>
        Send
      </BaseButton>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(onClick).not.toHaveBeenCalled()
  })
})
