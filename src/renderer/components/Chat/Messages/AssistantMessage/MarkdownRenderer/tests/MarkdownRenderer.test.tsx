import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarkdownRenderer } from '..'

vi.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: vi.fn(() => false),
}))

describe('MarkdownRenderer', () => {
  it('renders headings and paragraphs', () => {
    render(<MarkdownRenderer content={'# Heading\n\nParagraph text'} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Heading' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Paragraph text').tagName).toBe('P')
  })

  it('renders bold and italic formatting', () => {
    render(<MarkdownRenderer content="**Bold text** and *Italic text*" />)

    expect(screen.getByText('Bold text').closest('strong')).toBeInTheDocument()
    expect(screen.getByText('Italic text').closest('em')).toBeInTheDocument()
  })

  it('renders blockquotes, lists, and thematic breaks', () => {
    render(
      <MarkdownRenderer
        content={
          '> Quoted text\n\n- First bullet\n- Second bullet\n\n1. First step\n2. Second step\n\n---'
        }
      />,
    )

    expect(screen.getByText('Quoted text').closest('blockquote')).not.toBeNull()
    expect(screen.getByText('First bullet').closest('ul')).not.toBeNull()
    expect(screen.getByText('First step').closest('ol')).not.toBeNull()
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('renders GFM tables, task lists, and strikethrough', () => {
    render(
      <MarkdownRenderer
        content={
          '| Name | Value |\n| --- | --- |\n| Alpha | 1 |\n\n- [x] Complete\n- [ ] Pending\n\n~~Removed~~'
        }
      />,
    )

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: 'Name' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Alpha' })).toBeInTheDocument()
    const [completeTask, pendingTask] = screen.getAllByRole('checkbox')
    expect(screen.getByText('Complete')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(completeTask).toBeChecked()
    expect(pendingTask).not.toBeChecked()
    expect(screen.getByText('Removed').tagName).toBe('DEL')
  })

  it('renders images with alternative text', () => {
    render(
      <MarkdownRenderer content="![A local model](https://example.com/model.png)" />,
    )

    expect(screen.getByRole('img', { name: 'A local model' })).toHaveAttribute(
      'src',
      'https://example.com/model.png',
    )
  })

  it('renders links with their href', () => {
    render(<MarkdownRenderer content="[Link text](https://example.com)" />)

    const link = screen.getByText('Link text')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', 'https://example.com')
  })

  it('renders GFM literal autolinks', () => {
    render(<MarkdownRenderer content="Visit https://example.com/docs" />)

    expect(
      screen.getByRole('link', { name: 'https://example.com/docs' }),
    ).toHaveAttribute('href', 'https://example.com/docs')
  })

  it('renders escaped punctuation and hard line breaks', () => {
    const { container } = render(
      <MarkdownRenderer content={'\\*Literal asterisks\\*  \nNext line'} />,
    )

    expect(screen.getByText(/\*Literal asterisks\*/)).toBeInTheDocument()
    expect(
      screen.queryByText('Literal asterisks', { selector: 'em' }),
    ).toBeNull()
    expect(container.querySelector('br')).not.toBeNull()
    expect(screen.getByText(/Next line/)).toBeInTheDocument()
  })

  it('renders fenced code blocks with an icon-only copy control', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
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

    await userEvent.click(copyButton)

    expect(writeText).toHaveBeenCalledWith('const x = 1;')
    expect(
      await screen.findByRole('button', { name: 'Copied' }),
    ).toBeInTheDocument()
    expect(container.textContent).toContain('const x = 1;')
  })

  it('renders unlabeled fenced code without syntax controls', () => {
    render(<MarkdownRenderer content={'```\nplain text\n```'} />)

    expect(screen.getByText('plain text').tagName).toBe('CODE')
    expect(
      screen.queryByRole('button', { name: 'Copy code' }),
    ).not.toBeInTheDocument()
  })

  it('renders inline code as a code element', () => {
    render(<MarkdownRenderer content="This is `inline code`" />)

    expect(screen.getByText('inline code').tagName).toBe('CODE')
  })

  it('renders inline math as MathML', () => {
    const { container } = render(
      <MarkdownRenderer content="Einstein wrote $E = mc^2$." />,
    )

    const math = container.querySelector('math')
    const annotation = math?.querySelector('annotation')
    expect(math).not.toBeNull()
    expect(annotation?.getAttribute('encoding')).toBe('application/x-tex')
    expect(annotation).toHaveTextContent('E = mc^2')
  })

  it('renders display math as block MathML', () => {
    const { container } = render(
      <MarkdownRenderer
        content={'$$\n\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}\n$$'}
      />,
    )

    const math = container.querySelector('math[display="block"]')
    expect(math).not.toBeNull()
    expect(math?.querySelector('mtable')).not.toBeNull()
    expect(math?.querySelector('annotation')).toHaveTextContent(
      '\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}',
    )
  })

  it('renders safe raw HTML', () => {
    render(<MarkdownRenderer content="<strong>Raw emphasis</strong>" />)

    expect(screen.getByText('Raw emphasis').tagName).toBe('STRONG')
  })

  it('sanitizes dangerous HTML and URLs', () => {
    render(
      <MarkdownRenderer
        content={
          '<script>alert("xss")</script><a href="javascript:alert(1)" onclick="alert(1)">Unsafe link</a> Safe text'
        }
      />,
    )

    const link = screen.getByText('Unsafe link')
    expect(screen.queryByText('alert("xss")')).not.toBeInTheDocument()
    expect(link).not.toHaveAttribute('href')
    expect(link).not.toHaveAttribute('onclick')
    expect(screen.getByText('Safe text')).toBeInTheDocument()
  })
})
