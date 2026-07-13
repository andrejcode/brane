import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useColorScheme } from '@/hooks/useColorScheme'
import { MarkdownRenderer } from '..'

vi.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: vi.fn(() => false),
}))

describe('MarkdownRenderer', () => {
  it('renders plain text', () => {
    render(<MarkdownRenderer content="Simple text content" />)

    expect(screen.getByText('Simple text content')).toBeInTheDocument()
  })

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

  it('renders fenced code blocks with a language label', () => {
    const { container } = render(
      <MarkdownRenderer content={'```javascript\nconst x = 1;\n```'} />,
    )

    expect(screen.getByText('javascript')).toBeInTheDocument()
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

  it('renders in both color schemes', () => {
    vi.mocked(useColorScheme).mockReturnValue(false)
    const { container, unmount } = render(
      <MarkdownRenderer content={'```javascript\nconst x = 1;\n```'} />,
    )
    expect(container.textContent).toContain('const x = 1;')
    unmount()

    vi.mocked(useColorScheme).mockReturnValue(true)
    const { container: darkContainer } = render(
      <MarkdownRenderer content={'```javascript\nconst x = 1;\n```'} />,
    )
    expect(darkContainer.textContent).toContain('const x = 1;')
  })
})
