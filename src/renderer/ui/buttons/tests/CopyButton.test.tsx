import { render, screen } from '@testing-library/react'
import { CopyButton } from '../CopyButton'

const labels = { copy: 'Copy', copied: 'Copied', error: 'Failed' }

describe('CopyButton', () => {
  it('exposes the idle status as its accessible name', () => {
    render(<CopyButton copyStatus="idle" onClick={() => {}} labels={labels} />)

    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
  })

  it('reflects the copied status in its accessible name', () => {
    render(
      <CopyButton copyStatus="copied" onClick={() => {}} labels={labels} />,
    )

    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('reflects the error status in its accessible name', () => {
    render(<CopyButton copyStatus="error" onClick={() => {}} labels={labels} />)

    expect(screen.getByRole('button', { name: 'Failed' })).toBeInTheDocument()
  })

  it('renders the label text only when showLabel is set', () => {
    const { rerender } = render(
      <CopyButton copyStatus="idle" onClick={() => {}} labels={labels} />,
    )

    expect(screen.queryByText('Copy')).not.toBeInTheDocument()

    rerender(
      <CopyButton
        copyStatus="idle"
        onClick={() => {}}
        labels={labels}
        showLabel
      />,
    )

    expect(screen.getByText('Copy')).toBeInTheDocument()
  })
})
