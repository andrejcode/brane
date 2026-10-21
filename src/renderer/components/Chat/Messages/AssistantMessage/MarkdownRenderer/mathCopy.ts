function getMathSelectionText(root: HTMLElement, selection: Selection | null) {
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

  const formulas = Array.from(root.querySelectorAll('.katex'))
    .map((element) => element.closest('.katex-display') ?? element)
    .filter((element) => range.intersectsNode(element))
  if (formulas.length === 0) {
    return null
  }

  const remaining = range.cloneRange()
  let text = ''
  for (const formula of formulas) {
    if (!formula.contains(remaining.startContainer)) {
      const before = remaining.cloneRange()
      before.setEndBefore(formula)
      text += before.toString()
    }

    const tex =
      formula.querySelector('annotation[encoding="application/x-tex"]')
        ?.textContent ?? ''
    text += formula.classList.contains('katex-display')
      ? `$$\n${tex}\n$$`
      : `$${tex}$`

    if (formula.contains(range.endContainer)) {
      return text
    }
    remaining.setStartAfter(formula)
  }
  return text + remaining.toString()
}

export function writeMathSelection(
  root: HTMLElement,
  selection: Selection | null,
  clipboardData: DataTransfer,
) {
  const text = getMathSelectionText(root, selection)
  if (text === null) {
    return false
  }

  clipboardData.setData('text/plain', text)
  return true
}
