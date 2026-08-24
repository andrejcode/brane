import { act, renderHook } from '@testing-library/react'
import { useJustCompleted } from '../useJustCompleted'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useJustCompleted', () => {
  it('starts out unset', () => {
    const { result } = renderHook(() => useJustCompleted())

    expect(result.current[0]).toBe(false)
  })

  it('reverts on its own after the delay', () => {
    const { result } = renderHook(() => useJustCompleted(500))

    act(() => result.current[1]())
    expect(result.current[0]).toBe(true)

    act(() => {
      vi.advanceTimersByTime(499)
    })
    expect(result.current[0]).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current[0]).toBe(false)
  })

  // Repeating the action should restart the window, not let an earlier timeout
  // cut the confirmation short.
  it('restarts the delay when the action repeats', () => {
    const { result } = renderHook(() => useJustCompleted(500))

    act(() => result.current[1]())
    act(() => {
      vi.advanceTimersByTime(400)
    })
    act(() => result.current[1]())
    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current[0]).toBe(true)
  })
})
