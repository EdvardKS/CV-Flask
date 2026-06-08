# Tasks — Visor de imágenes del quiz

**Estado:** IMPLEMENTADO. Feature SDD+TDD.

## Implementación

- [x] `image/zoom.ts`: matemática pura (clampScale, wheelFactor, zoomAtPoint, pan, clampPan, distance, midpoint).
- [x] `image/ZoomableImage.tsx`: miniatura `button` + `Lightbox` por portal con rueda, paneo, pinch, doble clic, Esc/✕/fondo.
- [x] `QuestionBody.tsx`: usa `<ZoomableImage>` en lugar del `<img>` plano.

## Tests (TDD)

- [x] `image/__tests__/zoom.test.ts` (matemática).
- [x] `image/__tests__/ZoomableImage.test.tsx` (abrir/cerrar).
- [x] `@vitejs/plugin-react` en `vitest.config.ts` (JSX automático en `.tsx`).

## Verificación

- [x] `pnpm typecheck` verde.
- [x] `pnpm test` verde (51/51, 14 ficheros).
- [ ] Comprobación manual en navegador y en móvil (pinch).

## Pendiente / futuro

- [ ] Soporte de varias imágenes por pregunta (galería) si algún día `image` pasa a array.
- [ ] Reusar `ZoomableImage` en el visor de conceptos de Redes.
