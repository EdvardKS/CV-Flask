# Tasks — Sistemas Digitales

**Estado:** IMPLEMENTADO. Feature SDD (constitution → clarify → plan → tasks).

## Bloque 1 — campo `image` en preguntas

- [x] `types.ts`: `image?` en `baseFields`.
- [x] `schema.sql.ts`: columna `image TEXT` en `quiz_questions`.
- [x] `db.ts`: migración `ALTER TABLE quiz_questions ADD COLUMN image`.
- [x] `seed.ts`: `insertQuestion` incluye `image`.
- [x] `repo.ts`: `listQuestions` selecciona y mapea `image`.
- [x] `ChoiceQuestionCard.tsx` + `FillQuestionCard.tsx`: render de la imagen.

## Bloque 2 — material externo por asignatura

- [x] `types.ts`: `materials?` en `subjectMetaSchema` (+ `subjectMaterialSchema`).
- [x] `schema.sql.ts`: columna `materials_json TEXT` en `quiz_subjects`.
- [x] `db.ts`: migración `ADD COLUMN materials_json`.
- [x] `seed.ts`: `upsertSubject` persiste `materials_json`.
- [x] `repo.ts`: `listSubjects`/`getSubject` parsean `materials`.
- [x] `SubjectMaterials.tsx` (nuevo) + render en `app/quiz/[subject]/page.tsx`.

## Bloque 3 — contenido

- [x] Script `scripts/extract_sdig_simulacro.py` (13 imágenes + volcado por pregunta).
- [x] Script `scripts/build_sdig_questions.py` (12 MCQ + apilado de q8).
- [x] Publicar `simulacro-examen.html` y `guia-escritura.html` en `public/data/quiz/sistemas-digitales/`.
- [x] Extraer 13 imágenes a `assets/` (q8 apila q8a+q8b en q8.jpg).
- [x] Generar las 12 MCQ y anexarlas a `sistemas-digitales.json` (20 base → 32).
- [x] Declarar `materials` (2 enlaces) en `_subjects.json`.

## Bloque 4 — verificación

- [x] Test de regresión `sistemas-digitales.test.ts` (32 preguntas, 12 con imagen, materiales).
- [x] `pnpm typecheck` verde.
- [x] `pnpm test` verde (31 tests, incl. seed/repo con columnas nuevas).
- [ ] Comprobación manual en navegador (imágenes + botones de material).

## Notas de implementación

- Las opciones a–d de las preguntas con figura usan etiquetas (`Circuito N`, `Captura N`)
  o expresiones; la **figura embebida es la fuente visual autoritativa**. Los distractores
  textuales se reconstruyeron de la prosa del documento.
- P8 tenía 2 imágenes (circuito + 4 capturas) → apiladas verticalmente en `q8.jpg`.
- `evidence` y `hint` provienen del volcado real del HTML.
- `scripts/_sdig_extract.json` es intermedio regenerable (no versionado).

## Pendiente / futuro

- [ ] Convertir anexos teóricos A–H en preguntas o en un visor de conceptos.
- [ ] Reusar `materials` en otras asignaturas con PDFs/guías.
