# TDD — Visor de imágenes del quiz

Desarrollo dirigido por tests bajo [constitution.md](constitution.md), decisiones de
[clarify.md](clarify.md), diseño en [plan.md](plan.md). Checklist en [tasks.md](tasks.md).

## Suite

| Archivo | Nivel | Qué bloquea |
|---------|-------|-------------|
| [src/components/quiz/image/__tests__/zoom.test.ts](../../src/components/quiz/image/__tests__/zoom.test.ts) | Lógica (node) | Matemática de zoom/paneo: límites, zoom hacia el cursor, clamp de paneo, distancia/punto medio. |
| [src/components/quiz/image/__tests__/ZoomableImage.test.tsx](../../src/components/quiz/image/__tests__/ZoomableImage.test.tsx) | Componente (jsdom) | Miniatura accesible; abrir/cerrar el visor por ✕ y Esc. |

## Ciclos

### Ciclo 1 — escala acotada

- **RED.** `clampScale` debe forzar `[1, 8]`; `wheelFactor` acercar con `deltaY<0` y alejar
  con `deltaY>0`. Falla sin la función.
- **GREEN.** `clampScale` con `Math.min/max`; `wheelFactor = exp(-deltaY·k)`.

### Ciclo 2 — zoom hacia el cursor (invariante clave)

- **RED.** `zoomAtPoint(IDENTITY, 2, px, py)` debe dejar el punto `(px,py)` sobre la misma
  coordenada de imagen antes y después (el contenido bajo el cursor no «salta»). Además
  clampa la escala a `MAX`/`MIN` ante factores extremos.
- **GREEN.** `tx = px − (px − tx)·ratio` (y análogo en Y), con `ratio = targetScale/scale`.
- **REFACTOR.** `zoomAtPoint`/`pan` quedan puros (solo clampan escala); el clamp de paneo se
  hace aparte en `clampPan` con las dimensiones reales → testeable sin DOM.

### Ciclo 3 — paneo acotado

- **RED.** `clampPan` debe centrar `(0,0)` a `scale=1` y limitar el desplazamiento a
  `half·(scale−1)` por eje. Falla (deja salir la imagen de la vista).
- **GREEN.** clamp simétrico por eje; normalización `+0` para no emitir `-0`.

### Ciclo 4 — apertura/cierre del visor

- **RED.** Render de `ZoomableImage`: existe miniatura `button` «Ampliar imagen» y **no** hay
  `dialog`. Tras hacer clic aparece el `dialog` con controles «Acercar»/«Cerrar». Cerrar por
  ✕ y por Esc retira el `dialog`. Falla sin el componente.
- **GREEN.** Estado `open`, `Lightbox` por `createPortal`, listener de `keydown` Escape.
- **REFACTOR (infra).** `@vitejs/plugin-react` en `vitest.config.ts` para JSX automático en
  tests `.tsx` (antes fallaban con «React is not defined»).

## Resultado

`pnpm test` → **51/51** (14 ficheros) · `pnpm typecheck` verde. Umbral 100% alcanzado.
