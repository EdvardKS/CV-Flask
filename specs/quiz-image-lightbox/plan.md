# Plan — Visor de imágenes del quiz

## Componentes

| Archivo | Rol |
|---------|-----|
| [src/components/quiz/image/zoom.ts](../../src/components/quiz/image/zoom.ts) | Matemática pura sin DOM: `clampScale`, `wheelFactor`, `zoomAtPoint` (zoom hacia el cursor), `pan`, `clampPan`, `distance`, `midpoint`. |
| [src/components/quiz/image/ZoomableImage.tsx](../../src/components/quiz/image/ZoomableImage.tsx) | Miniatura `button` + `Lightbox` (portal a `document.body`) con los gestos cableados. |
| [src/components/quiz/question/QuestionBody.tsx](../../src/components/quiz/question/QuestionBody.tsx) | Sustituye el `<img>` plano por `<ZoomableImage>`. |

## Interacción (cableado en `Lightbox`)

- `onWheel` → `zoomAtPoint(t, wheelFactor(deltaY), cursor)` (preventDefault).
- Pointer Events (mouse+touch unificados): mapa de punteros activos.
  - 1 puntero → `pan` por delta.
  - 2 punteros → pinch: factor = ratio de distancias respecto al inicio; zoom en el punto medio.
- `onDoubleClick` → alterna 1x ↔ 2.5x.
- `onContextMenu` → `preventDefault` (permite arrastre con botón derecho).
- Esc / ✕ / clic en fondo → cerrar. `body.overflow=hidden` mientras está abierto.
- Toda transformación pasa por `clampPan(next, halfW, halfH)` con las semidimensiones del escenario.

## Transformación

CSS `transform: translate(tx px, ty px) scale(s)` con `transform-origin: center`, sobre una
imagen centrada por flexbox. Coordenadas de puntero convertidas a px relativos al centro del
escenario, de modo que `zoomAtPoint` mantiene fijo el punto bajo el cursor.

## Config de test

`@vitejs/plugin-react` añadido a [vitest.config.ts](../../vitest.config.ts) para habilitar el
runtime JSX automático en los tests de componente (`.tsx`).

## Verificación

- `pnpm typecheck` verde.
- `pnpm test` verde, incluyendo la suite nueva (ver [tdd.md](tdd.md)).
- Manual: clic en figura de una pregunta de Sistemas Digitales → zoom con rueda, paneo
  arrastrando, pinch en móvil, cierre con Esc/✕/fondo.

## No-regresión

- Preguntas sin `image` intactas. Resto del quiz (sesión, scoring, otras tarjetas) sin cambios.
- Sin dependencias nuevas en runtime (solo devDep de test ya presente).
