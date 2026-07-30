import type { ShortcutBinding } from '@shared/types'
import {
  bindingsEqual,
  eventToBinding,
  formatShortcut,
  isModifierKey,
  matchesBinding,
} from '../shortcut'

type KeyEventLike = Pick<
  KeyboardEvent,
  'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'
>

function keyEvent(overrides: Partial<KeyEventLike> = {}): KeyEventLike {
  return {
    key: 's',
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...overrides,
  }
}

const cmdS: ShortcutBinding = { key: 's', mod: true, shift: false, alt: false }

describe('isModifierKey', () => {
  it('recognizes modifier keys', () => {
    expect(isModifierKey('Meta')).toBe(true)
    expect(isModifierKey('Shift')).toBe(true)
    expect(isModifierKey('s')).toBe(false)
  })
})

describe('eventToBinding', () => {
  it('returns null while only modifiers are held', () => {
    expect(eventToBinding(keyEvent({ key: 'Meta', metaKey: true }), true)).toBe(
      null,
    )
  })

  it('maps the primary modifier to Cmd on macOS and Ctrl elsewhere', () => {
    expect(eventToBinding(keyEvent({ key: 'M', metaKey: true }), true)).toEqual(
      {
        key: 'm',
        mod: true,
        shift: false,
        alt: false,
      },
    )
    expect(
      eventToBinding(keyEvent({ key: 'M', ctrlKey: true }), false),
    ).toEqual({ key: 'm', mod: true, shift: false, alt: false })
  })
})

describe('matchesBinding', () => {
  it('matches Cmd+S on macOS', () => {
    expect(matchesBinding(keyEvent({ metaKey: true }), cmdS, true)).toBe(true)
  })

  it('matches Ctrl+S on Windows/Linux', () => {
    expect(matchesBinding(keyEvent({ ctrlKey: true }), cmdS, false)).toBe(true)
  })

  it('does not fire Cmd binding when the cross-platform modifier is held', () => {
    expect(matchesBinding(keyEvent({ ctrlKey: true }), cmdS, true)).toBe(false)
  })

  it('requires the exact set of modifiers', () => {
    expect(
      matchesBinding(keyEvent({ metaKey: true, shiftKey: true }), cmdS, true),
    ).toBe(false)
  })
})

describe('bindingsEqual', () => {
  it('ignores key casing', () => {
    expect(
      bindingsEqual(cmdS, { key: 'S', mod: true, shift: false, alt: false }),
    ).toBe(true)
  })

  it('distinguishes different modifiers', () => {
    expect(
      bindingsEqual(cmdS, { key: 's', mod: true, shift: true, alt: false }),
    ).toBe(false)
  })
})

describe('formatShortcut', () => {
  it('uses symbols on macOS', () => {
    expect(
      formatShortcut({ key: 's', mod: true, shift: true, alt: true }, true),
    ).toBe('⌥⇧⌘S')
  })

  it('uses names joined with plus elsewhere', () => {
    expect(formatShortcut(cmdS, false)).toBe('Ctrl+S')
  })

  it('labels the space key', () => {
    expect(
      formatShortcut({ key: ' ', mod: true, shift: false, alt: false }, false),
    ).toBe('Ctrl+Space')
  })
})
