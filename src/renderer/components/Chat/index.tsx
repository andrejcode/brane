import { clsx } from 'clsx'
import {
  type SubmitEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useAlert } from '@/contexts/AlertContext'
import { useChat } from '@/contexts/ChatContext'
import { useChatSettings } from '@/contexts/ChatSettingsContext'
import { useTranslation } from '@/contexts/LocaleContext'
import { useModel } from '@/contexts/ModelContext'
import { createId } from '@/utils'
import { ChatInput } from './ChatInput'
import { IntroMessage } from './IntroMessage'
import { Messages } from './Messages'

export function Chat() {
  const { showAlert } = useAlert()
  const { selectedModel, loadedModel, selectModel } = useModel()
  const { sendWithModifierEnter } = useChatSettings()
  const {
    messages,
    setMessages,
    isSending,
    setIsSending,
    streamingAssistantMessageIdRef,
    activeChat,
    isLoadingChat,
    pendingModelRestore,
    clearPendingModelRestore,
    ensureActiveChat,
    refreshChats,
  } = useChat()
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  // A chat being opened is about to have messages, so it must not flash the
  // centered greeting on its way in.
  const isEmpty = messages.length === 0 && !isLoadingChat
  // The composer floats over messages, so messages need matching bottom padding
  const [bottomOverlayInset, setBottomOverlayInset] = useState(0)
  const bottomOverlayRef = useRef<HTMLDivElement>(null)
  const bottomFadeRef = useRef<HTMLDivElement>(null)

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
      const activeMessageId = streamingAssistantMessageIdRef.current

      // New chat clears this ref while an abort may still emit late events.
      if (activeMessageId === null) {
        return
      }

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
        streamingAssistantMessageIdRef.current = null
        setIsSending(false)
        // Storing this turn moved the chat up the list.
        void refreshChats()

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
      streamingAssistantMessageIdRef.current = null
      setIsSending(false)
      void refreshChats()
    })

    return () => {
      unsubscribe()
    }
  }, [
    refreshChats,
    setIsSending,
    setMessages,
    showAlert,
    streamingAssistantMessageIdRef,
  ])

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

  const needsModelRestore =
    pendingModelRestore !== null && pendingModelRestore !== loadedModel

  // Sending is the first point a stored chat needs its own model in memory, so a
  // chat opened from the sidebar loads its model here rather than on open.
  const loadChatModel = useCallback(async () => {
    clearPendingModelRestore()

    if (!needsModelRestore || pendingModelRestore === null) {
      return
    }

    await selectModel(pendingModelRestore)
  }, [
    clearPendingModelRestore,
    needsModelRestore,
    pendingModelRestore,
    selectModel,
  ])

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

    // Only blocks when this chat's own model is both needed and gone; after the
    // warning the user's current selection takes over.
    if (needsModelRestore && activeChat?.modelAvailability === 'missing') {
      clearPendingModelRestore()
      showAlert(t('chat.modelMissingAlert'), 'error')
      return
    }

    const assistantMessageId = createId()

    streamingAssistantMessageIdRef.current = assistantMessageId
    setInput('')
    setIsSending(true)
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: createId(),
        role: 'user',
        content: prompt,
      },
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
      },
    ])

    void (async () => {
      try {
        await loadChatModel()
        await window.electronApi.sendPrompt(prompt, await ensureActiveChat())
      } catch {
        showAlert(t('chat.sendFailed'), 'error')
        setMessages((currentMessages) =>
          currentMessages.filter(
            (message) => message.id !== assistantMessageId,
          ),
        )
        streamingAssistantMessageIdRef.current = null
        setIsSending(false)
      }
    })()
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
