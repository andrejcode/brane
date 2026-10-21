import {
  fireEvent,
  render as testingRender,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AlertProvider } from '@/contexts/AlertContext'
import { clearMockElectronApi, installMockElectronApi } from '@test/electronApi'
import { MarkdownRenderer } from '..'

vi.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: vi.fn(() => false),
}))

beforeEach(() => {
  const modalRoot = document.createElement('div')
  modalRoot.id = 'modal-root'
  document.body.appendChild(modalRoot)
})

afterEach(() => {
  document.getElementById('modal-root')?.remove()
  clearMockElectronApi()
})

function render(component: React.ReactNode) {
  return testingRender(<AlertProvider>{component}</AlertProvider>)
}

function selectContents(node: Node) {
  const selection = document.getSelection()
  const range = document.createRange()
  range.selectNodeContents(node)
  selection?.removeAllRanges()
  selection?.addRange(range)
}

function selectRange(
  startNode: Node,
  startOffset: number,
  endNode: Node,
  endOffset: number,
) {
  const selection = document.getSelection()
  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  selection?.removeAllRanges()
  selection?.addRange(range)
}

function copySelection(root: HTMLElement) {
  const setData = vi.fn()
  fireEvent.copy(root, { clipboardData: { setData } })
  return setData
}

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

  it('asks before opening links in the external browser', async () => {
    const { openExternal } = installMockElectronApi()
    const user = userEvent.setup()
    render(<MarkdownRenderer content="[Link text](https://example.com)" />)

    await user.click(screen.getByRole('link', { name: 'Link text' }))

    expect(screen.getByRole('alertdialog')).toHaveAccessibleName(
      'Open external link?',
    )
    expect(openExternal).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Open link' }))

    expect(openExternal).toHaveBeenCalledWith('https://example.com')
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
    expect(container.querySelector('.code-scrollbar')).toHaveStyle({
      maxWidth: '100%',
      overflowX: 'auto',
    })
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

  it('leaves ordinary text selection copying to the browser', () => {
    render(<MarkdownRenderer content="Ordinary text" />)
    const root = screen.getByText('Ordinary text').parentElement!
    selectContents(root)

    expect(copySelection(root)).not.toHaveBeenCalled()
  })

  it('copies multiple inline formulas with surrounding selected prose', () => {
    const formula = 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'
    render(<MarkdownRenderer content={`Inline $E = mc^2$ and $${formula}$.`} />)
    const root = screen.getByText(/Inline/).parentElement
    expect(root).not.toBeNull()
    selectContents(root!)

    const setData = copySelection(root!)

    expect(setData).toHaveBeenCalledWith(
      'text/plain',
      `Inline $E = mc^2$ and $${formula}$.`,
    )
  })

  it('copies display math once as its original TeX', () => {
    const formula = '\\frac{a}{b}'
    const { container } = render(
      <MarkdownRenderer content={`$$\n${formula}\n$$`} />,
    )
    const root = container.firstElementChild as HTMLElement
    selectContents(root)

    expect(copySelection(root)).toHaveBeenCalledWith(
      'text/plain',
      `$$\n${formula}\n$$`,
    )
  })

  it('copies a partial visual math selection as the complete formula', () => {
    const formula = 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'
    const { container } = render(
      <MarkdownRenderer content={`Formula: $${formula}$`} />,
    )
    const root = screen.getByText(/Formula:/).parentElement
    const visualMath = container.querySelector('.katex-html')
    expect(root).not.toBeNull()
    expect(visualMath).not.toBeNull()
    selectContents(visualMath!)

    const setData = copySelection(root!)

    expect(setData).toHaveBeenCalledWith('text/plain', `$${formula}$`)
  })

  it('preserves whitespace in canonical inline TeX', () => {
    const formula = '\\text{two  spaces}'
    const { container } = render(
      <MarkdownRenderer content={`Before $${formula}$ after`} />,
    )
    const root = container.firstElementChild as HTMLElement
    selectContents(root)

    expect(copySelection(root)).toHaveBeenCalledWith(
      'text/plain',
      `Before $${formula}$ after`,
    )
  })

  it('keeps an intersected formula atomic when selection starts in prose', () => {
    const formula = '\\sqrt{x^2 + y^2}'
    const { container } = render(
      <MarkdownRenderer content={`Before $${formula}$ after`} />,
    )
    const paragraph = screen.getByText(/Before/)
    const proseText = paragraph.firstChild
    const visualMathText = container.querySelector('.katex-html')?.firstChild
    const root = paragraph.parentElement
    expect(proseText).not.toBeNull()
    expect(visualMathText).not.toBeNull()
    expect(root).not.toBeNull()
    selectRange(proseText!, 0, visualMathText!, 1)

    const setData = copySelection(root!)

    expect(setData).toHaveBeenCalledWith('text/plain', `Before $${formula}$`)
  })

  it('does not intercept copy for a collapsed selection', () => {
    render(<MarkdownRenderer content="Nothing selected" />)
    const text = screen.getByText('Nothing selected').firstChild
    const root = screen.getByText('Nothing selected').parentElement
    expect(text).not.toBeNull()
    expect(root).not.toBeNull()
    selectRange(text!, 3, text!, 3)

    const setData = copySelection(root!)

    expect(setData).not.toHaveBeenCalled()
  })

  it('copies only the selected portion of ordinary formatted text', () => {
    render(<MarkdownRenderer content="Alpha **Beta Gamma** Omega $x^2$" />)
    const selectedText = screen.getByText('Beta Gamma').firstChild
    const root = screen.getByText(/Alpha/).parentElement
    expect(selectedText).not.toBeNull()
    expect(root).not.toBeNull()
    const selection = document.getSelection()
    const range = document.createRange()
    range.setStart(selectedText!, 0)
    range.setEnd(selectedText!, 4)
    selection?.removeAllRanges()
    selection?.addRange(range)

    const setData = copySelection(root!)

    expect(setData).not.toHaveBeenCalled()
  })

  it('leaves copy events outside the rendered response untouched', () => {
    const { container } = render(<MarkdownRenderer content="Inside" />)
    const outside = document.createElement('p')
    outside.textContent = 'Outside'
    document.body.appendChild(outside)
    selectContents(outside)
    const root = container.firstElementChild
    expect(root).toBeInstanceOf(HTMLElement)

    const setData = copySelection(root as HTMLElement)

    expect(setData).not.toHaveBeenCalled()
    outside.remove()
  })

  it('renders safe raw HTML', () => {
    render(<MarkdownRenderer content="<strong>Raw emphasis</strong>" />)

    expect(screen.getByText('Raw emphasis').tagName).toBe('STRONG')
  })

  it('prevents raw HTML from spoofing KaTeX elements', () => {
    const { container } = render(
      <MarkdownRenderer content={'<span class="katex">Not a formula</span>'} />,
    )
    const root = screen.getByText('Not a formula').parentElement
    expect(root).not.toBeNull()
    expect(container.querySelector('.katex')).toBeNull()
    selectContents(root!)

    const setData = copySelection(root!)

    expect(setData).not.toHaveBeenCalled()
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
