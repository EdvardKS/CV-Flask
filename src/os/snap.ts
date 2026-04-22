import type { SnapRegion } from './types'

export const SNAP_EDGE = 18

export function detectSnapRegion(x: number, y: number, vw: number, vh: number): SnapRegion | null {
  const nearLeft = x <= SNAP_EDGE
  const nearRight = x >= vw - SNAP_EDGE
  const nearTop = y <= SNAP_EDGE
  const nearBottom = y >= vh - SNAP_EDGE

  if (nearTop && nearLeft) return 'top-left'
  if (nearTop && nearRight) return 'top-right'
  if (nearBottom && nearLeft) return 'bottom-left'
  if (nearBottom && nearRight) return 'bottom-right'
  if (nearTop) return 'top'
  if (nearLeft) return 'left'
  if (nearRight) return 'right'
  return null
}

export function snapPreviewRect(region: SnapRegion, vw: number, vh: number) {
  const halfW = Math.floor(vw / 2)
  const halfH = Math.floor(vh / 2)
  switch (region) {
    case 'left':         return { left: 0,     top: 0,     width: halfW, height: vh }
    case 'right':        return { left: halfW, top: 0,     width: vw - halfW, height: vh }
    case 'top':          return { left: 0,     top: 0,     width: vw,    height: vh }
    case 'top-left':     return { left: 0,     top: 0,     width: halfW, height: halfH }
    case 'top-right':    return { left: halfW, top: 0,     width: vw - halfW, height: halfH }
    case 'bottom-left':  return { left: 0,     top: halfH, width: halfW, height: vh - halfH }
    case 'bottom-right': return { left: halfW, top: halfH, width: vw - halfW, height: vh - halfH }
  }
}
