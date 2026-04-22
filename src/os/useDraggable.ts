'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useWM } from './store'
import { detectSnapRegion, snapPreviewRect, SNAP_EDGE } from './snap'
import type { SnapRegion, WindowState } from './types'

const TASKBAR_H = 40

export function useDraggable(win: WindowState) {
  const handleRef = useRef<HTMLDivElement | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const dragState = useRef<{
    pointerId: number
    startX: number
    startY: number
    origX: number
    origY: number
    pendingSnap: SnapRegion | null
    moved: boolean
  } | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return
    const target = e.target as HTMLElement
    if (target.closest('[data-no-drag]')) return
    const el = handleRef.current
    if (!el) return
    el.setPointerCapture(e.pointerId)
    dragState.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: win.x,
      origY: win.y,
      pendingSnap: null,
      moved: false
    }
    el.classList.add('dragging')
  }, [win.x, win.y])

  useEffect(() => {
    const el = handleRef.current
    if (!el) return

    const onMove = (e: PointerEvent) => {
      const s = dragState.current
      if (!s || e.pointerId !== s.pointerId) return
      const dx = e.clientX - s.startX
      const dy = e.clientY - s.startY
      if (!s.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return
      s.moved = true

      const vw = window.innerWidth
      const vh = window.innerHeight - TASKBAR_H
      const nx = Math.max(-win.width + 120, Math.min(s.origX + dx, vw - 120))
      const ny = Math.max(0, Math.min(s.origY + dy, vh - 40))

      if (win.maximized || win.snapped) {
        useWM.getState().setBounds(win.id, { x: nx, y: ny })
      } else {
        useWM.getState().setBounds(win.id, { x: nx, y: ny })
      }

      const region = detectSnapRegion(e.clientX, e.clientY, vw, vh)
      s.pendingSnap = region
      const preview = previewRef.current
      if (preview) {
        if (region) {
          const r = snapPreviewRect(region, vw, vh)
          preview.style.display = 'block'
          preview.style.left = `${r.left}px`
          preview.style.top = `${r.top}px`
          preview.style.width = `${r.width}px`
          preview.style.height = `${r.height}px`
        } else {
          preview.style.display = 'none'
        }
      }
    }

    const onUp = (e: PointerEvent) => {
      const s = dragState.current
      if (!s || e.pointerId !== s.pointerId) return
      el.releasePointerCapture?.(e.pointerId)
      el.classList.remove('dragging')
      const preview = previewRef.current
      if (preview) preview.style.display = 'none'
      if (s.pendingSnap) {
        useWM.getState().snap(win.id, s.pendingSnap)
      }
      dragState.current = null
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [win.id, win.width, win.maximized, win.snapped])

  return { handleRef, previewRef, onPointerDown }
}
