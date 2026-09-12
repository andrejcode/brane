import { clamp, computeScrollbarMetrics } from '../scrollAreaLayout'

describe('clamp', () => {
  it('returns the value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps below the minimum and above the maximum', () => {
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(42, 0, 10)).toBe(10)
  })
})

describe('computeScrollbarMetrics', () => {
  const base = {
    headerInset: 48,
    bottomInset: 0,
    trackInset: 4,
    minimumThumbHeight: 20,
    thumbScale: 0.85,
  }

  it('is hidden when content fits', () => {
    expect(
      computeScrollbarMetrics({
        ...base,
        scrollHeight: 800,
        clientHeight: 1000,
        scrollTop: 0,
      }),
    ).toEqual({ isVisible: false })
  })

  it('is hidden when the track has no height', () => {
    expect(
      computeScrollbarMetrics({
        ...base,
        scrollHeight: 2000,
        clientHeight: 40,
        scrollTop: 0,
      }),
    ).toEqual({ isVisible: false })
  })

  it('computes proportional thumb geometry', () => {
    const metrics = computeScrollbarMetrics({
      ...base,
      scrollHeight: 2000,
      clientHeight: 1000,
      scrollTop: 500,
    })

    expect(metrics.isVisible).toBe(true)
    if (!metrics.isVisible) return

    expect(metrics.thumbHeight).toBeCloseTo(401.2, 5)
    expect(metrics.thumbTop).toBeCloseTo(271.4, 5)
  })

  it('never shrinks the thumb below the minimum height', () => {
    const metrics = computeScrollbarMetrics({
      ...base,
      scrollHeight: 100000,
      clientHeight: 1000,
      scrollTop: 0,
    })

    expect(metrics.isVisible).toBe(true)
    if (!metrics.isVisible) return

    expect(metrics.thumbHeight).toBe(20)
    expect(metrics.thumbTop).toBe(0)
  })

  it('places the thumb at the bottom when scrolled to the end', () => {
    const metrics = computeScrollbarMetrics({
      ...base,
      scrollHeight: 2000,
      clientHeight: 1000,
      scrollTop: 1000,
    })

    expect(metrics.isVisible).toBe(true)
    if (!metrics.isVisible) return

    expect(metrics.thumbTop).toBeCloseTo(944 - metrics.thumbHeight, 5)
  })

  it('shortens both ends of the track by the edge inset', () => {
    const metrics = computeScrollbarMetrics({
      ...base,
      headerInset: 0,
      scrollHeight: 2000,
      clientHeight: 1000,
      scrollTop: 1000,
    })

    expect(metrics.isVisible).toBe(true)
    if (!metrics.isVisible) return

    expect(metrics.thumbTop).toBeCloseTo(992 - metrics.thumbHeight, 5)
  })

  it('shortens the track by the bottom and edge insets', () => {
    const metrics = computeScrollbarMetrics({
      ...base,
      scrollHeight: 2000,
      clientHeight: 1000,
      scrollTop: 1000,
      bottomInset: 200,
    })

    expect(metrics.isVisible).toBe(true)
    if (!metrics.isVisible) return

    expect(metrics.thumbTop).toBeCloseTo(744 - metrics.thumbHeight, 5)
  })
})
