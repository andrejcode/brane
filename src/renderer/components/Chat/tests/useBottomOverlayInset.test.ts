import { act, renderHook } from '@testing-library/react'
import { useLayoutEffect } from 'react'
import { useBottomOverlayInset } from '../useBottomOverlayInset'

function renderInsetHook(isEmpty = true) {
  const overlay = document.createElement('div')
  const fade = document.createElement('div')
  const overlayBounds = vi
    .spyOn(overlay, 'getBoundingClientRect')
    .mockReturnValue(new DOMRect(0, window.innerHeight - 100, 200, 100))
  const fadeBounds = vi
    .spyOn(fade, 'getBoundingClientRect')
    .mockReturnValue(new DOMRect(0, window.innerHeight - 140, 200, 140))

  const hook = renderHook(
    ({ isEmpty }) => {
      const result = useBottomOverlayInset({ isEmpty })
      const { bottomOverlayRef, bottomFadeRef } = result

      useLayoutEffect(() => {
        bottomOverlayRef.current = overlay
        bottomFadeRef.current = fade
      }, [bottomOverlayRef, bottomFadeRef])

      return result
    },
    { initialProps: { isEmpty } },
  )

  return { ...hook, overlay, fade, overlayBounds, fadeBounds }
}

describe('useBottomOverlayInset', () => {
  const observe = vi.fn()
  const disconnect = vi.fn()
  let notifyResize: ResizeObserverCallback | undefined

  beforeEach(() => {
    vi.useFakeTimers()
    observe.mockClear()
    disconnect.mockClear()
    notifyResize = undefined
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = observe
        disconnect = disconnect

        constructor(callback: ResizeObserverCallback) {
          notifyResize = callback
        }
      },
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('observes both elements and measures on the initial frame', async () => {
    const { result, overlay, fade } = renderInsetHook()

    expect(observe).toHaveBeenCalledWith(overlay)
    expect(observe).toHaveBeenCalledWith(fade)
    expect(result.current.bottomOverlayInset).toBe(0)

    await act(() => vi.advanceTimersToNextFrame())

    expect(result.current.bottomOverlayInset).toBe(152)
  })

  it('remeasures when the observer reports a resize', async () => {
    const { result, fadeBounds } = renderInsetHook()
    await act(() => vi.advanceTimersToNextFrame())
    fadeBounds.mockReturnValue(
      new DOMRect(0, window.innerHeight - 180, 200, 180),
    )

    act(() => notifyResize?.([], {} as ResizeObserver))

    expect(result.current.bottomOverlayInset).toBe(192)
  })

  it('tracks composer movement during docking and stops after the transition', async () => {
    const { result, rerender, overlayBounds, fadeBounds } = renderInsetHook()
    await act(() => vi.advanceTimersToNextFrame())
    overlayBounds.mockClear()
    rerender({ isEmpty: false })
    fadeBounds.mockReturnValue(
      new DOMRect(0, window.innerHeight - 200, 200, 200),
    )

    await act(() => vi.advanceTimersToNextFrame())

    expect(result.current.bottomOverlayInset).toBe(212)

    await act(() => vi.advanceTimersByTime(650))
    const measurementCount = overlayBounds.mock.calls.length

    expect(measurementCount).toBeGreaterThan(1)
    await act(() => vi.advanceTimersByTime(100))
    expect(overlayBounds).toHaveBeenCalledTimes(measurementCount)
  })

  it('disconnects and cancels pending frames on unmount', async () => {
    const { unmount, overlayBounds } = renderInsetHook(false)

    unmount()
    await act(() => vi.runAllTimers())

    expect(disconnect).toHaveBeenCalledOnce()
    expect(overlayBounds).not.toHaveBeenCalled()
  })
})
