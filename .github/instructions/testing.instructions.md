---
applyTo: 'src/**/*.{test,spec}.{ts,tsx}'
---

# Testing Instructions

- Use Vitest globals without importing `describe`, `it`, or `expect`. Tests use
  the `jsdom` environment, with missing browser APIs stubbed in
  `src/test/setup.ts`.
- Co-locate tests in a `tests/` directory beside the code and name them
  `*.test.ts` or `*.test.tsx`.
- Test through public interfaces and assert user-visible behavior instead of
  implementation details.
- For components, use `@testing-library/react` and
  `@testing-library/user-event`. Query by accessible role and name, never by
  test IDs or CSS classes. Cleanup runs automatically after each test.
- Components that use `window.electronApi` install the fake bridge with
  `installMockElectronApi(options)` from `@test/electronApi`. Drive callbacks
  with the returned emit helpers and call `clearMockElectronApi()` when a test
  mutates the global bridge.
- Unit-test pure main-process logic directly. Keep it free of Electron
  singletons so it remains testable.
