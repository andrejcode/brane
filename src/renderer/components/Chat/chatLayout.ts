interface BottomOverlayInsetInput {
  bottomEdge: number
  clearance: number
  fadeTop?: number
  overlayTop: number
}

export function computeBottomOverlayInset({
  bottomEdge,
  clearance,
  fadeTop,
  overlayTop,
}: BottomOverlayInsetInput) {
  const visualTop = Math.min(overlayTop, fadeTop ?? overlayTop)

  return bottomEdge - visualTop + clearance
}
