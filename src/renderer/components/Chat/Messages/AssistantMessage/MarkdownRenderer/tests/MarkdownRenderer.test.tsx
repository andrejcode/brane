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

  it('copies formatted prose and lists as readable plain text', () => {
    render(
      <MarkdownRenderer
        content={
          '# Title\n\nThis is **bold**, *italic*, [linked](https://example.com), and `inline code`.\n\n- First item\n- Second item'
        }
      />,
    )
    const root = screen.getByRole('heading', { name: 'Title' }).parentElement
    expect(root).not.toBeNull()
    selectContents(root!)

    const setData = copySelection(root!)

    expect(setData).toHaveBeenCalledWith(
      'text/plain',
      'Title\n\nThis is bold, italic, linked, and inline code.\n\n- First item\n- Second item',
    )
  })

  it('copies code without fences, language labels, or controls', () => {
    render(
      <MarkdownRenderer
        content={
          '# Example\n\n```typescript\nconst answer: number = 42\n```\n\nDone.'
        }
      />,
    )
    const root = screen.getByRole('heading', { name: 'Example' }).parentElement
    expect(root).not.toBeNull()
    selectContents(root!)

    const setData = copySelection(root!)

    expect(setData).toHaveBeenCalledWith(
      'text/plain',
      'Example\n\nconst answer: number = 42\n\nDone.',
    )
  })

  it('preserves indentation and internal blank lines in copied code', () => {
    const { container } = render(
      <MarkdownRenderer
        content={'```typescript\n  const answer = 42\n\n  return answer\n```'}
      />,
    )
    const code = container.querySelector('[data-copy-code] code')
    const root = container.firstElementChild
    expect(code).not.toBeNull()
    expect(root).toBeInstanceOf(HTMLElement)
    selectContents(code!)

    const setData = copySelection(root as HTMLElement)

    expect(setData).toHaveBeenCalledWith(
      'text/plain',
      '  const answer = 42\n\n  return answer',
    )
  })

  it('copies inline and display math as canonical TeX', () => {
    const formula = 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'
    render(
      <MarkdownRenderer
        content={`# Math\n\nInline $E = mc^2$.\n\n$$\n${formula}\n$$`}
      />,
    )
    const root = screen.getByRole('heading', { name: 'Math' }).parentElement
    expect(root).not.toBeNull()
    selectContents(root!)

    const setData = copySelection(root!)

    expect(setData).toHaveBeenCalledWith(
      'text/plain',
      `Math\n\nInline $E = mc^2$.\n\n$$\n${formula}\n$$`,
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

  it('copies GFM structures with meaningful plain-text separators', () => {
    render(
      <MarkdownRenderer
        content={
          '5. Fifth\n   - Nested\n6. Sixth\n\n- [x] Complete\n- [ ] Pending\n\n| Name | Value |\n| --- | --- |\n| Alpha | 1 |\n\n![Model diagram](https://example.com/model.png)  \nNext line'
        }
      />,
    )
    const root = screen.getByText('Fifth').closest('ol')?.parentElement
    expect(root).not.toBeNull()
    selectContents(root!)

    const setData = copySelection(root!)

    expect(setData).toHaveBeenCalledWith(
      'text/plain',
      '5. Fifth\n  - Nested\n6. Sixth\n\n- [x] Complete\n- [ ] Pending\n\nName\tValue\nAlpha\t1\n\nModel diagram\nNext line',
    )
  })

  it('preserves original numbering for a middle range of list items', () => {
    render(
      <MarkdownRenderer
        content={'1. One\n2. Two\n3. Three\n4. Four\n5. Five'}
      />,
    )
    const firstItemText = screen.getByText('Three').firstChild
    const lastItemText = screen.getByText('Four').firstChild
    const root = screen.getByText('One').closest('ol')?.parentElement
    expect(firstItemText).not.toBeNull()
    expect(lastItemText).not.toBeNull()
    expect(root).not.toBeNull()
    selectRange(
      firstItemText!,
      0,
      lastItemText!,
      lastItemText!.textContent?.length ?? 0,
    )

    const setData = copySelection(root!)

    expect(setData).toHaveBeenCalledWith('text/plain', '3. Three\n4. Four')
  })

  it('preserves a task marker when only its item text is selected', () => {
    render(<MarkdownRenderer content={'- [x] Complete\n- [ ] Pending'} />)
    const item = screen.getByText('Pending').closest('li')
    const itemText = Array.from(item?.childNodes ?? []).find(
      (node) =>
        node.nodeType === Node.TEXT_NODE &&
        node.textContent?.includes('Pending'),
    )
    const root = item?.closest('ul')?.parentElement
    expect(itemText).not.toBeNull()
    expect(root).not.toBeNull()
    const start = itemText!.textContent?.indexOf('Pending') ?? 0
    selectRange(itemText!, start, itemText!, start + 'Pending'.length)

    const setData = copySelection(root!)

    expect(setData).toHaveBeenCalledWith('text/plain', '- [ ] Pending')
  })

  it('preserves cell separators for a partial table row selection', () => {
    render(
      <MarkdownRenderer
        content={'| Name | Value |\n| --- | --- |\n| Alpha | 1 |'}
      />,
    )
    const firstCellText = screen.getByRole('cell', { name: 'Alpha' }).firstChild
    const lastCellText = screen.getByRole('cell', { name: '1' }).firstChild
    const root = screen.getByRole('table').parentElement
    expect(firstCellText).not.toBeNull()
    expect(lastCellText).not.toBeNull()
    expect(root).not.toBeNull()
    selectRange(
      firstCellText!,
      0,
      lastCellText!,
      lastCellText!.textContent?.length ?? 0,
    )

    const setData = copySelection(root!)

    expect(setData).toHaveBeenCalledWith('text/plain', 'Alpha\t1')
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
    render(<MarkdownRenderer content="Alpha **Beta Gamma** Omega" />)
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

    expect(setData).toHaveBeenCalledWith('text/plain', 'Beta')
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

  it('prevents raw HTML from spoofing semantic-copy markers', () => {
    const { container } = render(
      <MarkdownRenderer
        content={
          '<span data-copy-exclude>First</span> <span data-copy-code><code>second</code></span> <span class="katex">third</span>'
        }
      />,
    )
    const root = screen.getByText('First').parentElement
    expect(root).not.toBeNull()
    expect(container.querySelector('[data-copy-exclude]')).toBeNull()
    expect(container.querySelector('[data-copy-code]')).toBeNull()
    expect(container.querySelector('.katex')).toBeNull()
    selectContents(root!)

    const setData = copySelection(root!)

    expect(setData).toHaveBeenCalledWith('text/plain', 'First second third')
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
