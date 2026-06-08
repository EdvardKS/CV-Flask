/**
 * Matemática pura de zoom/paneo para el visor de imágenes (ZoomableImage).
 * Sin DOM: testeable de forma aislada (ver zoom.test.ts).
 *
 * Modelo de transformación: la imagen se pinta con `translate(tx,ty) scale(s)`
 * aplicado respecto al centro del contenedor. Las coordenadas de puntero (px,py)
 * que se pasan a `zoomAtPoint` son relativas al centro del contenedor
 * (0,0 = centro), de modo que el punto bajo el cursor permanece fijo al hacer zoom.
 */

export type Transform = { scale: number; tx: number; ty: number }

export const MIN_SCALE = 1
export const MAX_SCALE = 8

export const IDENTITY: Transform = { scale: 1, tx: 0, ty: 0 }

export function clampScale(scale: number, min = MIN_SCALE, max = MAX_SCALE): number {
  if (Number.isNaN(scale)) return min
  return Math.min(max, Math.max(min, scale))
}

/** Factor de zoom a partir del deltaY de la rueda (deltaY<0 = acercar). */
export function wheelFactor(deltaY: number, intensity = 0.0015): number {
  return Math.exp(-deltaY * intensity)
}

/**
 * Aplica un factor de zoom manteniendo fijo el punto (px,py) — coords relativas
 * al centro del contenedor. Devuelve la nueva transformación clamada.
 */
export function zoomAtPoint(t: Transform, factor: number, px: number, py: number, min = MIN_SCALE, max = MAX_SCALE): Transform {
  const target = clampScale(t.scale * factor, min, max)
  const ratio = target / t.scale
  // El punto bajo el cursor en coords de imagen debe seguir bajo el cursor:
  //   px = tx + ix*scale  ⇒  ix = (px - tx)/scale ; nuevo tx = px - ix*target
  const tx = px - (px - t.tx) * ratio
  const ty = py - (py - t.ty) * ratio
  return { scale: target, tx, ty }
}

/** Suma un desplazamiento de paneo (drag). */
export function pan(t: Transform, dx: number, dy: number): Transform {
  return { scale: t.scale, tx: t.tx + dx, ty: t.ty + dy }
}

/**
 * Limita el paneo para que la imagen no se aleje del borde más allá de su
 * sobrante al escalar. A scale=1 fuerza (0,0): la imagen queda centrada. Los
 * límites se dan en píxeles (semianchura/semialtura del contenedor).
 */
export function clampPan(t: Transform, halfW: number, halfH: number): Transform {
  const scale = clampScale(t.scale)
  const maxX = halfW * (scale - 1)
  const maxY = halfH * (scale - 1)
  return {
    scale,
    tx: Math.min(maxX, Math.max(-maxX, t.tx)) + 0,
    ty: Math.min(maxY, Math.max(-maxY, t.ty)) + 0
  }
}

/** Distancia euclídea entre dos punteros (para pellizco/pinch). */
export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Punto medio entre dos punteros. */
export function midpoint(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}
