import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '../Button'

describe('Button', () => {
  it('renders its children', () => {
    render(<Button type="button">Send</Button>)

    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
  })

  it('uses ariaLabel as its accessible name', () => {
    render(
      <Button type="button" ariaLabel="Send message">
        →
      </Button>,
    )

    expect(
      screen.getByRole('button', { name: 'Send message' }),
    ).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(
      <Button type="button" onClick={onClick}>
        Send
      </Button>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not fire onClick while disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button type="button" onClick={onClick} disabled>
        Send
      </Button>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(onClick).not.toHaveBeenCalled()
  })
})
