import { render, screen } from '@testing-library/react'
import { ContextUsageIndicator } from '../ContextUsageIndicator'

describe('ContextUsageIndicator', () => {
  it('shows context percentage and token details', () => {
    render(
      <ContextUsageIndicator
        percentage={72}
        usedTokens={115200}
        totalTokens={160000}
      />,
    )

    expect(screen.getByText('72%')).toBeInTheDocument()
    expect(screen.queryByText('Context')).not.toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAccessibleName(
      '72% context used. 115,200 / 160,000 tokens. 44,800 tokens remaining.',
    )
  })

  it('shows an unavailable state before context usage is known', () => {
    render(<ContextUsageIndicator />)

    expect(screen.getByText('N/A')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Context usage is not available yet.',
    )
  })

  it('clamps usage and announces when the context limit is reached', () => {
    render(
      <ContextUsageIndicator
        percentage={125}
        usedTokens={170000}
        totalTokens={160000}
      />,
    )

    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Context limit reached. 170,000 / 160,000 tokens used.',
    )
  })
})
