import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  clearMockElectronApi,
  installMockElectronApi,
  type MockElectronApi,
} from '@test/electronApi'
import { Chat, getErrorMessage } from '../index'

let mock: MockElectronApi

beforeEach(() => {
  mock = installMockElectronApi()
})

afterEach(() => {
  clearMockElectronApi()
})

async function submitPrompt(text: string) {
  const user = userEvent.setup()

  await user.type(screen.getByPlaceholderText('Ask anything'), text)
  await user.click(screen.getByRole('button', { name: 'Send message' }))
}

describe('getErrorMessage', () => {
  it('uses the message from Error instances', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom')
  })

  it('falls back for non-Error values', () => {
    expect(getErrorMessage('nope')).toBe('An unknown error occurred')
  })
})

describe('Chat submit', () => {
  it('sends the trimmed prompt, shows it, and clears the input', async () => {
    render(<Chat />)

    await submitPrompt('  hello  ')

    expect(mock.sendPrompt).toHaveBeenCalledWith('hello')
    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ask anything')).toHaveValue('')
  })
})

describe('Chat streaming', () => {
  it('appends streamed chunks to the assistant message', async () => {
    render(<Chat />)
    await submitPrompt('hi')

    act(() => {
      mock.emitStream({ type: 'chunk', text: 'Hel' })
      mock.emitStream({ type: 'chunk', text: 'lo!' })
    })

    expect(screen.getByText('Hello!')).toBeInTheDocument()
  })

  it('fills the response on done when nothing streamed', async () => {
    render(<Chat />)
    await submitPrompt('hi')

    act(() => {
      mock.emitStream({ type: 'done', response: 'Full answer' })
    })

    expect(screen.getByText('Full answer')).toBeInTheDocument()
  })

  it('keeps streamed content when done arrives after chunks', async () => {
    render(<Chat />)
    await submitPrompt('hi')

    act(() => {
      mock.emitStream({ type: 'chunk', text: 'streamed' })
      mock.emitStream({ type: 'done', response: 'ignored fallback' })
    })

    expect(screen.getByText('streamed')).toBeInTheDocument()
    expect(screen.queryByText('ignored fallback')).not.toBeInTheDocument()
  })

  it('renders an error event in the assistant message', async () => {
    render(<Chat />)
    await submitPrompt('hi')

    act(() => {
      mock.emitStream({ type: 'error', message: 'kaboom' })
    })

    expect(screen.getByText('Error: kaboom')).toBeInTheDocument()
  })
})

describe('Chat error handling', () => {
  it('shows an error when sendPrompt rejects', async () => {
    mock.sendPrompt.mockRejectedValueOnce(new Error('network down'))
    render(<Chat />)

    await submitPrompt('hi')

    expect(await screen.findByText('Error: network down')).toBeInTheDocument()
  })
})

describe('Chat lifecycle', () => {
  it('unsubscribes from the stream on unmount', () => {
    const { unmount } = render(<Chat />)

    unmount()

    expect(mock.streamUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
