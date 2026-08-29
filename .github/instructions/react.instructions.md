---
applyTo: 'src/renderer/**/*.tsx'
---

# React Renderer Instructions

- Use React 19 function components and name props interfaces
  `<Component>Props`.
- Renderer code reaches the main process only through `window.electronApi`.
- Compose class names with `clsx` and group related Tailwind CSS v4 classes
  across lines when needed for readability.
- Use `lucide-react` icons and existing primitives from `@/ui`, such as
  `Button`, `Modal`, and `Switch`, instead of rebuilding them.
- Stabilize values passed into dependency arrays or child components with
  `useCallback` or `useMemo`.
- Guard asynchronous effect work with an `isMounted` flag. Clean up listeners
  and subscriptions on unmount using the unsubscribe functions returned by
  `electronApi`.
- Track superseded asynchronous work with a request ID ref so stale results
  cannot replace newer state; follow `ModelContext` for this pattern.
- Context providers memoize their value objects and expose a `use<Name>` hook.
  Unless a documented test fallback is intentional, hooks throw a clear error
  when used outside their provider.
- Create contexts with `createContext<T | null>(null)` and read them with
  React's `use()` API.
- Never hard-code user-facing strings. Use `useTranslation()` and message keys,
  with `t(key, params)` for interpolation.
- Show recoverable errors with `useAlert().showAlert(t('...'), 'error')` rather
  than throwing them to the user.
