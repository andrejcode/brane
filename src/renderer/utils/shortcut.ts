import type { ShortcutBinding } from '@shared/types'

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta'])

export function isModifierKey(key: string) {
  return MODIFIER_KEYS.has(key)
}

function normalizeKey(key: string) {
  return key.length === 1 ? key.toLowerCase() : key
}

// Turns a keyboard event into a binding, or null when only modifier keys are
// held (so a recorder can wait for a real, complete combination).
export function eventToBinding(
  event: Pick<
    KeyboardEvent,
    'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'
  >,
  isMac: boolean,
): ShortcutBinding | null {
  if (isModifierKey(event.key)) {
    return null
  }

  return {
    key: normalizeKey(event.key),
    mod: isMac ? event.metaKey : event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey,
  }
}

export function matchesBinding(
  event: Pick<
    KeyboardEvent,
    'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'
  >,
  binding: ShortcutBinding,
  isMac: boolean,
) {
  // The non-primary platform modifier must be up so, e.g., Ctrl+S on macOS does
  // not fire a shortcut bound to Cmd+S.
  const crossModifier = isMac ? event.ctrlKey : event.metaKey
  if (crossModifier) {
    return false
  }

  const mod = isMac ? event.metaKey : event.ctrlKey
  return (
    event.key.toLowerCase() === binding.key.toLowerCase() &&
    mod === binding.mod &&
    event.shiftKey === binding.shift &&
    event.altKey === binding.alt
  )
}

export function bindingsEqual(a: ShortcutBinding, b: ShortcutBinding) {
  return (
    a.key.toLowerCase() === b.key.toLowerCase() &&
    a.mod === b.mod &&
    a.shift === b.shift &&
    a.alt === b.alt
  )
}

function formatKey(key: string) {
  if (key === ' ') {
    return 'Space'
  }

  return key.length === 1 ? key.toUpperCase() : key
}

export function formatShortcut(binding: ShortcutBinding, isMac: boolean) {
  if (isMac) {
    const parts: string[] = []
    if (binding.alt) parts.push('⌥')
    if (binding.shift) parts.push('⇧')
    if (binding.mod) parts.push('⌘')
    parts.push(formatKey(binding.key))
    return parts.join('')
  }

  const parts: string[] = []
  if (binding.mod) parts.push('Ctrl')
  if (binding.alt) parts.push('Alt')
  if (binding.shift) parts.push('Shift')
  parts.push(formatKey(binding.key))
  return parts.join('+')
}
