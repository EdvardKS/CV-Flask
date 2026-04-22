'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useWM } from './store'
import type { WindowState } from './types'

type Dir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const MIN_W = 320
const MIN_H = 200
const TASKBAR_H = 40

export function useResizable(win: WindowState) {
  const stateRef = useRef<{
    pointerId: number
    dir: Dir
    startX: number
    startY: number
    origX: number
    origY: number
    origW: number
    origH: number
    target: HTMLElement
  } | null>(null)

  const onPointerDown = useCallback((dir: Dir) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return
    e.stopPropagation()
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    stateRef.current = {
      pointerId: e.pointerId,
      dir,
      startX: e.clientX,
      startY: e.clientY,
      origX: win.x,
      origY: win.y,
      origW: win.width,
      origH: win.height,
      target
    }
  }, [win.x, win.y, win.width, win.height])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const s = stateRef.current
      if (!s || e.pointerId !== s.pointerId) return
      const dx = e.clientX - s.startX
      const dy = e.clientY - s.startY
      let { origX: x, origY: y, origW: w, origH: h } = s
      const vw = window.innerWidth
      const vh = window.innerHeight - TASKBAR_H

      if (s.dir.includes('e')) w = Math.max(MIN_W, Math.min(s.origW + dx, vw - x))
      if (s.dir.includes('s')) h = Math.max(MIN_H, Math.min(s.origH + dy, vh - y))
      if (s.dir.includes('w')) {
        const newW = Math.max(MIN_W, s.origW - dx)
        x = s.origX + (s.origW - newW)
        w = newW
      }
      if (s.dir.includes('n')) {
        const newH = Math.max(MIN_H, s.origH - dy)
        y = Math.max(0, s.origY + (s.origH - newH))
        h = newH
      }
      useWM.getState().setBounds(win.id, { x, y, width: w, height: h })
    }
    const onUp = (e: PointerEvent) => {
      const s = stateRef.current
      if (!s || e.pointerId !== s.pointerId) return
      s.target.releasePointerCapture?.(e.pointerId)
      stateRef.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [win.id])

  return { onPointerDown }
}
