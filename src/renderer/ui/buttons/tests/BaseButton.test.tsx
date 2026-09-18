import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BaseButton } from '../BaseButton'

describe('BaseButton', () => {
  afterEach(() => {
    vi.useRealTimers()
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

  it('shows tooltip text after a delay on hover and focus', async () => {
    vi.useFakeTimers()
    render(
      <BaseButton type="button" tooltip="Send message" ariaLabel="Send message">
        →
      </BaseButton>,
    )

    const button = screen.getByRole('button', { name: 'Send message' })

    expect(button).not.toHaveAttribute('title')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    fireEvent.mouseEnter(button)

    await act(() => vi.advanceTimersByTime(999))

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    fireEvent.mouseLeave(button)
    await act(() => vi.advanceTimersByTime(1))

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    fireEvent.mouseEnter(button)
    await act(() => vi.advanceTimersByTime(1000))

    expect(screen.getByRole('tooltip')).toHaveTextContent('Send message')

    fireEvent.mouseLeave(button)

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    vi.spyOn(button, 'matches').mockImplementation(
      (selector) => selector === ':focus-visible',
    )
    fireEvent.focus(button)
    await act(() => vi.advanceTimersByTime(1000))

    expect(screen.getByRole('tooltip')).toHaveTextContent('Send message')

    fireEvent.blur(button)

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('does not show a tooltip after programmatic focus restoration', async () => {
    vi.useFakeTimers()
    render(
      <BaseButton type="button" tooltip="Open settings" ariaLabel="Settings">
        Settings
      </BaseButton>,
    )
    const button = screen.getByRole('button', { name: 'Settings' })
    vi.spyOn(button, 'matches').mockReturnValue(false)

    fireEvent.focus(button)
    await act(() => vi.advanceTimersByTime(1000))

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
