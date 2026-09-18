import {
  deriveChatTitle,
  MAX_CHAT_TITLE_LENGTH,
  MIN_CHAT_TITLE_LENGTH,
} from '../chatTitle'

describe('deriveChatTitle', () => {
  it('uses the first line of the prompt', () => {
    expect(deriveChatTitle('How do I bake sourdough?\nPlease be brief.')).toBe(
      'How do I bake sourdough?',
    )
  })

  it('collapses extra whitespace', () => {
    expect(deriveChatTitle('  How   do I\tbake  ')).toBe('How do I bake')
  })

  it('caps the stored title without adding an ellipsis', () => {
    const prompt = 'a'.repeat(MAX_CHAT_TITLE_LENGTH + 20)

    expect(deriveChatTitle(prompt)).toBe('a'.repeat(MAX_CHAT_TITLE_LENGTH))
    expect(deriveChatTitle(prompt).endsWith('...')).toBe(false)
  })

  it('shortens a long title at a whole-word boundary within the range', () => {
    const prompt =
      'Since you left the theme wide open, I have written a long, expansive poem that attempts to capture the vastness of existence'
    const title = deriveChatTitle(prompt)

    expect(title).toBe(
      'Since you left the theme wide open, I have written a long,',
    )
    expect(title.length).toBeGreaterThanOrEqual(MIN_CHAT_TITLE_LENGTH)
    expect(title.length).toBeLessThanOrEqual(MAX_CHAT_TITLE_LENGTH)
  })

  it('does not cut a word that spans the title range', () => {
    const firstWord = 'a'.repeat(MIN_CHAT_TITLE_LENGTH - 5)
    const prompt = `${firstWord} ${'b'.repeat(20)}`

    expect(deriveChatTitle(prompt)).toBe(firstWord)
  })

  it('returns an empty string when nothing remains', () => {
    expect(deriveChatTitle('   \n\n   ')).toBe('')
  })

  it('is idempotent', () => {
    const prompt = `  ${'word '.repeat(40)}\nsecond line`

    expect(deriveChatTitle(deriveChatTitle(prompt))).toBe(
      deriveChatTitle(prompt),
    )
  })
})
