# Clarify — Sistemas Digitales

Decisiones confirmadas con el usuario (2026-06-08).

| Tema | Decisión |
|------|----------|
| Material de origen | `simulacro_examen.html` (776 KB, 12 problemas resueltos P1–P12 + 8 anexos teóricos A–H, 13 imágenes JPEG embebidas) y `guia_escritura.html` (65 KB, guía de escritura, sin imágenes). Ambos de Sistemas Digitales. |
| Imágenes en el test | **Soporte fiel.** Se añade campo `image` opcional al schema del quiz y se renderiza en la tarjeta. Las 12 preguntas conservan su figura (tabla de verdad, K-map, circuito, cronograma). Cambio aditivo en el core. |
| Acceso a los HTML | **Enlace en pestaña nueva.** Los dos HTML se publican estáticos en `/public` y la asignatura muestra botones que los abren con `target="_blank"`. **No** hub, **no** iframe. |
| Cuántas preguntas | Las **12** del simulacro (P1–P12). P8 tiene 2 imágenes. |
| Categoría | `simulacro-examen` para las 12 (filtrable como un bloque), `cuatrimestre: 2`. |
| Opciones | 4 por pregunta (a–d). Texto reconstruido del enunciado/prosa del documento; la figura acompaña como `image`. La opción correcta es la del panel «Respuesta correcta» del HTML. |
| Explicación | Se vuelca la justificación del documento en `evidence` (y/o `context`). |
| Assets | Las 13 imágenes JPEG embebidas se extraen a ficheros en `assets/` (no base64 inline en el JSON, para no inflar el banco). |
| Persistencia | El campo `image` se mapea a una **columna** nueva en `quiz_questions` (la capa es column-mapped, no guarda JSON arbitrario). Migración aditiva `ALTER TABLE ADD COLUMN`. |
| Material externo (links) | Campo `materials` opcional en metadatos de asignatura, persistido como columna `materials_json`. Reusable por cualquier asignatura. |

## Fuera de alcance

- Reescribir o «appificar» los HTML de estudio (se sirven tal cual).
- Convertir los anexos teóricos A–H en preguntas (solo P1–P12).
- Tocar la app legacy `src/apps/quiz/*` (schema propio).
- OCR de las imágenes: el texto de opciones se reconstruye de la prosa del documento.
