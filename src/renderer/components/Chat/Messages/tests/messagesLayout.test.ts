import { computeTailBottomInset } from '../messagesLayout'

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
