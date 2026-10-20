import { renderHook } from '@testing-library/react'
import { useResizeObserver } from '../useResizeObserver'

describe('useResizeObserver', () => {
  const observe = vi.fn()
  const disconnect = vi.fn()
  const createObserver = vi.fn()

  beforeEach(() => {
    observe.mockClear()
    disconnect.mockClear()
    createObserver.mockClear()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = observe
        disconnect = disconnect

        constructor(callback: ResizeObserverCallback) {
          createObserver(callback)
        }
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('observes available targets and forwards resize notifications', () => {
    const firstTarget = document.createElement('div')
    const secondTarget = document.createElement('div')
    const getTargets = () => [firstTarget, null, secondTarget, undefined]
    const onResize = vi.fn()
    renderHook(() => useResizeObserver({ getTargets, onResize }))

    expect(observe).toHaveBeenCalledTimes(2)
    expect(observe).toHaveBeenCalledWith(firstTarget)
    expect(observe).toHaveBeenCalledWith(secondTarget)
    expect(onResize).not.toHaveBeenCalled()

    const callback = createObserver.mock.calls[0]?.[0] as ResizeObserverCallback
    callback([], {} as ResizeObserver)

    expect(onResize).toHaveBeenCalledOnce()
  })

  it('does not create an observer without targets', () => {
    renderHook(() =>
      useResizeObserver({ getTargets: () => [null], onResize: vi.fn() }),
    )

    expect(createObserver).not.toHaveBeenCalled()
  })

  it('keeps the observer for stable inputs and disconnects on unmount', () => {
    const getTargets = () => [document.body]
    const onResize = vi.fn()
    const { rerender, unmount } = renderHook(() =>
      useResizeObserver({ getTargets, onResize }),
    )

    rerender()

    expect(createObserver).toHaveBeenCalledOnce()
    expect(disconnect).not.toHaveBeenCalled()

    unmount()

    expect(disconnect).toHaveBeenCalledOnce()
  })

  it('reconnects when the targets or callback change', () => {
    const firstTarget = document.createElement('div')
    const secondTarget = document.createElement('div')
    const onResize = vi.fn()
    const { rerender } = renderHook((options) => useResizeObserver(options), {
      initialProps: { getTargets: () => [firstTarget], onResize },
    })

    const getTargets = () => [secondTarget]
    rerender({ getTargets, onResize })

    expect(disconnect).toHaveBeenCalledTimes(1)
    expect(observe).toHaveBeenLastCalledWith(secondTarget)

    const nextOnResize = vi.fn()
    rerender({ getTargets, onResize: nextOnResize })

    expect(disconnect).toHaveBeenCalledTimes(2)
    expect(createObserver).toHaveBeenLastCalledWith(nextOnResize)
  })
})
