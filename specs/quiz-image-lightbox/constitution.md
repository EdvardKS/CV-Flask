# Constitution — Visor de imágenes del quiz (lightbox con zoom)

Principios inamovibles.

- **Aplica a toda imagen de pregunta.** El visor envuelve el campo `image` que renderiza
  [QuestionBody](../../src/components/quiz/question/QuestionBody.tsx); sirve a cualquier
  asignatura (no solo Sistemas Digitales). Ver [[../sistemas-digitales/implementation]] y
  [[../quiz/core]].
- **Aditivo y sin regresión.** Una pregunta sin `image` no cambia. El visor no altera el
  scoring, la sesión ni el layout de la tarjeta más allá de la miniatura.
- **Lógica pura separada de la UI.** La matemática de zoom/paneo vive en un módulo sin DOM
  (`image/zoom.ts`), testeable de forma aislada. El componente solo cablea eventos.
- **Accesible y cerrable.** El visor es un `role="dialog"` modal, cerrable por teclado (Esc),
  botón ✕ y clic en el fondo. La miniatura es un `button` con etiqueta.
- **Sin dependencias nuevas.** Se usa solo React + Pointer Events del navegador. Nada de
  librerías de lightbox/gestos externas.
