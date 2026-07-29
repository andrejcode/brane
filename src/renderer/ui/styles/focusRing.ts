// Single source of truth for keyboard-focus outlines so every control shows the
// same color and weight. The inset variant exists for controls clipped by an
// overflow-hidden or full-bleed container, where an outer ring would be cut off.
export const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500'

export const FOCUS_RING_INSET =
  'focus:outline-none focus-visible:inset-ring-2 focus-visible:inset-ring-neutral-400 dark:focus-visible:inset-ring-neutral-500'

// Always-on inset ring for controls that decide keyboard-vs-pointer focus
// themselves instead of relying on :focus-visible (e.g. the Select).
export const FOCUS_RING_INSET_ACTIVE =
  'inset-ring-2 inset-ring-neutral-400 dark:inset-ring-neutral-500'
