# Tasks — Sistemas Digitales

**Estado:** EN CURSO. Feature SDD (constitution → clarify → plan → tasks).

## Bloque 1 — campo `image` en preguntas

- [ ] `types.ts`: `image?` en `baseFields`.
- [ ] `schema.sql.ts`: columna `image TEXT` en `quiz_questions`.
- [ ] `db.ts`: migración `ALTER TABLE quiz_questions ADD COLUMN image`.
- [ ] `seed.ts`: `insertQuestion` incluye `image`.
- [ ] `repo.ts`: `listQuestions` selecciona y mapea `image`.
- [ ] `ChoiceQuestionCard.tsx` + `FillQuestionCard.tsx`: render de la imagen.

## Bloque 2 — material externo por asignatura

- [ ] `types.ts`: `materials?` en `subjectMetaSchema`.
- [ ] `schema.sql.ts`: columna `materials_json TEXT` en `quiz_subjects`.
- [ ] `db.ts`: migración `ADD COLUMN materials_json`.
- [ ] `seed.ts`: `upsertSubject` persiste `materials_json`.
- [ ] `repo.ts`: `getSubject`/`listSubjects` parsean `materials`.
- [ ] `SubjectMaterials.tsx` (nuevo) + render en `app/quiz/[subject]/page.tsx`.

## Bloque 3 — contenido

- [ ] Script `scripts/extract_sdig_simulacro.py` (imágenes + volcado de texto por pregunta).
- [ ] Publicar `simulacro-examen.html` y `guia-escritura.html` en `public/data/quiz/sistemas-digitales/`.
- [ ] Extraer 13 imágenes a `assets/`.
- [ ] Generar las 12 MCQ y anexarlas a `sistemas-digitales.json`.
- [ ] Declarar `materials` (2 enlaces) en `_subjects.json`.

## Bloque 4 — verificación

- [ ] Test de regresión `sistemas-digitales.test.ts`.
- [ ] `pnpm typecheck` verde.
- [ ] `pnpm test` verde.
- [ ] Comprobación manual (imágenes + botones de material).

## Pendiente / futuro

- [ ] Convertir anexos teóricos A–H en preguntas o en un visor de conceptos (fuera de alcance ahora).
- [ ] Reusar `materials` en otras asignaturas con PDFs/guías.
