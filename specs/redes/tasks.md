# Tasks — Redes

## Áreas de trabajo (alto nivel)

- Seed y metadatos de `redes`.
- Loader server-only para manifests de Redes.
- Hub de modos y rutas específicas.
- Selector de cuestionarios y sesión por quiz.
- Viewer de conceptos con PDF, highlights y botón de IA.
- APIs espejo para summary, temario y conceptos.
- Tests de regresión del manifiesto de Redes.

## Checklist

- [x] Generar `public/data/quiz/redes.json` con el banco plano inicial.
- [x] Generar `public/data/quiz/redes/temario.json`.
- [x] Generar `public/data/quiz/redes/concepts.json`.
- [x] Copiar PDFs teóricos a `public/data/quiz/redes/assets`.
- [x] Añadir regenerador `scripts/generate_redes_data.py` con salida UTF-8.
- [x] Incorporar preguntas nuevas desde `temp/REDES/Nuevos`.
- [x] Generar cuestionarios de repaso apoyados en el contenido de las diapositivas.
- [ ] Incorporar futuros cuestionarios de autoevaluación cuando existan.
- [ ] Ampliar cuestionarios de temario con más PDFs cuando entren en `temp/REDES`.
- [ ] Refinar highlights por página si se quiere mayor precisión visual.
