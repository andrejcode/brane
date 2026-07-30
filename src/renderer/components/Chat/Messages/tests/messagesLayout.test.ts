import {
  clamp,
  computeScrollbarMetrics,
  computeTailBottomInset,
} from '../messagesLayout'

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
    headerHeight: 48,
    bottomInset: 0,
    minimumThumbHeight: 20,
    thumbScale: 0.85,
  }

  it('is hidden when content fits (no overflow)', () => {
    const metrics = computeScrollbarMetrics({
      ...base,
      scrollHeight: 800,
      clientHeight: 1000,
      scrollTop: 0,
    })

    expect(metrics).toEqual({ isVisible: false })
  })

  it('is hidden when the track has no height', () => {
    const metrics = computeScrollbarMetrics({
      ...base,
      scrollHeight: 2000,
      clientHeight: 40,
      scrollTop: 0,
    })

    expect(metrics).toEqual({ isVisible: false })
  })

  it('computes a proportional thumb scaled down by thumbScale', () => {
    const metrics = computeScrollbarMetrics({
      ...base,
      scrollHeight: 2000,
      clientHeight: 1000,
      scrollTop: 500,
    })

    // trackHeight 952, proportional 476, * 0.85 = 404.6
    expect(metrics.isVisible).toBe(true)
    if (!metrics.isVisible) {
      return
    }
    expect(metrics.thumbHeight).toBeCloseTo(404.6, 5)
    // maxThumbTop = 952 - 404.6 = 547.4, scrollTop ratio 0.5
    expect(metrics.thumbTop).toBeCloseTo(273.7, 5)
  })

  it('never shrinks the thumb below the minimum height', () => {
    const metrics = computeScrollbarMetrics({
      ...base,
      scrollHeight: 100000,
      clientHeight: 1000,
      scrollTop: 0,
    })

    expect(metrics.isVisible).toBe(true)
    if (!metrics.isVisible) {
      return
    }
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
    if (!metrics.isVisible) {
      return
    }
    expect(metrics.thumbTop).toBeCloseTo(952 - metrics.thumbHeight, 5)
  })

  it('shortens the track by the bottom inset so it ends at the composer top', () => {
    const metrics = computeScrollbarMetrics({
      ...base,
      scrollHeight: 2000,
      clientHeight: 1000,
      scrollTop: 1000,
      bottomInset: 200,
    })

    expect(metrics.isVisible).toBe(true)
    if (!metrics.isVisible) {
      return
    }
    // trackHeight 1000 - 48 - 200 = 752; thumb bottoms out at trackHeight - thumbHeight
    expect(metrics.thumbTop).toBeCloseTo(752 - metrics.thumbHeight, 5)
  })
})

describe('computeTailBottomInset', () => {
  it('fills the space the tail does not occupy below the header', () => {
    expect(
      computeTailBottomInset({
        clientHeight: 1000,
        headerHeight: 48,
        tailHeight: 200,
      }),
    ).toBe(752)
  })

  it('never returns a negative inset when the tail is taller than the viewport', () => {
    expect(
      computeTailBottomInset({
        clientHeight: 1000,
        headerHeight: 48,
        tailHeight: 5000,
      }),
    ).toBe(0)
  })
})
