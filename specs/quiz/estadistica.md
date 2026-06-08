# Spec: Quiz — Estadística

**Estado:** DOCUMENTADO (ingeniería inversa del código)
**Ámbito:** `app/quiz/estadistica/*`, `scripts/append-estadistica-ud1-ud3.js`
**Revisión:** 2026-06-08

---

## 1. Propósito

La asignatura **Estadística** (EST, 2.º curso, 2.º cuatrimestre) es la única del
quiz con rutas dedicadas propias en lugar de la página genérica de asignatura.
Está registrada en [`public/data/quiz/_subjects.json`](../../public/data/quiz/_subjects.json)
con `entryMode: "hub"`:

```json
{
  "id": "estadistica",
  "name": "Estadística",
  "description": "EST - 2º curso 2º cuatri. Contrastes de hipótesis, errores tipo I y II, potencia, nivel de significación.",
  "icon": "📊",
  "color": "#d97706",
  "curso": 2,
  "entryMode": "hub"
}
```

El `entryMode: "hub"` cambia el comportamiento de la tarjeta en la rejilla de
asignaturas: en [`src/components/quiz/SubjectCard.tsx`](../../src/components/quiz/SubjectCard.tsx)
el CTA pasa de "Empezar →" a "Explorar →", pero el `href` sigue siendo
`/quiz/${subject.id}` → `/quiz/estadistica`. Esa ruta NO ejecuta el flujo de
quiz estándar, sino una **página hub** que ofrece dos modos de estudio:

1. **Test general** — cuestionario tipo test de teoría.
2. **FB6 — Servidores A y B** — ejercicio guiado paso a paso (6 preguntas).

Temática cubierta: estadística descriptiva, variables aleatorias, contrastes de
hipótesis, errores tipo I/II, potencia y nivel de significación.

---

## 2. Rutas

### 2.1. Hub — [`app/quiz/estadistica/page.tsx`](../../app/quiz/estadistica/page.tsx)

- Server Component, `dynamic = 'force-dynamic'`.
- `metadata.title`: "Estadística · Tests".
- Llama a `ensureQuizSeeded()` y obtiene el subject con `getSubject('estadistica')`
  (de [`src/lib/quiz/repo.ts`](../../src/lib/quiz/repo.ts)); lanza error si no está
  sembrado.
- Renderiza dentro de `QuizPageShell` + `QuizHeader` (back hacia `/quiz`,
  acento = `subject.color` = `#d97706`).
- Muestra **dos tarjetas-enlace**:
  - **Test general** → enlaza a [`/quiz/estadistica/test`](../../app/quiz/estadistica/test/page.tsx).
    Texto dinámico que inserta `subject.questionCount`.
  - **FB6 — Servidores A y B** → enlaza a [`/quiz/estadistica/fb6`](../../app/quiz/estadistica/fb6/page.tsx).
- No ejecuta `QuizSession`; es puramente un selector de modo.

### 2.2. Modo "test" — [`app/quiz/estadistica/test/page.tsx`](../../app/quiz/estadistica/test/page.tsx)

- Server Component, `dynamic = 'force-dynamic'`, `metadata.title`: "Estadística · Test general".
- Carga preguntas con `listQuestions('estadistica')` (lee de SQLite, con fallback
  al seed JSON si la tabla está vacía).
- Monta `<QuizSession subject={subject} questions={questions} sessionKey="estadistica-test" />`.
- Es el **test general de teoría**: usa el banco completo de
  [`public/data/quiz/estadistica.json`](../../public/data/quiz/estadistica.json).
  Al ser `QuizSession` estándar, ofrece `StartScreen` (filtros por cuatrimestre,
  categoría, límite y modo repaso), barajado de preguntas/opciones y registro de
  resultado vía `postQuizResult` (excepto en modo repaso). Back hacia
  `/quiz/estadistica`.

### 2.3. Modo "fb6" — [`app/quiz/estadistica/fb6/page.tsx`](../../app/quiz/estadistica/fb6/page.tsx)

- Server Component, `dynamic = 'force-dynamic'`, `metadata.title`: "Estadística · FB6 — Servidores A y B".
- **No usa `listQuestions`**: lee directamente el fichero
  [`public/data/quiz/estadistica-fb6.json`](../../public/data/quiz/estadistica-fb6.json)
  mediante `loadFb6Questions()` (`readFileSync` desde `quizSeedDir()` +
  `questionsSchema.parse`). Es decir, **no se siembra en la BD** — se sirve siempre
  desde el JSON.
- Construye un **subject sintético** derivado del padre:
  - `id: 'estadistica-fb6'`, `name: 'FB6 — Servidores A y B'`,
    `description`, `questionCount = questions.length`, `cuatrimestres: [2]`.
  - Conserva `icon` y `color` del padre.
- Monta `<QuizSession subject={subject} questions={questions} sessionKey="estadistica-fb6" preserveOrder />`.
- `preserveOrder` es la clave: **no baraja**, mantiene el orden de los 6 pasos del
  ejercicio guiado (Paso 1/6 → 6/6). Back hacia `/quiz/estadistica`.

**Resumen de modos:**

| Aspecto        | `test`                          | `fb6`                                   |
|----------------|---------------------------------|-----------------------------------------|
| Origen datos   | `listQuestions('estadistica')` (BD/seed) | `estadistica-fb6.json` (lectura directa) |
| Subject        | `estadistica` real              | `estadistica-fb6` sintético             |
| Orden          | barajado (StartScreen)          | `preserveOrder` (secuencial)            |
| sessionKey     | `estadistica-test`              | `estadistica-fb6`                       |
| Naturaleza     | banco de teoría tipo test       | caso práctico resuelto en 6 pasos       |

---

## 3. Datos

Ficheros en `public/data/quiz/` relacionados con Estadística:

- [`estadistica.json`](../../public/data/quiz/estadistica.json) — banco principal
  (modo test). **50 preguntas** tipo `choice` (sin campo `kind`, normalizadas a
  `choice` por el preprocesado de `questionsSchema`). Campos por pregunta:
  `cuatrimestre`, `category`, `q`, `options`, `correctIndex`, `evidence`.
  Distribución por categoría:

  | Categoría                              | Preguntas |
  |----------------------------------------|-----------|
  | Contraste de hipótesis                 | 4         |
  | Estadístico de contraste               | 2         |
  | Región crítica y de aceptación         | 2         |
  | Errores y potencia                     | 7         |
  | Formulación de hipótesis               | 3         |
  | Hipótesis simples y compuestas         | 2         |
  | UD1 · Estadística descriptiva          | 10        |
  | UD3 · Variables aleatorias             | 20        |
  | **Total**                              | **50**    |

  Las dos últimas categorías (UD1 y UD3, 30 preguntas) las añade el script de
  mantenimiento descrito en §4.

- [`estadistica-fb6.json`](../../public/data/quiz/estadistica-fb6.json) — ejercicio
  guiado FB6. **6 preguntas** `choice`, una por paso. Cada una incluye un campo
  `context` (idéntico en las 6: enunciado de los servidores A/B con σ_A=6, σ_B=7,
  n_A=10/x̄_A=20, n_B=15/x̄_B=30, α=5%) y `evidence` con la resolución del paso.
  Categorías = los 6 pasos:
  1. Tipo de contraste
  2. Distribución del estadístico
  3. Valor del estadístico
  4. Número de regiones críticas
  5. Valores críticos
  6. Decisión

  Este fichero **no aparece en `_subjects.json`**: no es una asignatura, lo carga
  a mano la ruta `fb6` (§2.3).

### Siembra (seed)

[`src/lib/quiz/seed.ts`](../../src/lib/quiz/seed.ts) ingiere en SQLite los subjects
listados en `_subjects.json` leyendo `<id>.json`. Para Estadística siembra
`estadistica.json`. La reingesta se dispara por `mtime` del fichero (campo
`file_mtime` en `quiz_seed_state`): al regenerar el JSON con el script, cambia el
`mtime` y el seed vuelve a cargar el banco completo. `estadistica-fb6.json` queda
fuera de este proceso (no tiene meta), por eso la ruta lo lee con `readFileSync`.

---

## 4. Script de mantenimiento (append)

[`scripts/append-estadistica-ud1-ud3.js`](../../scripts/append-estadistica-ud1-ud3.js)
— Node CommonJS (`require('fs')`/`require('path')`).

- **Objetivo:** añadir al banco `estadistica.json` dos bloques de preguntas de
  teoría: **UD1 · Estadística descriptiva** (10 preguntas) y
  **UD3 · Variables aleatorias** (20 preguntas).
- **Mecánica:**
  1. Lee el fichero destino `public/data/quiz/estadistica.json` (ruta resuelta con
     `__dirname/..`).
  2. Define un helper `mk(cat, q, opts, ci, hint, ec, ew)` que construye cada
     pregunta con forma: `cuatrimestre: 1`, `category`, `q`, `options`,
     `correctIndex`, `hint`, `explanationCorrect`, `explanationWrong`.
  3. Construye los arrays `ud1` (10) y `ud3` (20).
  4. `const out = cur.concat(ud1, ud3)` — **concatena al final** del banco actual.
  5. Reescribe el fichero con `JSON.stringify(out, null, 2)`.
  6. Imprime `total ahora: N (+30)`.
- Tras ejecutarlo, el seed reingesta por cambio de `mtime` (§3).

> Nota: el script genera preguntas con `cuatrimestre: 1` y con los campos
> `hint`/`explanationCorrect`/`explanationWrong` (soportados por
> [`src/lib/quiz/types.ts`](../../src/lib/quiz/types.ts)), mientras que el resto
> del banco usa `evidence`. Ver §5.

---

## 5. Notas / deuda técnica

- **Script no idempotente.** `append-estadistica-ud1-ud3.js` hace `concat` +
  reescritura incondicional. Ejecutarlo dos veces **duplica** las 30 preguntas
  UD1/UD3 en `estadistica.json`. No comprueba si ya existen. Es un script de
  ejecución única (one-shot), no de regeneración.

- **Inconsistencia de campos de explicación.** El banco original usa `evidence`;
  las preguntas que añade el script usan `hint` + `explanationCorrect` +
  `explanationWrong`. Ambos validan contra `questionsSchema`, pero conviven dos
  convenciones en el mismo fichero. Conviene verificar que la UI (FeedbackBanner)
  muestre el campo correcto en cada caso.

- **Discrepancia de cuatrimestre.** El subject está descrito como "2º cuatri" y la
  ruta `fb6` fija `cuatrimestres: [2]`, pero el script siembra las 30 preguntas
  UD1/UD3 con `cuatrimestre: 1`. El filtro por cuatrimestre del `StartScreen` del
  modo test las clasificará en el 1.er cuatrimestre.

- **fb6 fuera del pipeline de seed.** `estadistica-fb6.json` se lee con
  `readFileSync` en cada request (`force-dynamic`) y no pasa por la BD. No se
  beneficia del cacheado/seed por `mtime`; cualquier error de parseo del JSON
  rompe la ruta en tiempo de ejecución (no en build).

- **Resultados de fb6.** El subject sintético tiene `id: 'estadistica-fb6'`. Al
  finalizar (fuera de modo repaso), `postQuizResult` registra el resultado bajo ese
  `subject_id`, distinto de `estadistica`. Los históricos de FB6 quedan separados
  del test general.

- **Acoplamiento del hub.** El texto de la tarjeta "Test general" inserta
  `subject.questionCount`; ese contador depende de que el seed haya ingerido el
  banco. Si la BD está vacía, `getSubject` cae al fallback de seed JSON
  (`readQuestionsFromSeed`) y el conteo sigue siendo correcto.
