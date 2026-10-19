import { computeBottomOverlayInset } from '../chatLayout'

describe('computeBottomOverlayInset', () => {
  it('keeps clearance above an expanded composer', () => {
    expect(
      computeBottomOverlayInset({
        bottomEdge: 800,
        clearance: 12,
        fadeTop: 700,
        overlayTop: 600,
      }),
    ).toBe(212)
  })

  it('includes the fade when it extends above the composer', () => {
    expect(
      computeBottomOverlayInset({
        bottomEdge: 800,
        clearance: 12,
        fadeTop: 700,
        overlayTop: 720,
      }),
    ).toBe(112)
  })
})
