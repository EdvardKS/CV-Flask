# Spec: Quiz — capa de datos (SQLite)
**Estado:** DOCUMENTADO (ingeniería inversa del código)
**Ámbito:** `src/lib/quiz/*`, `app/api/quiz/*`, `app/api/errores/*`, `data/quiz/quiz.db`
**Revisión:** 2026-06-08

---

## 1. Propósito

La capa de datos del quiz persiste **asignaturas** (`subjects`), **preguntas** (`questions`) y **resultados** (`results`) de los tests en una base de datos SQLite local mediante [`better-sqlite3`](../../src/lib/quiz/db.ts#L3) (driver síncrono). El contenido de las preguntas no se edita en BD: vive como bancos JSON en `public/data/quiz/` y se **siembra** (seed) hacia SQLite de forma idempotente al arrancar las rutas API. SQLite actúa así como una caché/índice consultable de los JSON fuente, más una tabla de resultados que sí es estado mutable propio.

La asignatura `redes` tiene una capa de datos paralela y mucho más rica (temario, autoevaluaciones, conceptos sobre slides) en [`src/lib/quiz/redes.ts`](../../src/lib/quiz/redes.ts), documentada aparte en `specs/redes/`. Aquí solo se trata la capa SQLite común.

Importante: las rutas `app/api/errores/*` (iniciar/finalizar) **no** usan esta capa SQLite; delegan en un CLI Python (`padel`). Ver §8.

---

## 2. Esquema SQLite (tablas / columnas / índices)

Todo el DDL se define como string en [`schema.sql.ts`](../../src/lib/quiz/schema.sql.ts#L1) (constante `QUIZ_DDL`) y se aplica con `CREATE TABLE IF NOT EXISTS`. Cuatro tablas + tres índices.

### 2.1 `quiz_subjects` — [schema.sql.ts#L2](../../src/lib/quiz/schema.sql.ts#L2)
Metadatos de cada asignatura.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | TEXT PRIMARY KEY | slug `^[a-z0-9-]+$` |
| `name` | TEXT NOT NULL | |
| `description` | TEXT | |
| `icon` | TEXT | emoji |
| `color` | TEXT | hex |
| `position` | INTEGER DEFAULT 0 | orden manual |
| `curso` | INTEGER | curso académico (1–6) — añadida vía migración |
| `entry_mode` | TEXT NOT NULL DEFAULT `'standard'` | `'standard'` \| `'hub'` — añadida vía migración |
| `updated_at` | INTEGER NOT NULL | epoch ms del último upsert |

### 2.2 `quiz_questions` — [schema.sql.ts#L14](../../src/lib/quiz/schema.sql.ts#L14)
Una fila por pregunta de una asignatura.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `subject_id` | TEXT NOT NULL → `quiz_subjects(id)` | FK `ON DELETE CASCADE` |
| `position` | INTEGER NOT NULL | orden dentro de la asignatura |
| `q` | TEXT NOT NULL | enunciado |
| `kind` | TEXT NOT NULL DEFAULT `'choice'` | `'choice'` \| `'fill'` — migración |
| `options_json` | TEXT NOT NULL DEFAULT `'[]'` | array JSON de opciones (solo `choice`) |
| `correct_json` | TEXT NOT NULL DEFAULT `'null'` | índice(s) correcto(s); `number` o `number[]` (solo `choice`) |
| `accept_json` | TEXT | respuestas aceptadas (solo `fill`) — migración |
| `cuatrimestre` | INTEGER | 1 ó 2 — migración |
| `context` | TEXT | texto contextual — migración |
| `code` | TEXT | bloque de código |
| `is_vocab` | INTEGER DEFAULT 0 | flag 0/1 |
| `category` | TEXT | agrupación |
| `evidence` | TEXT | cita/justificación — migración |

### 2.3 `quiz_results` — [schema.sql.ts#L31](../../src/lib/quiz/schema.sql.ts#L31)
Estado mutable: cada intento finalizado de un cliente.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `subject_id` | TEXT NOT NULL | sin FK declarada |
| `client_id` | TEXT NOT NULL | identificador anónimo de cliente |
| `score_pct` | INTEGER NOT NULL | `round(correct/total*100)` |
| `correct` / `incorrect` / `unanswered` / `total` | INTEGER NOT NULL | conteos |
| `duration_seconds` | INTEGER NOT NULL | |
| `finished_at` | INTEGER NOT NULL | epoch ms |

### 2.4 `quiz_seed_state` — [schema.sql.ts#L44](../../src/lib/quiz/schema.sql.ts#L44)
Control de idempotencia del seed (qué JSON ya se ingirió y con qué mtime).

| Columna | Tipo | Notas |
|---|---|---|
| `subject_id` | TEXT PRIMARY KEY | |
| `file_mtime` | INTEGER NOT NULL | mtime (ms, truncado) del JSON al ingerir |
| `seeded_at` | INTEGER NOT NULL | epoch ms |
| `question_count` | INTEGER NOT NULL | nº preguntas ingeridas |

### 2.5 Índices — [schema.sql.ts#L51](../../src/lib/quiz/schema.sql.ts#L51)
- `idx_quiz_questions_subject` sobre `quiz_questions(subject_id, position)` — listado ordenado por asignatura.
- `idx_quiz_results_client` sobre `quiz_results(client_id, finished_at DESC)` — historial reciente por cliente.
- `idx_quiz_results_subject` sobre `quiz_results(subject_id, finished_at DESC)`.

---

## 3. Inicialización y boot (WAL, ruta DB)

### 3.1 Apertura de la BD — [`db.ts`](../../src/lib/quiz/db.ts)
`getQuizDb()` ([db.ts#L26](../../src/lib/quiz/db.ts#L26)) es un singleton perezoso (variable de módulo `_db`). En la primera llamada:
1. Crea el directorio de la BD (`mkdirSync(..., { recursive: true })`).
2. Abre la BD en `quizDbPath()`.
3. `pragma('journal_mode = WAL')` — modo Write-Ahead Logging.
4. `pragma('foreign_keys = ON')` — habilita FKs (necesario para el `ON DELETE CASCADE`).
5. `db.exec(QUIZ_DDL)` — crea tablas/índices si faltan.
6. Ejecuta dos migraciones idempotentes.

`closeQuizDb()` ([db.ts#L39](../../src/lib/quiz/db.ts#L39)) cierra y resetea el singleton (usado en tests).

### 3.2 Migraciones in-place — [db.ts#L9](../../src/lib/quiz/db.ts#L9)
Como las tablas se crean con `IF NOT EXISTS`, una BD antigua no recibiría columnas nuevas. Por eso, tras el DDL:
- `migrateQuestionsTable` ([db.ts#L9](../../src/lib/quiz/db.ts#L9)): vía `PRAGMA table_info`, añade con `ALTER TABLE ... ADD COLUMN` las columnas `kind`, `accept_json`, `cuatrimestre`, `context`, `evidence` si no existen.
- `migrateSubjectsTable` ([db.ts#L19](../../src/lib/quiz/db.ts#L19)): añade `curso` y `entry_mode` si no existen.

### 3.3 Rutas configurables — [`paths.ts`](../../src/lib/quiz/paths.ts)
- `quizDbPath()` ([paths.ts#L3](../../src/lib/quiz/paths.ts#L3)): `process.env.QUIZ_DB_PATH` o por defecto `<cwd>/data/quiz/quiz.db`.
- `quizSeedDir()` ([paths.ts#L7](../../src/lib/quiz/paths.ts#L7)): `process.env.QUIZ_SEED_DIR` o por defecto `<cwd>/public/data/quiz`.
- `quizDbDir()` ([paths.ts#L11](../../src/lib/quiz/paths.ts#L11)): dirname de la ruta de BD.

La BD física es `data/quiz/quiz.db` (más sus ficheros WAL `-wal`/`-shm`). El esquema se deduce de `schema.sql.ts` (no se abre el binario).

### 3.4 Boot/seed perezoso — [`boot.ts`](../../src/lib/quiz/boot.ts)
`ensureQuizSeeded()` ([boot.ts#L6](../../src/lib/quiz/boot.ts#L6)) memoiza una `Promise` de `seedQuizDb()` para que el seed corra **una sola vez por proceso**. Si falla, resetea `_seeded` a `null` para reintentar en la siguiente petición y propaga el error. `_resetQuizBootForTests()` ([boot.ts#L16](../../src/lib/quiz/boot.ts#L16)) limpia el flag en tests. Todas las rutas API llaman a `ensureQuizSeeded()` antes de consultar.

Todos los módulos de servidor importan `'server-only'` ([db.ts#L1](../../src/lib/quiz/db.ts#L1), [repo.ts#L1](../../src/lib/quiz/repo.ts#L1), [seed.ts#L1](../../src/lib/quiz/seed.ts#L1)) para impedir que entren en el bundle de cliente.

---

## 4. Seed (JSON → SQLite) — [`seed.ts`](../../src/lib/quiz/seed.ts)

### 4.1 Fuente
- `public/data/quiz/_subjects.json`: array de metadatos de asignatura (`SubjectMeta`).
- `public/data/quiz/<id>.json`: banco de preguntas de cada asignatura.

Bancos presentes hoy: `ade`, `english-latest-test`, `estadistica`, `estadistica-fb6`, `estructura`, `gestion-tecnologia`, `ia`, `ingles`, `redes` (+ subcarpeta `redes/`), `sistemas-digitales`, `sistemas-operativos`, `ssoo-avanzados`.

### 4.2 Flujo `seedQuizDb()` — [seed.ts#L83](../../src/lib/quiz/seed.ts#L83)
1. Lee y valida `_subjects.json` con `subjectMetaSchema` (`readSubjectMetas`, [seed.ts#L9](../../src/lib/quiz/seed.ts#L9)); si está corrupto, aborta devolviendo un error agregado (no lanza).
2. Por cada meta:
   - `upsertSubject` ([seed.ts#L27](../../src/lib/quiz/seed.ts#L27)): `INSERT ... ON CONFLICT(id) DO UPDATE` en `quiz_subjects` (refresca todos los campos + `updated_at = Date.now()`).
   - `ingestSubject` ([seed.ts#L63](../../src/lib/quiz/seed.ts#L63)): lee el `<id>.json`, calcula su `mtime`; si coincide con `quiz_seed_state.file_mtime` **no reingiere** (idempotencia). Si cambió, dentro de una **transacción**: `DELETE` de las preguntas de esa asignatura, `INSERT` de todas (`insertQuestion`, [seed.ts#L45](../../src/lib/quiz/seed.ts#L45)) y upsert de `quiz_seed_state`.
   - Compara `file_mtime` antes/después para decidir si la asignatura entra en la lista `ingested`.
3. Devuelve `{ subjects, ingested[], errors[] }`. Los errores son **por asignatura**: un JSON inválido se captura y registra sin bloquear las demás.

### 4.3 Serialización de preguntas — `insertQuestion` ([seed.ts#L45](../../src/lib/quiz/seed.ts#L45))
- `choice`: `options_json = JSON.stringify(options)`, `correct_json = JSON.stringify(correctIndex)`, `accept_json = null`.
- `fill`: `options_json = '[]'`, `correct_json = 'null'`, `accept_json = JSON.stringify(accept)`.
- `is_vocab` se guarda como 1/0; el resto de campos opcionales como `null` si faltan.

---

## 5. Repositorio (queries) — [`repo.ts`](../../src/lib/quiz/repo.ts)

API pública de lectura/escritura sobre SQLite, con **fallback a los JSON de seed** cuando la BD aún no tiene datos.

### 5.1 `listSubjects()` — [repo.ts#L89](../../src/lib/quiz/repo.ts#L89)
`SELECT` de `quiz_subjects` con dos subconsultas correladas: `question_count` (COUNT de preguntas) y `cuatrimestres_csv` (`GROUP_CONCAT(DISTINCT IFNULL(cuatrimestre,1))`). Orden: `curso, position, name`. Mapea a `SubjectWithCount`, parseando el CSV de cuatrimestres a `number[]` ordenado (`parseCuatris`, [repo.ts#L80](../../src/lib/quiz/repo.ts#L80)). 
- Si no hay filas, fallback total leyendo metas + preguntas de los JSON ([repo.ts#L100](../../src/lib/quiz/repo.ts#L100)).
- Si una asignatura existe pero tiene 0 preguntas en BD, fallback parcial contando desde su JSON ([repo.ts#L113](../../src/lib/quiz/repo.ts#L113)).
- Defaults de presentación: icono `📝`, color `#3a6ea5`, `entryMode = 'standard'`.

### 5.2 `getSubject(id)` — [repo.ts#L129](../../src/lib/quiz/repo.ts#L129)
Filtra `listSubjects()` por `id`; devuelve `null` si no existe.

### 5.3 `listQuestions(subjectId)` — [repo.ts#L154](../../src/lib/quiz/repo.ts#L154)
`SELECT` de `quiz_questions` ordenado por `position`. Cada fila se rehidrata con `rowToQuestion` ([repo.ts#L133](../../src/lib/quiz/repo.ts#L133)) que reconstruye `choice` (parsea `options_json`/`correct_json`) o `fill` (parsea `accept_json`) y normaliza booleanos/opcionales. Si la BD no tiene filas, fallback a `readQuestionsFromSeed`.
- **Caso especial `ingles`** ([repo.ts#L160](../../src/lib/quiz/repo.ts#L160)): añade preguntas extra de `english-latest-test.json` vía `readEnglishLatestTest` ([repo.ts#L60](../../src/lib/quiz/repo.ts#L60)), que transforma un formato legacy (`{pregunta, respuestas:[{letra,texto}], correcta}`) al modelo `choice` (`group: 'latest-test'`).

### 5.4 `saveResult(input)` — [repo.ts#L174](../../src/lib/quiz/repo.ts#L174)
Calcula `score_pct = round(correct/total*100)` (0 si `total=0`), inserta en `quiz_results` con `finished_at = Date.now()` y devuelve el `lastInsertRowid`. Tipo de entrada `SaveResultInput` ([repo.ts#L164](../../src/lib/quiz/repo.ts#L164)).

### 5.5 `recentResults(clientId, limit=10)` — [repo.ts#L194](../../src/lib/quiz/repo.ts#L194)
`SELECT` de los resultados de un `client_id` ordenados por `finished_at DESC LIMIT ?`, con campos renombrados a camelCase (`scorePct`, `durationSeconds`, `finishedAt`).

---

## 6. Tipos — [`types.ts`](../../src/lib/quiz/types.ts)

Validación y tipado con **Zod**.

- `subjectMetaSchema` ([types.ts#L3](../../src/lib/quiz/types.ts#L3)): `id` (regex slug), `name`, `description` (def `''`), `icon` (def `📝`), `color` (def `#3a6ea5`), `position?`, `curso?` (1–6), `entryMode` (`standard`|`hub`, def `standard`).
- `correctIndexSchema` ([types.ts#L15](../../src/lib/quiz/types.ts#L15)): `number` **o** `number[]` (≥1) → soporta multi-respuesta.
- `choiceQuestionSchema` ([types.ts#L41](../../src/lib/quiz/types.ts#L41)): `kind:'choice'`, `options` (2–8), `correctIndex`.
- `fillQuestionSchema` ([types.ts#L48](../../src/lib/quiz/types.ts#L48)): `kind:'fill'`, `accept` (string o string[]), `hint?`.
- `questionsSchema` ([types.ts#L55](../../src/lib/quiz/types.ts#L55)): array con `preprocess` que **inyecta `kind:'choice'`** a objetos sin `kind` (compat con bancos legacy), luego `discriminatedUnion('kind', ...)`.
- `baseFields` ([types.ts#L23](../../src/lib/quiz/types.ts#L23)) campos comunes opcionales: `context`, `code`, `category`, `group`, `cuatrimestre` (1–2), `isVocab`, `source*`, `evidence`, `hint`, `explanationCorrect/Wrong`.
- Tipos derivados: `Question = ChoiceQuestion | FillQuestion`, `Answer = number | string`, `SubjectWithCount` ([types.ts#L75](../../src/lib/quiz/types.ts#L75)).
- Helpers de corrección: `normalizeFill` ([types.ts#L164](../../src/lib/quiz/types.ts#L164)), `isCorrect(q, picked)` ([types.ts#L168](../../src/lib/quiz/types.ts#L168)) — soporta multi-respuesta y comparación normalizada de `fill`, `primaryCorrect(q)` ([types.ts#L180](../../src/lib/quiz/types.ts#L180)).
- Esquemas de **redes** (temario/conceptos/autoeval: `temarioTopicSchema`, `redesTemarioManifestSchema`, `slideConceptDeckSchema`, `redesConceptManifestSchema`, `redesAutoevalManifestSchema`, etc. desde [types.ts#L66](../../src/lib/quiz/types.ts#L66)) viven aquí pero los consume la capa `redes.ts` — ver `specs/redes/`.

---

## 7. APIs (contratos)

Todas son `dynamic = 'force-dynamic'` y llaman a `ensureQuizSeeded()` antes de operar.

### 7.1 `GET /api/quiz/subjects` — [route.ts](../../app/api/quiz/subjects/route.ts)
- **Request:** sin parámetros.
- **Response 200:** `{ subjects: SubjectWithCount[] }` (de `listSubjects()`).
- **500:** `{ error: 'Failed to load subjects' }`.

### 7.2 `GET /api/quiz/[subject]` — [route.ts](../../app/api/quiz/[subject]/route.ts)
- **Request:** param de ruta `subject` (slug).
- **Response 200:** `Question[]` (array directo, de `listQuestions`), cabecera `Cache-Control: private, max-age=60`.
- **404:** `{ error: 'Unknown subject' }` si `getSubject` es `null`.
- **500:** `{ error: 'Failed to load questions' }`.

### 7.3 `POST /api/quiz/results` — [route.ts#L18](../../app/api/quiz/results/route.ts#L18)
- **Request body** (Zod, [results/route.ts#L8](../../app/api/quiz/results/route.ts#L8)): `{ subjectId (slug, ≤64), clientId (1–128), correct, incorrect, unanswered (≥0 int), total (≥1 int), durationSeconds (0–43200 int) }`.
- **Response 200:** `{ id: number }` (rowid del resultado guardado).
- **400:** `{ error: 'Invalid body', issues }` ante `ZodError`.
- **500:** `{ error: 'Failed to save result' }`.

### 7.4 `GET /api/quiz/results?clientId=...` — [route.ts#L34](../../app/api/quiz/results/route.ts#L34)
- **Request:** query `clientId`.
- **Response 200:** `{ results: [...] }` con los **20** resultados más recientes del cliente (`recentResults(clientId, 20)`). Si falta `clientId`, devuelve `{ results: [] }`.
- **500:** `{ error: 'Failed to load results' }`.

---

## 8. Tracking de "errores" (iniciar / finalizar)

Importante: pese a estar en este encargo, las rutas `app/api/errores/*` **no tocan la BD SQLite del quiz ni esta capa**. Son una pasarela hacia un CLI Python externo (módulo `padel`).

- `POST /api/errores/iniciar` — [route.ts](../../app/api/errores/iniciar/route.ts): lee el body crudo (`req.text()`) y lo pasa por stdin a `runPadelCli('iniciar', { stdin: body })`. Devuelve el JSON del CLI con su status mapeado.
- `POST /api/errores/finalizar` — [route.ts](../../app/api/errores/finalizar/route.ts): idéntico con subcomando `'finalizar'`.

Ambas: `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`.

El puente es `runPadelCli` ([runPython.ts](../../src/lib/padel/runPython.ts#L12)): hace `spawn('python3', ['legacy-src/padel_cli.py', <subcomando>, ...])` con `PADEL_DATA_DIR` (def `public/padel-data`), recoge stdout/stderr y **mapea exit codes a HTTP**:
- `0` → 200, `1` → 400, `10..19` → `400..409` (`390 + code`), cualquier otro → 500.
- Si stdout no es JSON válido, envuelve el texto en `{ message }`.

Es decir, "qué registra" una sesión de errores (iniciar/finalizar) lo decide `legacy-src/padel_cli.py` sobre ficheros en `public/padel-data`, fuera de SQLite. La persistencia de errores del quiz, si la hubiera a nivel de cliente, no reside en esta capa. (No documentado aquí: pertenece al dominio `padel`.)

---

## 9. Tests — [`__tests__`](../../src/lib/quiz/__tests__)

Vitest en entorno `node`. `fixtures.ts` ([fixtures.ts#L16](../../src/lib/quiz/__tests__/fixtures.ts#L16)) crea un entorno temporal: directorio temp con `_subjects.json` + `test-asg.json` (3 preguntas, una multi-correct), y apunta `QUIZ_DB_PATH`/`QUIZ_SEED_DIR` a rutas temporales aisladas. Cada test cierra la BD (`closeQuizDb`) en `beforeEach`/`afterEach` y borra el temp.

- `repo.test.ts` ([repo.test.ts](../../src/lib/quiz/__tests__/repo.test.ts)):
  - Siembra y lista asignaturas/preguntas, incluida multi-respuesta (`correctIndex:[1,2]`), valida `isCorrect`/`primaryCorrect`.
  - **Idempotencia**: segundo `seedQuizDb()` no reingesta (`ingested === []`).
  - `saveResult` + `recentResults` por cliente, comprobando `scorePct = 50`.
- `growth.test.ts` ([growth.test.ts](../../src/lib/quiz/__tests__/growth.test.ts)):
  - Detecta una asignatura **nueva** soltada tras el seed inicial.
  - **Aislamiento de errores**: un `broken.json` inválido se registra en `errors` sin bloquear a las demás.

(Los tests de `redes` van aparte; aquí solo la capa SQLite común.)

---

## 10. Notas / deuda

- **SQLite como caché, no como fuente:** las preguntas son derivadas de los JSON. Editar la BD a mano se sobrescribe en el siguiente seed con mtime cambiado. La fuente de verdad es `public/data/quiz/`.
- **Fallback dual** en `repo.ts`: si la BD está vacía se leen los JSON en caliente. Útil en arranque en frío / entornos sin seed, pero implica I/O de fichero en la ruta de lectura y duplica lógica de parseo (seed vs. repo).
- **`quiz_results.subject_id` sin FK** (a diferencia de `quiz_questions`): no hay `ON DELETE CASCADE` ni integridad referencial sobre resultados; borrar una asignatura deja resultados huérfanos.
- **`client_id` anónimo, sin auth:** cualquiera con un `clientId` puede escribir/leer resultados; los límites son solo de forma (Zod) no de autorización.
- **Idempotencia por mtime entero (ms truncado):** dos ediciones dentro del mismo milisegundo no se detectarían; suficiente en la práctica.
- **Migraciones aditivas únicamente:** solo `ADD COLUMN`; no hay downgrade ni renombrados. El esquema crece monótonamente.
- **`redes` divergente:** su modelo (temario, slides, autoevaluación) excede el de 4 tablas aquí descrito; vive en [`redes.ts`](../../src/lib/quiz/redes.ts) y `specs/redes/`.
- **`errores/*` fuera de SQLite:** dependen de `python3` y `legacy-src/padel_cli.py` en runtime — acoplamiento a binario externo y a `public/padel-data`.
