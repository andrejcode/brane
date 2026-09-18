import { act, fireEvent, render, screen } from '@testing-library/react'
import { TooltipTrigger } from '../Tooltip'

describe('TooltipTrigger', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a custom tooltip after a delay', async () => {
    vi.useFakeTimers()
    render(
      <TooltipTrigger tooltip="Model unavailable">Model name</TooltipTrigger>,
    )

    const trigger = screen.getByText('Model name')

    expect(trigger).not.toHaveAttribute('title')

    fireEvent.mouseEnter(trigger)

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await act(() => vi.advanceTimersByTime(999))

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await act(() => vi.advanceTimersByTime(1))

    expect(screen.getByRole('tooltip')).toHaveTextContent('Model unavailable')

    fireEvent.mouseLeave(trigger)

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('only shows an overflow tooltip when its content is truncated', async () => {
    vi.useFakeTimers()
    const { rerender } = render(
      <TooltipTrigger onlyWhenTruncated tooltip="Full model name">
        Model name
      </TooltipTrigger>,
    )
    const trigger = screen.getByText('Model name')
    Object.defineProperties(trigger, {
      clientWidth: { configurable: true, value: 100 },
      scrollWidth: { configurable: true, value: 100 },
    })

    fireEvent.mouseEnter(trigger)
    await act(() => vi.advanceTimersByTime(1000))

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    rerender(
      <TooltipTrigger onlyWhenTruncated tooltip="Full model name">
        Model name
      </TooltipTrigger>,
    )
    Object.defineProperty(trigger, 'scrollWidth', {
      configurable: true,
      value: 101,
    })

    fireEvent.mouseEnter(trigger)
    await act(() => vi.advanceTimersByTime(1000))

    expect(screen.getByRole('tooltip')).toHaveTextContent('Full model name')
  })
})
