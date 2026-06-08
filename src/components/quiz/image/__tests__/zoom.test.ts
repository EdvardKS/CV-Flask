// @vitest-environment node
//
// TDD — visor de imágenes (ver specs/quiz-image-lightbox/tdd.md, ciclos 1-3).
// Matemática pura de zoom/paneo, sin DOM.
import { describe, expect, it } from 'vitest'
import {
  IDENTITY, MAX_SCALE, MIN_SCALE,
  clampPan, clampScale, distance, midpoint, pan, wheelFactor, zoomAtPoint
} from '../zoom'

describe('clampScale', () => {
  it('limita al rango [MIN, MAX]', () => {
    expect(clampScale(0.2)).toBe(MIN_SCALE)
    expect(clampScale(99)).toBe(MAX_SCALE)
    expect(clampScale(2)).toBe(2)
  })
})

describe('wheelFactor', () => {
  it('acerca con deltaY<0 y aleja con deltaY>0', () => {
    expect(wheelFactor(-100)).toBeGreaterThan(1)
    expect(wheelFactor(100)).toBeLessThan(1)
    expect(wheelFactor(0)).toBe(1)
  })
})

describe('zoomAtPoint', () => {
  it('mantiene fijo el punto bajo el cursor al hacer zoom', () => {
    const px = 10, py = -4
    const before = (px - IDENTITY.tx) / IDENTITY.scale
    const next = zoomAtPoint(IDENTITY, 2, px, py)
    expect(next.scale).toBe(2)
    const afterX = (px - next.tx) / next.scale
    const afterY = (py - next.ty) / next.scale
    expect(afterX).toBeCloseTo(before)
    expect(afterY).toBeCloseTo((py - IDENTITY.ty) / IDENTITY.scale)
    expect(next.tx).toBeCloseTo(-10)
  })

  it('clampa la escala al máximo aunque el factor sea enorme', () => {
    expect(zoomAtPoint(IDENTITY, 1000, 0, 0).scale).toBe(MAX_SCALE)
  })

  it('no baja de MIN_SCALE', () => {
    expect(zoomAtPoint(IDENTITY, 0.001, 0, 0).scale).toBe(MIN_SCALE)
  })
})

describe('pan', () => {
  it('suma el desplazamiento sin tocar la escala', () => {
    expect(pan({ scale: 2, tx: 5, ty: 5 }, 3, -2)).toEqual({ scale: 2, tx: 8, ty: 3 })
  })
})

describe('clampPan', () => {
  it('centra (0,0) cuando scale=1', () => {
    expect(clampPan({ scale: 1, tx: 50, ty: -30 }, 100, 80)).toEqual({ scale: 1, tx: 0, ty: 0 })
  })

  it('limita el paneo al sobrante (halfW*(scale-1))', () => {
    const r = clampPan({ scale: 2, tx: 250, ty: -250 }, 100, 80)
    expect(r.tx).toBe(100)   // maxX = 100 * (2-1)
    expect(r.ty).toBe(-80)   // maxY = 80 * (2-1)
  })
})

describe('distance / midpoint', () => {
  it('calcula distancia y punto medio entre dos punteros', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    expect(midpoint({ x: 0, y: 0 }, { x: 4, y: 8 })).toEqual({ x: 2, y: 4 })
  })
})
