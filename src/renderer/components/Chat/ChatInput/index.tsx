import { clsx } from 'clsx'
import { ArrowUp, Square } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type {
  Dispatch,
  KeyboardEventHandler,
  SetStateAction,
  SubmitEventHandler,
} from 'react'
import { useTranslation } from '@/contexts/LocaleContext'
import { useIsAnyModalOpen } from '@/contexts/ModalContext'
import { ChatActionButton } from './ChatActionButton'
import { isMultilineHeight, resolveTextareaHeight } from './chatInputLayout'

const MAX_ROWS = 8
// Right padding (px) of the textarea
const SINGLE_ROW_PADDING_RIGHT = 48
const MULTI_ROW_PADDING_RIGHT = 16

interface ChatInputProps {
  activeChatId: string | null
  input: string
  isSending: boolean
  onStop: () => void
  onSubmit: SubmitEventHandler<HTMLFormElement>
  setInput: Dispatch<SetStateAction<string>>
  // When true, Cmd/Ctrl+Enter submits and plain Enter inserts a newline.
  sendWithModifierEnter: boolean
}

export function ChatInput({
  activeChatId,
  input,
  isSending,
  onStop,
  onSubmit,
  setInput,
  sendWithModifierEnter,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previousActiveChatIdRef = useRef(activeChatId)
  const [isMultiline, setIsMultiline] = useState(false)
  const isModalOpen = useIsAnyModalOpen()
  const { t } = useTranslation()

  useEffect(() => {
    if (activeChatId === previousActiveChatIdRef.current) {
      return
    }

    previousActiveChatIdRef.current = activeChatId

    if (activeChatId !== null && !isModalOpen) {
      textareaRef.current?.focus()
    }
  }, [activeChatId, isModalOpen])

  const resize = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      return false
    }

    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 24

    const startPaddingRight = textarea.style.paddingRight
    const startHeight = textarea.style.height

    textarea.style.transition = 'none'
    textarea.style.paddingRight = `${SINGLE_ROW_PADDING_RIGHT}px`
    textarea.style.height = 'auto'
    const multiline = isMultilineHeight(textarea.scrollHeight, lineHeight)

    const targetPaddingRight = multiline
      ? MULTI_ROW_PADDING_RIGHT
      : SINGLE_ROW_PADDING_RIGHT
    textarea.style.paddingRight = `${targetPaddingRight}px`
    textarea.style.height = 'auto'
    const { height: nextHeight, overflowY } = resolveTextareaHeight({
      scrollHeight: textarea.scrollHeight,
      lineHeight,
      maxRows: MAX_ROWS,
    })

    textarea.style.paddingRight = startPaddingRight
    textarea.style.height = startHeight
    void textarea.offsetHeight
    textarea.style.transition = ''
    textarea.style.paddingRight = `${targetPaddingRight}px`
    textarea.style.height = `${nextHeight}px`
    textarea.style.overflowY = overflowY

    return multiline
  }, [])

  useLayoutEffect(() => {
    // The row count can only be derived by measuring the rendered textarea, so
    // storing the measurement here is the intended use of a layout effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- DOM measurement
    setIsMultiline(resize())
  }, [input, resize])

  useEffect(() => {
    // While a modal is open, don't steal focus into the chat input.
    if (isModalOpen) {
      return
    }

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const textarea = textareaRef.current
      if (!textarea || document.activeElement === textarea) {
        return
      }

      // Let shortcuts and non-printable keys pass through untouched.
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return
      }
      if (event.key.length !== 1) {
        return
      }

      // Don't steal focus from another editable element, or from an open menu.
      const active = document.activeElement
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable) ||
        document.querySelector('[role="menu"]')
      ) {
        return
      }

      textarea.focus()
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isModalOpen])

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.nativeEvent.isComposing ||
      isModalOpen
    ) {
      return
    }

    // metaKey covers Cmd on macOS; ctrlKey covers Ctrl on Windows/Linux.
    const modifierPressed = event.metaKey || event.ctrlKey

    if (sendWithModifierEnter ? !modifierPressed : modifierPressed) {
      return
    }

    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  return (
    <form
      onSubmit={onSubmit}
      className={clsx(
        'relative w-full shrink-0 px-0 pt-3',
        'transition-[padding] duration-200 ease-out',
        'border border-neutral-200 bg-neutral-50 shadow dark:border-none dark:bg-neutral-700',
        isMultiline ? 'rounded-3xl pb-12' : 'rounded-full pb-3',
      )}
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('chat.inputPlaceholder')}
        rows={1}
        className={clsx(
          'block w-full min-h-6 resize-none pl-4 leading-6',
          'transition-[height,padding] duration-200 ease-out',
          'bg-transparent text-neutral-800 focus:outline-none dark:text-neutral-100',
        )}
      />
      {isSending ? (
        <ChatActionButton
          type="button"
          title={t('chat.stopGenerating')}
          ariaLabel={t('chat.stopGenerating')}
          disabled={isModalOpen}
          onClick={onStop}
        >
          <Square size={16} className="fill-current" />
        </ChatActionButton>
      ) : (
        <ChatActionButton
          type="submit"
          title={t('chat.sendMessage')}
          ariaLabel={t('chat.sendMessage')}
          disabled={isModalOpen || input.trim().length === 0}
        >
          <ArrowUp size={20} />
        </ChatActionButton>
      )}
    </form>
  )
}
