import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocaleProvider } from '@/contexts/LocaleContext'
import type { Message } from '@/types'
import { clearMockElectronApi, installMockElectronApi } from '@test/electronApi'
import { Messages } from '..'

const createdAt = new Date(2026, 0, 1, 11, 30).getTime()

const conversation: Message[] = [
  { id: '1', role: 'user', content: 'first user', createdAt },
  { id: '2', role: 'assistant', content: 'first assistant', createdAt },
  { id: '3', role: 'user', content: 'second user', createdAt },
  { id: '4', role: 'assistant', content: 'second assistant', createdAt },
]

describe('Messages', () => {
  it('renders every message in order', () => {
    const { container } = render(
      <Messages activeChatId={null} messages={conversation} bottomInset={0} />,
    )

    const rendered = [...container.querySelectorAll('article')].map(
      (article) => article.textContent,
    )

    expect(rendered).toEqual([
      'first user',
      'first assistant',
      'second user',
      'second assistant',
    ])
  })

  it('keeps the last two turns in the tail container and the rest above it', () => {
    const { container } = render(
      <Messages activeChatId={null} messages={conversation} bottomInset={0} />,
    )

    const earlier = [...container.querySelectorAll('.pt-14 > article')].map(
      (article) => article.textContent,
    )
    const tail = [...container.querySelectorAll('.pt-14 > div > article')].map(
      (article) => article.textContent,
    )

    expect(earlier).toEqual(['first user', 'first assistant'])
    expect(tail).toEqual(['second user', 'second assistant'])
  })

  it('puts a lone message in the tail container', () => {
    const { container } = render(
      <Messages
        activeChatId={null}
        messages={[{ id: '1', role: 'user', content: 'only', createdAt }]}
        bottomInset={0}
      />,
    )

    expect(container.querySelectorAll('.pt-14 > article')).toHaveLength(0)
    expect(container.querySelectorAll('.pt-14 > div > article')).toHaveLength(1)
  })

  it('renders nothing in the message list when empty', () => {
    const { container } = render(
      <Messages activeChatId={null} messages={[]} bottomInset={0} />,
    )

    expect(container.querySelectorAll('article')).toHaveLength(0)
  })

  it('shows a loading spinner for an assistant turn awaiting its first chunk', () => {
    render(
      <Messages
        activeChatId={null}
        messages={[
          { id: '1', role: 'user', content: 'hello', createdAt },
          { id: '2', role: 'assistant', content: '', createdAt },
        ]}
        bottomInset={0}
      />,
    )

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  it('offers no copy control for an assistant turn without content', () => {
    render(
      <Messages
        activeChatId={null}
        messages={[{ id: '1', role: 'assistant', content: '', createdAt }]}
        bottomInset={0}
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'Copy' }),
    ).not.toBeInTheDocument()
  })

  it('copies a message to the clipboard and flashes the copied status', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    render(
      <Messages
        activeChatId={null}
        messages={[
          { id: '1', role: 'assistant', content: 'copy me', createdAt },
        ]}
        bottomInset={0}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))

    expect(writeText).toHaveBeenCalledWith('copy me')
    expect(
      await screen.findByRole('button', { name: 'Copied' }),
    ).toBeInTheDocument()
  })

  it('shows generation metrics beside the assistant message copy control', async () => {
    render(
      <Messages
        activeChatId={null}
        messages={[
          {
            id: '1',
            role: 'assistant',
            content: 'response',
            createdAt,
            contextUsage: { used: 1234, size: 4096 },
            generationMetrics: {
              tokenCount: 42,
              tokensPerSecond: 12.34,
              timeToFirstTokenMs: 250,
              stopReason: 'eogToken',
            },
          },
        ]}
        bottomInset={0}
        showStatistics
      />,
    )

    expect(screen.getByText('42 tokens')).toBeInTheDocument()
    expect(screen.getByText('12.3 tok/s')).toBeInTheDocument()
    expect(screen.getByText('250 ms')).toBeInTheDocument()
    expect(screen.getByText('End token')).toBeInTheDocument()
    expect(
      screen.queryByText('1,234 / 4,096 tokens used'),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()

    await userEvent.hover(screen.getByText('250 ms'))
    expect(
      await screen.findByRole('tooltip', {}, { timeout: 2500 }),
    ).toHaveTextContent('Time to first token')
  })

  it('hides retained statistics by default', () => {
    render(
      <Messages
        activeChatId={null}
        messages={[
          {
            id: '1',
            role: 'assistant',
            content: 'response',
            createdAt,
            contextUsage: { used: 1234, size: 4096 },
            generationMetrics: {
              tokenCount: 42,
              tokensPerSecond: 12.34,
              timeToFirstTokenMs: 250,
              stopReason: 'eogToken',
            },
          },
        ]}
        bottomInset={0}
      />,
    )

    expect(
      screen.queryByText('1,234 / 4,096 tokens used'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('42 tokens')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
  })

  it('does not render message dates when the preference is disabled', () => {
    const { container } = render(
      <Messages
        activeChatId={null}
        messages={[{ id: '1', role: 'user', content: 'hello', createdAt }]}
        bottomInset={0}
      />,
    )

    expect(container.querySelector('time')).not.toBeInTheDocument()
  })

  it('formats message dates using the selected locale', async () => {
    installMockElectronApi({ locale: 'de' })
    const expected = new Intl.DateTimeFormat('de', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(createdAt)

    const { container } = render(
      <LocaleProvider>
        <Messages
          activeChatId={null}
          messages={[{ id: '1', role: 'user', content: 'hello', createdAt }]}
          bottomInset={0}
          showMessageDates
        />
      </LocaleProvider>,
    )

    expect(await screen.findByText(expected)).toBeInTheDocument()
    expect(container.querySelector('time')).toHaveAttribute(
      'datetime',
      new Date(createdAt).toISOString(),
    )
    clearMockElectronApi()
  })

  it('opens a selected chat already scrolled to the bottom', () => {
    const { container, rerender } = render(
      <Messages activeChatId={null} messages={[]} bottomInset={0} />,
    )
    const scrollContainer = container.querySelector('.overflow-y-auto')

    expect(scrollContainer).not.toBeNull()
    Object.defineProperties(scrollContainer, {
      clientHeight: { configurable: true, value: 600 },
      scrollHeight: { configurable: true, value: 1200 },
    })
    const scrollTo = vi.spyOn(scrollContainer as HTMLElement, 'scrollTo')

    rerender(
      <Messages
        activeChatId="chat-1"
        messages={conversation}
        bottomInset={0}
      />,
    )

    expect(scrollContainer?.scrollTop).toBe(1200)
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
