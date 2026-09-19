import { render, screen } from '@testing-library/react'
import { Tag } from '../Tag'

describe('Tag', () => {
  it('uses content surface colors by default', () => {
    render(<Tag>Context usage</Tag>)

    expect(screen.getByText('Context usage')).toHaveClass(
      'rounded-lg',
      'bg-neutral-200',
      'dark:bg-neutral-700',
    )
  })

  it('supports colors for the sidebar surface', () => {
    render(<Tag surface="sidebar">Local model</Tag>)

    expect(screen.getByText('Local model')).toHaveClass(
      'bg-neutral-200',
      'dark:bg-neutral-800',
    )
  })
})
