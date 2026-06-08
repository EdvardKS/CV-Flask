# Plan — Sistemas Digitales

Tres bloques de trabajo + verificación. Cada bloque es un commit (o varios).

## Bloque 1 — Core: campo `image` en preguntas (aditivo, retrocompatible)

Persistencia column-mapped ⇒ se toca toda la cadena:

| Archivo | Cambio |
|---------|--------|
| [src/lib/quiz/types.ts](../../src/lib/quiz/types.ts) | `baseFields`: `image: z.string().min(1).optional()` |
| [src/lib/quiz/schema.sql.ts](../../src/lib/quiz/schema.sql.ts) | `quiz_questions`: columna `image TEXT` |
| [src/lib/quiz/db.ts](../../src/lib/quiz/db.ts) | Migración aditiva `ALTER TABLE quiz_questions ADD COLUMN image` para BDs previas |
| [src/lib/quiz/seed.ts](../../src/lib/quiz/seed.ts) | `insertQuestion`: añadir `image` a columnas/valores |
| [src/lib/quiz/repo.ts](../../src/lib/quiz/repo.ts) | `listQuestions`: seleccionar y mapear `image` (fallback JSON ya lo trae) |
| [src/components/quiz/ChoiceQuestionCard.tsx](../../src/components/quiz/ChoiceQuestionCard.tsx) | Render `<img>` bajo el enunciado si `question.image` |
| [src/components/quiz/FillQuestionCard.tsx](../../src/components/quiz/FillQuestionCard.tsx) | Idem (paridad) |

Regla: `image` ausente ⇒ comportamiento idéntico al actual.

## Bloque 2 — Material externo por asignatura (`materials`, enlaces pestaña nueva)

| Archivo | Cambio |
|---------|--------|
| [src/lib/quiz/types.ts](../../src/lib/quiz/types.ts) | `subjectMetaSchema`: `materials: z.array(z.object({ title, url, icon? })).optional()` |
| [src/lib/quiz/schema.sql.ts](../../src/lib/quiz/schema.sql.ts) | `quiz_subjects`: columna `materials_json TEXT` |
| [src/lib/quiz/db.ts](../../src/lib/quiz/db.ts) | Migración aditiva `ADD COLUMN materials_json` |
| [src/lib/quiz/seed.ts](../../src/lib/quiz/seed.ts) | `upsertSubject`: persistir `materials_json` |
| [src/lib/quiz/repo.ts](../../src/lib/quiz/repo.ts) | `getSubject`/`listSubjects`: parsear `materials_json` → `materials` |
| [app/quiz/[subject]/page.tsx](../../app/quiz/[subject]/page.tsx) | Render de botones de material (nuevo componente `SubjectMaterials`) si `meta.materials` |
| `src/components/quiz/SubjectMaterials.tsx` (nuevo) | Lista de `<a target="_blank" rel="noopener">` con título/icono |

## Bloque 3 — Contenido

| Acción | Destino |
|--------|---------|
| Publicar HTML simulacro | `public/data/quiz/sistemas-digitales/simulacro-examen.html` |
| Publicar HTML guía | `public/data/quiz/sistemas-digitales/guia-escritura.html` |
| Extraer 13 imágenes JPEG | `public/data/quiz/sistemas-digitales/assets/q1.jpg … q12.jpg` (+ `q8b.jpg`) |
| Generar 12 MCQ (q, options[4], correctIndex, image, evidence, category `simulacro-examen`, cuatrimestre 2) | append a [public/data/quiz/sistemas-digitales.json](../../public/data/quiz/sistemas-digitales.json) |
| Declarar `materials` (2 enlaces) en `sistemas-digitales` | [public/data/quiz/_subjects.json](../../public/data/quiz/_subjects.json) |
| Script de extracción reproducible | `scripts/extract_sdig_simulacro.py` |

URLs servidas: `/data/quiz/sistemas-digitales/<archivo>` (todo bajo `public/`).

## Bloque 4 — Verificación

- `pnpm typecheck` y `pnpm test` en verde.
- Test de regresión nuevo (`src/lib/quiz/__tests__/sistemas-digitales.test.ts`): el banco parsea contra `questionsSchema`, hay ≥ 32 preguntas (20 previas + 12), las 12 nuevas tienen `image`, `category: 'simulacro-examen'`, 4 opciones y `correctIndex` válido.
- Comprobación manual: la asignatura abre el test con imágenes y los 2 botones de material abren los HTML en pestaña nueva.

## No-regresión

- Preguntas sin `image` y asignaturas sin `materials` no cambian (campos opcionales/NULL).
- Migraciones `ADD COLUMN` no destruyen datos; el seed reingesta por mtime.
- App legacy `src/apps/quiz/*` intacta.
