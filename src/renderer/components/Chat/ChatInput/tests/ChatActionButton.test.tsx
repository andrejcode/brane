import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChatActionButton } from '../ChatActionButton'

describe('ChatActionButton', () => {
  it('renders its children', () => {
    render(
      <ChatActionButton type="submit" ariaLabel="Send message">
        icon
      </ChatActionButton>,
    )

    expect(
      screen.getByRole('button', { name: 'Send message' }),
    ).toBeInTheDocument()
  })

  it('forwards the button type', () => {
    render(
      <ChatActionButton type="submit" ariaLabel="Send message">
        icon
      </ChatActionButton>,
    )

    expect(
      screen.getByRole('button', { name: 'Send message' }),
    ).toHaveAttribute('type', 'submit')
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(
      <ChatActionButton
        type="button"
        ariaLabel="Stop generating"
        onClick={onClick}
      >
        icon
      </ChatActionButton>,
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Stop generating' }),
    )

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not fire onClick while disabled', async () => {
    const onClick = vi.fn()
    render(
      <ChatActionButton
        type="button"
        ariaLabel="Stop generating"
        disabled
        onClick={onClick}
      >
        icon
      </ChatActionButton>,
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Stop generating' }),
    )

    expect(onClick).not.toHaveBeenCalled()
  })
})
