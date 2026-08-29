import { deriveChatTitle, MAX_CHAT_TITLE_LENGTH } from '../chatTitle'

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
