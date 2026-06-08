# Clarify — Visor de imágenes del quiz

Petición del usuario (2026-06-08): «al hacer click en una imagen la hace más grande y
podemos acercar y alejar y mover con la rueda del ratón y el click derecho; o con los dedos
en el móvil».

| Tema | Decisión |
|------|----------|
| Disparador | Clic en la miniatura de la figura → abre visor a pantalla completa. |
| Zoom escritorio | Rueda del ratón hacia el cursor (acercar/alejar). Botones +/−/⟲ también. |
| Paneo escritorio | Arrastrar con el puntero (clic izquierdo **o** derecho). Se suprime el menú contextual dentro del visor para permitir arrastre con botón derecho. |
| Móvil | Pellizco (pinch, 2 dedos) para zoom; 1 dedo para mover. Vía Pointer Events unificados. |
| Atajos extra | Doble clic / doble toque alterna 1x ↔ 2.5x hacia el punto pulsado. |
| Cerrar | Esc, botón ✕, o clic en el fondo oscuro. |
| Límites | Escala en `[1, 8]`. Paneo clamado al sobrante de la imagen (no se va de la vista). A 1x queda centrada. |
| Alcance | Imágenes de pregunta del flujo Next.js (`QuestionBody`). No toca el visor PDF de conceptos (Redes), que ya tiene su propio render. |

## Fuera de alcance

- Rotar, descargar o anotar la imagen.
- Galería/varias imágenes por pregunta (hoy `image` es una sola URL).
- Lightbox para imágenes fuera del quiz.
