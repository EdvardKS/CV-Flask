'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  IDENTITY, MAX_SCALE, MIN_SCALE,
  clampPan, clampScale, distance, midpoint, pan, wheelFactor, zoomAtPoint,
  type Transform
} from './zoom'

type Props = {
  src: string
  alt?: string
  className?: string
}

/**
 * Miniatura que abre un visor a pantalla completa con zoom y paneo:
 * - Rueda del ratón: acercar/alejar (hacia el cursor).
 * - Arrastrar (clic izquierdo o derecho): mover.
 * - Móvil: pellizco para zoom, un dedo para mover.
 * - Doble clic / doble toque: alternar 1x ↔ 2.5x.
 * - Esc, botón ✕ o clic en el fondo: cerrar.
 */
export function ZoomableImage({ src, alt = 'Figura', className }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ampliar imagen"
        className={`group block w-full max-w-xl cursor-zoom-in overflow-hidden rounded-md border border-[var(--mq-qbodyBorder,#cfe2f5)] bg-white ${className ?? ''}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className="w-full transition group-hover:brightness-95" />
      </button>
      {open && <Lightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  )
}

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [t, setT] = useState<Transform>(IDENTITY)
  const stageRef = useRef<HTMLDivElement>(null)
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null)
  const tRef = useRef<Transform>(IDENTITY)
  tRef.current = t

  const bounds = useCallback(() => {
    const r = stageRef.current?.getBoundingClientRect()
    return { halfW: (r?.width ?? 0) / 2, halfH: (r?.height ?? 0) / 2, rect: r }
  }, [])

  // Punto del cursor relativo al centro del escenario (px).
  const toCenter = useCallback((clientX: number, clientY: number) => {
    const r = stageRef.current?.getBoundingClientRect()
    if (!r) return { x: 0, y: 0 }
    return { x: clientX - (r.left + r.width / 2), y: clientY - (r.top + r.height / 2) }
  }, [])

  const apply = useCallback((next: Transform) => {
    const { halfW, halfH } = bounds()
    setT(clampPan(next, halfW, halfH))
  }, [bounds])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const p = toCenter(e.clientX, e.clientY)
    apply(zoomAtPoint(tRef.current, wheelFactor(e.deltaY), p.x, p.y))
  }

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinchStart.current = { dist: distance(a, b), scale: tRef.current.scale }
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const curr = { x: e.clientX, y: e.clientY }
    pointers.current.set(e.pointerId, curr)

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()]
      const factor = (distance(a, b) / pinchStart.current.dist) * (pinchStart.current.scale / tRef.current.scale)
      const mid = midpoint(a, b)
      const c = toCenter(mid.x, mid.y)
      apply(zoomAtPoint(tRef.current, factor, c.x, c.y))
      return
    }
    // un puntero: paneo
    apply(pan(tRef.current, curr.x - prev.x, curr.y - prev.y))
  }

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchStart.current = null
  }

  const toggleZoom = (e: React.MouseEvent) => {
    const p = toCenter(e.clientX, e.clientY)
    const factor = tRef.current.scale > MIN_SCALE ? MIN_SCALE / tRef.current.scale : 2.5
    apply(zoomAtPoint(tRef.current, factor, p.x, p.y))
  }

  const zoomBy = (factor: number) => apply(zoomAtPoint(tRef.current, factor, 0, 0))
  const reset = () => setT(IDENTITY)
  const zoomed = t.scale > MIN_SCALE

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-center justify-end gap-2 p-3" onClick={e => e.stopPropagation()}>
        <button type="button" onClick={() => zoomBy(1 / 1.4)} aria-label="Alejar" className={ctrlClass} disabled={t.scale <= MIN_SCALE}>−</button>
        <span className="min-w-[3ch] text-center text-sm font-semibold text-white/90 tabular-nums">{Math.round(t.scale * 100)}%</span>
        <button type="button" onClick={() => zoomBy(1.4)} aria-label="Acercar" className={ctrlClass} disabled={t.scale >= MAX_SCALE}>+</button>
        <button type="button" onClick={reset} aria-label="Restablecer zoom" className={ctrlClass} disabled={!zoomed}>⟲</button>
        <button type="button" onClick={onClose} aria-label="Cerrar" className={ctrlClass}>✕</button>
      </div>
      <div
        ref={stageRef}
        className="flex flex-1 touch-none items-center justify-center overflow-hidden"
        style={{ cursor: zoomed ? 'grab' : 'zoom-in' }}
        onClick={e => e.stopPropagation()}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={toggleZoom}
        onContextMenu={e => e.preventDefault()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="pointer-events-none max-h-full max-w-full select-none"
          style={{ transform: `translate(${t.tx}px, ${t.ty}px) scale(${t.scale})`, transformOrigin: 'center' }}
        />
      </div>
      <p className="pointer-events-none pb-3 text-center text-xs text-white/60" onClick={e => e.stopPropagation()}>
        Rueda o pellizco para zoom · arrastra para mover · doble clic para alternar · Esc para cerrar
      </p>
    </div>,
    document.body
  )
}

const ctrlClass = 'flex h-9 min-w-9 items-center justify-center rounded-md border border-white/25 bg-white/10 px-2 text-lg font-bold text-white transition hover:bg-white/20 disabled:opacity-30'
