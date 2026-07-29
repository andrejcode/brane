import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoadingSpinner } from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders a status indicator while loading', () => {
    render(<LoadingSpinner isLoading />)

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  it('renders nothing when not loading', () => {
    render(<LoadingSpinner isLoading={false} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
