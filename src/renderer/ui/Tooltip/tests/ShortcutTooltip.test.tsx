import { render, screen } from '@testing-library/react'
import { ShortcutTooltip } from '../ShortcutTooltip'

describe('ShortcutTooltip', () => {
  it('renders a shortcut without a tag when there is no label', () => {
    render(<ShortcutTooltip shortcut="Ctrl+Shift+M" />)

    expect(screen.getByText('Ctrl+Shift+M')).not.toHaveClass('bg-neutral-200')
  })

  it('renders a shortcut in a tag when there is a label', () => {
    render(<ShortcutTooltip label="Select model" shortcut="Ctrl+Shift+M" />)

    expect(screen.getByText('Ctrl+Shift+M')).toHaveClass('bg-neutral-200')
  })
})
