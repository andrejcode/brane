import { clsx } from 'clsx'
import {
  type SubmitEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { ChatInput } from './ChatInput'
import { IntroMessage } from './IntroMessage'
import { Messages } from './Messages'
import { useAlert } from '../contexts/AlertContext'
import { useChatSettings } from '../contexts/ChatSettingsContext'
import { useTranslation } from '../contexts/LocaleContext'
import { useModel } from '../contexts/ModelContext'
import type { Message } from '../types'
import { createMessageId } from '../utils'

export function Chat() {
  const { showAlert } = useAlert()
  const { selectedModel } = useModel()
  const { sendWithModifierEnter } = useChatSettings()
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const isEmpty = messages.length === 0
  // The composer floats over messages, so messages need matching bottom padding
  const [bottomOverlayInset, setBottomOverlayInset] = useState(0)
  const bottomOverlayRef = useRef<HTMLDivElement>(null)
  const bottomFadeRef = useRef<HTMLDivElement>(null)
  const streamingAssistantMessageId = useRef<string | null>(null)

  const updateBottomOverlayInset = useCallback(() => {
    const bottomOverlay = bottomOverlayRef.current

    if (!bottomOverlay) {
      return
    }

    const bottomEdge = window.innerHeight
    const overlayTop = bottomOverlay.getBoundingClientRect().top
    const fadeTop = bottomFadeRef.current?.getBoundingClientRect().top
    // Include the fade because it visually covers messages above the input
    const visualTop = Math.min(overlayTop, fadeTop ?? overlayTop)

    setBottomOverlayInset(bottomEdge - visualTop)
  }, [])

  useEffect(() => {
    const unsubscribe = window.electronApi.streamResponse((event) => {
      const activeMessageId = streamingAssistantMessageId.current

      if (event.type === 'chunk') {
        setMessages((currentMessages) =>
          currentMessages.map((message) => {
            if (message.id !== activeMessageId) {
              return message
            }

            if (event.segment === 'thought') {
              const reasoning = message.reasoning ?? ''

              return {
                ...message,
                // Models often lead a segment with blank lines; drop them so the
                // text doesn't open with an empty gap.
                reasoning:
                  reasoning.length === 0
                    ? event.text.trimStart()
                    : reasoning + event.text,
                isThinking: true,
              }
            }

            return {
              ...message,
              content:
                message.content.length === 0
                  ? event.text.trimStart()
                  : message.content + event.text,
              isThinking: false,
            }
          }),
        )

        return
      }

      if (event.type === 'done') {
        setMessages((currentMessages) =>
          currentMessages.flatMap((message) => {
            if (message.id !== activeMessageId) {
              return [message]
            }

            // Stopped before anything streamed: drop the empty placeholder so
            // its loading spinner doesn't linger forever.
            if (
              message.content.length === 0 &&
              (message.reasoning ?? '').length === 0 &&
              event.response.length === 0
            ) {
              return []
            }

            return [
              {
                ...message,
                content:
                  message.content.length === 0
                    ? event.response.trimStart()
                    : message.content,
                isThinking: false,
              },
            ]
          }),
        )
        streamingAssistantMessageId.current = null
        setIsSending(false)

        return
      }

      // Surface backend errors through the global alert rather than inline, and
      // drop the empty placeholder so its loading spinner doesn't linger.
      showAlert(event.message, 'error')
      setMessages((currentMessages) =>
        currentMessages.filter(
          (message) =>
            !(message.id === activeMessageId && message.content.length === 0),
        ),
      )
      streamingAssistantMessageId.current = null
      setIsSending(false)
    })

    return () => {
      unsubscribe()
    }
  }, [showAlert])

  useEffect(() => {
    const bottomOverlay = bottomOverlayRef.current

    if (!bottomOverlay) {
      return
    }

    const resizeObserver = new ResizeObserver(updateBottomOverlayInset)
    const animationFrame = requestAnimationFrame(updateBottomOverlayInset)

    resizeObserver.observe(bottomOverlay)

    if (bottomFadeRef.current) {
      resizeObserver.observe(bottomFadeRef.current)
    }

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
    }
  }, [updateBottomOverlayInset])

  // While the composer slides from center to the bottom, its measured position
  // changes every frame, so keep the message inset in sync for the transition.
  useEffect(() => {
    if (isEmpty) {
      return
    }

    const start = performance.now()
    let animationFrame = requestAnimationFrame(function tick() {
      updateBottomOverlayInset()

      if (performance.now() - start < 600) {
        animationFrame = requestAnimationFrame(tick)
      }
    })

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [isEmpty, updateBottomOverlayInset])

  const handleStop = useCallback(() => {
    void window.electronApi.stopGeneration()
  }, [])

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()

    const prompt = input.trim()

    if (prompt.length === 0 || isSending) {
      return
    }

    if (!selectedModel) {
      showAlert(t('chat.selectModelAlert'), 'info')
      return
    }

    const assistantMessageId = createMessageId()

    streamingAssistantMessageId.current = assistantMessageId
    setInput('')
    setIsSending(true)
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: createMessageId(),
        role: 'user',
        content: prompt,
      },
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
      },
    ])

    void window.electronApi.sendPrompt(prompt).catch(() => {
      showAlert(t('chat.sendFailed'), 'error')
      setMessages((currentMessages) =>
        currentMessages.filter((message) => message.id !== assistantMessageId),
      )
      streamingAssistantMessageId.current = null
      setIsSending(false)
    })
  }

  return (
    <main className="relative flex min-h-0 w-full flex-1">
      <Messages messages={messages} bottomInset={bottomOverlayInset} />

      {/* This overlay is outside normal layout, so we measure it above */}
      <div
        ref={bottomOverlayRef}
        data-testid="composer"
        className={clsx(
          'pointer-events-none absolute inset-x-0 px-4 pb-4',
          'transition-[bottom,transform] duration-500 ease-out',
          // Center the composer until the first message, then dock it
          isEmpty ? 'bottom-1/2 translate-y-1/2' : 'bottom-0 translate-y-0',
        )}
      >
        <div className="mx-auto w-full max-w-4xl">
          <div className="pointer-events-auto relative">
            <IntroMessage isVisible={isEmpty} />

            <div
              ref={bottomFadeRef}
              className={clsx(
                'pointer-events-none absolute inset-x-0 bottom-0',
                'h-24 translate-y-4',
                'bg-white/1 dark:bg-black/1',
                'backdrop-blur-[3px]',
                'mask-[linear-gradient(to_top,black_0%,black_55%,transparent_100%)]',
                'transition-opacity duration-300 ease-out',
                isEmpty ? 'opacity-0' : 'opacity-100',
              )}
            />

            <div className="relative z-10">
              <ChatInput
                input={input}
                isSending={isSending}
                onStop={handleStop}
                onSubmit={handleSubmit}
                setInput={setInput}
                sendWithModifierEnter={sendWithModifierEnter}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
