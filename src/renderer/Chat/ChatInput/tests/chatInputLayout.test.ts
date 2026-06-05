import { describe, expect, it } from 'vitest'
import { isMultilineHeight, resolveTextareaHeight } from '../chatInputLayout'

describe('isMultilineHeight', () => {
  it('is single line at or below the 1.5x line-height guard', () => {
    expect(isMultilineHeight(30, 24)).toBe(false)
    expect(isMultilineHeight(36, 24)).toBe(false)
  })

  it('becomes multiline once content clears the guard', () => {
    expect(isMultilineHeight(48, 24)).toBe(true)
  })
})

describe('resolveTextareaHeight', () => {
  it('grows with the content and hides overflow below the cap', () => {
    expect(
      resolveTextareaHeight({ scrollHeight: 100, lineHeight: 24, maxRows: 8 }),
    ).toEqual({ height: 100, overflowY: 'hidden' })
  })

  it('caps at maxRows and enables scrolling once exceeded', () => {
    // maxHeight = 24 * 8 = 192
    expect(
      resolveTextareaHeight({ scrollHeight: 300, lineHeight: 24, maxRows: 8 }),
    ).toEqual({ height: 192, overflowY: 'auto' })
  })

  it('keeps overflow hidden exactly at the cap', () => {
    expect(
      resolveTextareaHeight({ scrollHeight: 192, lineHeight: 24, maxRows: 8 }),
    ).toEqual({ height: 192, overflowY: 'hidden' })
  })
})
