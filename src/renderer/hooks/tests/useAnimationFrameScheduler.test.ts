import { act, renderHook } from '@testing-library/react'
import { useAnimationFrameScheduler } from '../useAnimationFrameScheduler'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useAnimationFrameScheduler', () => {
  it('coalesces repeated schedules into one callback', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useAnimationFrameScheduler(callback))

    act(() => {
      result.current()
      result.current()
    })

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.runAllTimers()
    })

    expect(callback).toHaveBeenCalledOnce()
  })

  it('cancels a scheduled callback on unmount', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() =>
      useAnimationFrameScheduler(callback),
    )

    act(() => result.current())
    unmount()

    act(() => {
      vi.runAllTimers()
    })

    expect(callback).not.toHaveBeenCalled()
  })
})
