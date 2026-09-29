import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarkdownRenderer } from '..'

vi.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: vi.fn(() => false),
}))

describe('MarkdownRenderer', () => {
  it('renders bold and italic formatting', () => {
    render(<MarkdownRenderer content="**Bold text** and *Italic text*" />)

    expect(screen.getByText('Bold text').closest('strong')).toBeInTheDocument()
    expect(screen.getByText('Italic text').closest('em')).toBeInTheDocument()
  })

  it('renders links with their href', () => {
    render(<MarkdownRenderer content="[Link text](https://example.com)" />)

    const link = screen.getByText('Link text')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', 'https://example.com')
  })

  it('renders fenced code blocks with an icon-only copy control', async () => {
    const { container } = render(
      <MarkdownRenderer content={'```javascript\nconst x = 1;\n```'} />,
    )

    expect(screen.getByText('javascript')).toBeInTheDocument()
    const copyButton = screen.getByRole('button', { name: 'Copy code' })
    expect(screen.queryByText('Copy code')).not.toBeInTheDocument()

    await userEvent.hover(copyButton)
    expect(
      await screen.findByRole('tooltip', {}, { timeout: 2500 }),
    ).toHaveTextContent('Copy code')

    expect(container.textContent).toContain('const x = 1;')
  })

  it('renders inline code as a code element', () => {
    render(<MarkdownRenderer content="This is `inline code`" />)

    expect(screen.getByText('inline code').tagName).toBe('CODE')
  })

  it('sanitizes dangerous HTML', () => {
    render(
      <MarkdownRenderer content="<script>alert('xss')</script> Safe text" />,
    )

    expect(screen.queryByText("alert('xss')")).not.toBeInTheDocument()
    expect(screen.getByText('Safe text')).toBeInTheDocument()
  })
})
