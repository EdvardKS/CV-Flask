# TDD — Sistemas Digitales

Desarrollo dirigido por tests de la feature descrita en
[plan.md](plan.md), bajo las reglas de [constitution.md](constitution.md) y las
decisiones de [clarify.md](clarify.md). Estado de tareas en [tasks.md](tasks.md).

Disciplina: por cada comportamiento nuevo se escribe primero el test que lo
describe (**RED**), se implementa lo mínimo para pasarlo (**GREEN**) y se limpia
sin romper (**REFACTOR**). Aquí se documenta cada ciclo y el test que lo fija.

## Suite

| Archivo | Nivel | Qué bloquea |
|---------|-------|-------------|
| [src/lib/quiz/__tests__/sistemas-digitales.test.ts](../../src/lib/quiz/__tests__/sistemas-digitales.test.ts) | Datos (JSON) | El banco parsea contra `questionsSchema`; 20 base + 12 simulacro; las 12 con `image`, 4 opciones y `correctIndex` válido; la asignatura es de 1º con 2 materiales. |
| [src/lib/quiz/__tests__/sistemas-digitales-persistence.test.ts](../../src/lib/quiz/__tests__/sistemas-digitales-persistence.test.ts) | Persistencia (SQLite) | `image` y `materials` sobreviven el viaje seed → SQLite → repo (column-mapping). |

## Ciclos

### Ciclo 1 — `image` en preguntas (campo opcional, column-mapped)

- **RED.** Test `persists question.image through seed → SQLite → repo`: siembra una
  pregunta con `image` y otra sin él; espera leer la URL en la primera y `undefined`
  en la segunda. Falla: la capa es column-mapped y `image` no existía como columna,
  así que `listQuestions` nunca lo devolvía.
- **GREEN.** Cadena mínima completa: `image?` en `baseFields`
  ([types.ts](../../src/lib/quiz/types.ts)) → columna `image TEXT`
  ([schema.sql.ts](../../src/lib/quiz/schema.sql.ts)) → migración aditiva
  `ADD COLUMN image` ([db.ts](../../src/lib/quiz/db.ts)) → `insertQuestion`
  ([seed.ts](../../src/lib/quiz/seed.ts)) → `SELECT`/`rowToQuestion`
  ([repo.ts](../../src/lib/quiz/repo.ts)).
- **REFACTOR.** Render en [ChoiceQuestionCard.tsx](../../src/components/quiz/ChoiceQuestionCard.tsx)
  y [FillQuestionCard.tsx](../../src/components/quiz/FillQuestionCard.tsx) bajo la
  guarda `question.image`. Pregunta sin imagen ⇒ idéntica al comportamiento previo
  (verificado por la segunda aserción del mismo test).

### Ciclo 2 — `materials` por asignatura (enlaces externos, JSON en columna)

- **RED.** Test `persists subject.materials as JSON column and parses it back`:
  siembra una asignatura con 2 materiales (uno con `icon`, otro sin) y espera
  recuperarlos por `getSubject`. Falla: sin columna ni parseo, `materials` llegaba
  siempre `undefined`.
- **GREEN.** `subjectMaterialSchema` + `materials?` en `subjectMetaSchema` (types) →
  columna `materials_json TEXT` (schema.sql) → migración `ADD COLUMN materials_json`
  (db) → `upsertSubject` serializa (seed) → `parseMaterials` valida con Zod al leer
  (repo).
- **REFACTOR.** `SubjectMaterials.tsx` (enlaces `target="_blank" rel="noopener"`) y
  render en [app/quiz/[subject]/page.tsx](../../app/quiz/[subject]/page.tsx).

### Ciclo 3 — no-regresión

- **RED/GREEN.** Test `leaves materials undefined for subjects that declare none`:
  una asignatura sin `materials` debe devolver `undefined` (no `[]`, no error). Pasa
  con `parseMaterials(null) → undefined`. Garantiza que las asignaturas existentes no
  cambian (principio de la constitución: aditivo y retrocompatible).

### Ciclo 4 — integridad del contenido extraído

- **GREEN.** `sistemas-digitales.test.ts` fija el resultado del pipeline de extracción
  ([scripts/extract_sdig_simulacro.py](../../scripts/extract_sdig_simulacro.py) +
  [scripts/build_sdig_questions.py](../../scripts/build_sdig_questions.py)): 32
  preguntas totales, las 12 del simulacro con `image` apuntando a `assets/qN.jpg`,
  `cuatrimestre: 2`, `evidence` no vacío. Reejecutar los scripts no debe romper este
  test (idempotencia del banco).

## Resultado

`pnpm test` → **34/34** (11 ficheros) · `pnpm typecheck` verde. Umbral 100% alcanzado.
