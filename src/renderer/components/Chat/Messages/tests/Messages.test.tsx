import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Message } from '@/types'
import { Messages } from '..'

const conversation: Message[] = [
  { id: '1', role: 'user', content: 'first user' },
  { id: '2', role: 'assistant', content: 'first assistant' },
  { id: '3', role: 'user', content: 'second user' },
  { id: '4', role: 'assistant', content: 'second assistant' },
]

describe('Messages', () => {
  it('renders every message in order', () => {
    const { container } = render(
      <Messages messages={conversation} bottomInset={0} />,
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
      <Messages messages={conversation} bottomInset={0} />,
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
        messages={[{ id: '1', role: 'user', content: 'only' }]}
        bottomInset={0}
      />,
    )

    expect(container.querySelectorAll('.pt-14 > article')).toHaveLength(0)
    expect(container.querySelectorAll('.pt-14 > div > article')).toHaveLength(1)
  })

  it('renders nothing in the message list when empty', () => {
    const { container } = render(<Messages messages={[]} bottomInset={0} />)

    expect(container.querySelectorAll('article')).toHaveLength(0)
  })

  it('shows a loading spinner for an assistant turn awaiting its first chunk', () => {
    render(
      <Messages
        messages={[
          { id: '1', role: 'user', content: 'hello' },
          { id: '2', role: 'assistant', content: '' },
        ]}
        bottomInset={0}
      />,
    )

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  it('offers no copy control for an assistant turn without content', () => {
    render(
      <Messages
        messages={[{ id: '1', role: 'assistant', content: '' }]}
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
        messages={[{ id: '1', role: 'assistant', content: 'copy me' }]}
        bottomInset={0}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))

    expect(writeText).toHaveBeenCalledWith('copy me')
    expect(
      await screen.findByRole('button', { name: 'Copied' }),
    ).toBeInTheDocument()
  })
})
