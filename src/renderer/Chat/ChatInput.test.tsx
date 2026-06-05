import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatInput } from './ChatInput'

function renderChatInput(
  overrides: Partial<Parameters<typeof ChatInput>[0]> = {},
) {
  const props = {
    input: '',
    isSending: false,
    onSubmit: vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault()
    }),
    setInput: vi.fn(),
    ...overrides,
  }

  render(<ChatInput {...props} />)

  return props
}

describe('ChatInput send button', () => {
  it('is disabled when the input is empty', () => {
    renderChatInput({ input: '' })

    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
  })

  it('is disabled when the input is only whitespace', () => {
    renderChatInput({ input: '   ' })

    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
  })

  it('is enabled with non-empty input', () => {
    renderChatInput({ input: 'hello' })

    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled()
  })

  it('is disabled while a message is sending', () => {
    renderChatInput({ input: 'hello', isSending: true })

    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
  })
})

describe('ChatInput typing', () => {
  it('forwards input changes to setInput', () => {
    const { setInput } = renderChatInput()

    fireEvent.change(screen.getByPlaceholderText('Ask anything'), {
      target: { value: 'abc' },
    })

    expect(setInput).toHaveBeenCalledWith('abc')
  })
})

describe('ChatInput keyboard submit', () => {
  it('submits on Enter', () => {
    const { onSubmit } = renderChatInput({ input: 'hello' })

    fireEvent.keyDown(screen.getByPlaceholderText('Ask anything'), {
      key: 'Enter',
    })

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('does not submit on Shift+Enter (newline)', () => {
    const { onSubmit } = renderChatInput({ input: 'hello' })

    fireEvent.keyDown(screen.getByPlaceholderText('Ask anything'), {
      key: 'Enter',
      shiftKey: true,
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not submit while composing (IME)', () => {
    const { onSubmit } = renderChatInput({ input: 'hello' })

    fireEvent.keyDown(screen.getByPlaceholderText('Ask anything'), {
      key: 'Enter',
      isComposing: true,
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('ChatInput global focus stealing', () => {
  it('focuses the textarea when a printable key is pressed elsewhere', () => {
    renderChatInput()
    const textarea = screen.getByPlaceholderText('Ask anything')

    expect(textarea).not.toHaveFocus()
    fireEvent.keyDown(document, { key: 'a' })

    expect(textarea).toHaveFocus()
  })

  it('ignores modifier shortcuts', () => {
    renderChatInput()
    const textarea = screen.getByPlaceholderText('Ask anything')

    fireEvent.keyDown(document, { key: 'a', metaKey: true })

    expect(textarea).not.toHaveFocus()
  })

  it('ignores non-printable keys', () => {
    renderChatInput()
    const textarea = screen.getByPlaceholderText('Ask anything')

    fireEvent.keyDown(document, { key: 'ArrowDown' })

    expect(textarea).not.toHaveFocus()
  })

  it('does not steal focus from another editable element', () => {
    render(
      <div>
        <input aria-label="other" />
        <ChatInput
          input=""
          isSending={false}
          onSubmit={vi.fn()}
          setInput={vi.fn()}
        />
      </div>,
    )
    const other = screen.getByLabelText('other')
    other.focus()

    fireEvent.keyDown(document, { key: 'a' })

    expect(other).toHaveFocus()
    expect(screen.getByPlaceholderText('Ask anything')).not.toHaveFocus()
  })
})
