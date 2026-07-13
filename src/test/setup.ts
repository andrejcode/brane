import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom has no layout engine, so ResizeObserver is missing. Components only use
// it to react to size changes, which never happen under jsdom, so a no-op stub
// is enough to let them mount.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub)

// jsdom doesn't implement matchMedia, which the color-scheme hook reads to pick
// syntax-highlighting themes. Default to light and expose no-op listeners.
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
}))

// jsdom has no layout engine and doesn't implement scrollTo, which the message
// list calls to bring a freshly sent message to the top. A no-op keeps that
// effect from throwing during tests.
Element.prototype.scrollTo = () => {}

afterEach(() => {
  cleanup()
})
