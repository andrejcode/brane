const BLOCK_SEPARATOR = '\u0000'

function isSelected(node: Node, range: Range) {
  return range.intersectsNode(node)
}

function readTex(element: Element) {
  return (
    element.querySelector('annotation[encoding="application/x-tex"]')
      ?.textContent ?? ''
  )
}

function serializeList(list: Element, range: Range): string {
  const ordered = list.tagName === 'OL'
  let ordinal = ordered ? Number(list.getAttribute('start') ?? 1) : 1
  const items = Array.from(list.children).filter(
    (child) => child.tagName === 'LI',
  )

  return items
    .map((item) => {
      const explicitOrdinal = item.getAttribute('value')
      if (ordered && explicitOrdinal !== null) {
        ordinal = Number(explicitOrdinal)
      }
      const itemOrdinal = ordinal
      ordinal += 1

      if (!isSelected(item, range)) {
        return ''
      }

      const nestedLists = Array.from(item.children).filter((child) =>
        child.matches('ol, ul'),
      )
      const nestedListSet = new Set(nestedLists)
      const checkbox = Array.from(item.children).find(
        (child) =>
          child instanceof HTMLInputElement && child.type === 'checkbox',
      ) as HTMLInputElement | undefined
      const itemText = Array.from(item.childNodes)
        .filter(
          (child) =>
            !(child instanceof Element && nestedListSet.has(child)) &&
            child !== checkbox,
        )
        .map((child) => serializeNode(child, range))
        .join('')
        .trim()
      const nestedText: string = nestedLists
        .map((nestedList) =>
          serializeList(nestedList, range)
            .split('\n')
            .filter(Boolean)
            .map((line) => `  ${line}`)
            .join('\n'),
        )
        .filter(Boolean)
        .join('\n')
      if (!itemText && nestedText) {
        return nestedText
      }

      const prefix = ordered
        ? `${itemOrdinal}. `
        : checkbox
          ? `- ${checkbox.checked ? '[x]' : '[ ]'} `
          : '- '

      return `${prefix}${itemText}${nestedText ? `\n${nestedText}` : ''}`
    })
    .filter(Boolean)
    .join('\n')
}

function serializeTable(table: Element, range: Range) {
  return Array.from(table.querySelectorAll('tr'))
    .filter((row) => isSelected(row, range))
    .map((row) =>
      Array.from(row.children)
        .filter((cell) => cell.matches('th, td'))
        .filter((cell) => isSelected(cell, range))
        .map((cell) => serializeChildren(cell, range))
        .join('\t'),
    )
    .join('\n')
}

function serializeElement(element: Element, range: Range): string {
  if (
    !isSelected(element, range) ||
    element.hasAttribute('data-copy-exclude')
  ) {
    return ''
  }

  if (element.hasAttribute('data-copy-code')) {
    const code = element.querySelector('code')
    const value = code ? serializeChildren(code, range) : ''
    return value ? `${value}${BLOCK_SEPARATOR}` : ''
  }

  if (element.classList.contains('katex-display')) {
    return `$$\n${readTex(element)}\n$$${BLOCK_SEPARATOR}`
  }

  if (element.classList.contains('katex')) {
    return `$${readTex(element)}$`
  }

  switch (element.tagName) {
    case 'BR':
      return '\n'
    case 'HR':
      return BLOCK_SEPARATOR
    case 'IMG':
      return element.getAttribute('alt') ?? ''
    case 'INPUT':
      return ''
    case 'OL':
    case 'UL':
      return `${serializeList(element, range)}${BLOCK_SEPARATOR}`
    case 'TABLE': {
      const value = serializeTable(element, range)
      return value ? `${value}${BLOCK_SEPARATOR}` : ''
    }
    case 'H1':
    case 'H2':
    case 'H3':
    case 'H4':
    case 'H5':
    case 'H6':
    case 'ARTICLE':
    case 'P':
    case 'PRE':
    case 'BLOCKQUOTE': {
      const value = serializeChildren(element, range)
      return value ? `${value}${BLOCK_SEPARATOR}` : ''
    }
    default:
      return serializeChildren(element, range)
  }
}

function serializeNode(node: Node, range: Range): string {
  if (node.nodeType === Node.TEXT_NODE) {
    if (!isSelected(node, range)) {
      return ''
    }

    const value = node.textContent ?? ''
    const start = node === range.startContainer ? range.startOffset : 0
    const end = node === range.endContainer ? range.endOffset : value.length
    return value.slice(start, end)
  }

  return node instanceof Element
    ? serializeElement(node, range)
    : serializeChildren(node, range)
}

function serializeChildren(node: Node, range: Range): string {
  return Array.from(node.childNodes)
    .map((child, index, children) => {
      const value = serializeNode(child, range)
      return children[index - 1] instanceof HTMLBRElement && value
        ? value.replace(/^\n/, '')
        : value
    })
    .join('')
}

function normalizeBlocks(value: string) {
  return value
    .split(BLOCK_SEPARATOR)
    .map((block) => block.replace(/^\n+|\n+$/g, ''))
    .filter((block) => block.trim().length > 0)
    .join('\n\n')
}

export function getSemanticSelectionText(
  root: HTMLElement,
  selection: Selection | null,
) {
  if (!selection || selection.isCollapsed || selection.rangeCount !== 1) {
    return null
  }

  const range = selection.getRangeAt(0)
  if (
    !root.contains(range.startContainer) ||
    !root.contains(range.endContainer)
  ) {
    return null
  }

  return normalizeBlocks(serializeChildren(root, range))
}

export function writeSemanticSelection(
  root: HTMLElement,
  selection: Selection | null,
  clipboardData: DataTransfer,
) {
  const text = getSemanticSelectionText(root, selection)
  if (text === null) {
    return false
  }

  clipboardData.setData('text/plain', text)
  return true
}
