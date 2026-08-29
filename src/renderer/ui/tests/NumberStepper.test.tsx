import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NumberStepper } from '../NumberStepper'

interface RenderStepperOptions {
  value?: number
  onChange?: (value: number) => void
}

function renderStepper({
  value = 3,
  onChange = vi.fn(),
}: RenderStepperOptions = {}) {
  render(
    <NumberStepper
      ariaLabel="Quantity"
      value={value}
      min={1}
      max={5}
      suffix="px"
      increaseLabel="Increase quantity"
      decreaseLabel="Decrease quantity"
      onChange={onChange}
    />,
  )
}

describe('NumberStepper', () => {
  it('increments and decrements with its buttons', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderStepper({ onChange })

    await user.click(screen.getByRole('button', { name: 'Increase quantity' }))
    await user.click(screen.getByRole('button', { name: 'Decrease quantity' }))

    expect(onChange).toHaveBeenNthCalledWith(1, 4)
    expect(onChange).toHaveBeenNthCalledWith(2, 3)
  })

  it('clamps a typed value when the input loses focus', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderStepper({ onChange })
    const input = screen.getByRole('spinbutton', { name: 'Quantity' })

    await user.clear(input)
    await user.type(input, '10')
    await user.tab()

    expect(onChange).toHaveBeenCalledWith(5)
    expect(input).toHaveValue(5)
  })

  it('disables the corresponding button at each bound', () => {
    const { rerender } = render(
      <NumberStepper
        ariaLabel="Quantity"
        value={1}
        min={1}
        max={5}
        increaseLabel="Increase quantity"
        decreaseLabel="Decrease quantity"
        onChange={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Decrease quantity' }),
    ).toBeDisabled()

    rerender(
      <NumberStepper
        ariaLabel="Quantity"
        value={5}
        min={1}
        max={5}
        increaseLabel="Increase quantity"
        decreaseLabel="Decrease quantity"
        onChange={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Increase quantity' }),
    ).toBeDisabled()
  })
})
