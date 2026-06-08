# Spec: Quiz — núcleo (UI y sesión)

**Estado:** DOCUMENTADO (ingeniería inversa del código)
**Ámbito:** `src/components/quiz/*`, `app/quiz/(layout|page|[subject])`
**Revisión:** 2026-06-08

> Este spec cubre el **flujo principal Next.js del quiz** (componentes UI, sesión, scoring de cliente, shuffle, summary, filtros, modos de pregunta). **No** cubre la capa de datos SQLite (`src/lib/quiz/*`), ni los modos `redes` / `estadistica`, ni el detalle del **modo repaso** (tiene spec propio en `specs/quiz-repaso/`). Esos tienen sus propios documentos.

---

## 1. Propósito

El núcleo del quiz es la maquinaria que, dada una asignatura (`SubjectWithCount`) y su banco de preguntas (`Question[]`) ya cargado por el servidor, permite al usuario:

1. Configurar una sesión de test (parte del curso, temas, número de preguntas, modo repaso) — pantalla **StartScreen**.
2. Responder preguntas de tipo `choice` (opción única o multi-correcta "cualquiera de") o `fill` (rellenar hueco) con feedback inmediato — **QuizRunner** + **QuestionCard**.
3. Ver el resultado puntuado, la revisión detallada y reintentar — **ResultsScreen**.

Toda la lógica de selección, mezcla y puntuación corre **en el cliente** sobre el array de preguntas que el servidor entregó. El estado de sesión se persiste en `localStorage` para resistir recargas. Al terminar (salvo en modo repaso) se envía un resumen agregado a la API de historial.

El servidor (Server Components) solo siembra la BD y entrega datos: ver [`app/quiz/page.tsx`](../../app/quiz/page.tsx#L14) y [`app/quiz/[subject]/page.tsx`](../../app/quiz/%5Bsubject%5D/page.tsx#L17).

---

## 2. Árbol de componentes

Routing (Server Components, `dynamic = 'force-dynamic'`):

```
app/quiz/layout.tsx          → import ./quiz.css + viewport (themeColor)        [layout.tsx]
app/quiz/page.tsx            → home: ensureQuizSeeded → listSubjects()          [page.tsx:14]
   └─ QuizPageShell
        ├─ QuizHeader (title "Tests")
        └─ SubjectFilters(subjects)
              ├─ FilterRow ×2  (Curso / Cuatri)
              └─ SubjectGrid → SubjectCard ×N  → Link /quiz/{id}
app/quiz/[subject]/page.tsx  → ensureQuizSeeded → getSubject + listQuestions    [[subject]/page.tsx:17]
   └─ QuizPageShell
        ├─ QuizHeader (icon+name, back→/quiz)
        └─ QuizSession(subject, questions)        ← frontera servidor→cliente
```

Sesión (Client Components, raíz `QuizSession`):

```
QuizSession ('use client')                                          [QuizSession.tsx:20]
  useQuizSession(...)  → { session, hydrated, start, answer, goto, finish, reset }
  · !hydrated         → "Cargando..."
  · !session          → StartScreen                                 [StartScreen.tsx:41]
  ·                       ├─ FilterRow-like pills (cuatri)  (inline pillClass)
  ·                       ├─ CategoryMultiCheck (temas)            [CategoryMultiCheck.tsx:17]
  ·                       └─ toggle "Modo repaso"
  · session.finishedAt → ResultsScreen                              [ResultsScreen.tsx:16]
  ·                       ├─ StatTile ×4
  ·                       └─ <details> ReviewRow ×N
  · en curso          → QuizRunner                                  [QuizRunner.tsx:18]
                          ├─ QuizProgressBar
                          ├─ QuestionCard  (dispatcher)             [QuestionCard.tsx:15]
                          │    ├─ ChoiceQuestionCard                [ChoiceQuestionCard.tsx:27]
                          │    │    ├─ ContextBox
                          │    │    ├─ AiHelpButton
                          │    │    ├─ AnswerOption ×N
                          │    │    └─ FeedbackBanner
                          │    └─ FillQuestionCard                  [FillQuestionCard.tsx:17]
                          │         ├─ ContextBox
                          │         ├─ AiHelpButton
                          │         └─ FeedbackBanner
                          └─ <nav> fija (← / Siguiente / Terminar|Salir)
```

`QuizPageShell` ([QuizPageShell.tsx](../../src/components/quiz/QuizPageShell.tsx#L3)) es el contenedor de página común (fondo radial azul, `max-w-3xl`). `QuizHeader` ([QuizHeader.tsx](../../src/components/quiz/QuizHeader.tsx#L10)) es la cabecera con título, subtítulo y enlace "atrás" opcional.

---

## 3. Sesión (`useQuizSession`, localStorage, versión)

Hook central: [`useQuizSession.ts`](../../src/components/quiz/useQuizSession.ts#L53).

```ts
useQuizSession(subjectId, source, sessionKey = subjectId, preserveOrder = false)
```

- `source` = banco completo de preguntas de la asignatura.
- `sessionKey` = clave lógica de la sesión (por defecto el `subjectId`); permite que un mismo subject tenga sesiones distintas (p.ej. modos `redes`).
- `preserveOrder` = si `true`, no se mezcla (`shuffled`), se respeta el orden de `source`.

**Persistencia y versión** ([L20-L43](../../src/components/quiz/useQuizSession.ts#L20)):

- `VERSION = 4`. Clave en `localStorage`: `quiz:v4:{sessionKey}`.
- Subir `VERSION` invalida sesiones antiguas (no se migra: con otra clave, `load` no las encuentra → arranque limpio). Cambio de forma de `SessionState` ⇒ bump.
- `load` / `save` / `clear` envuelven el acceso en `try/catch`; si `localStorage` no existe (SSR) o falla, devuelven `null` / no-op.

**Hidratación** ([L57-L62](../../src/components/quiz/useQuizSession.ts#L57)):

- En `useEffect` se carga la sesión guardada. Solo se restaura si **tiene preguntas y no está terminada** (`!existing.finishedAt`). Una sesión terminada no se reanuda: se vuelve a `StartScreen`.
- `hydrated` evita el flash SSR/cliente: hasta que es `true`, `QuizSession` muestra "Cargando..." ([QuizSession.tsx:33](../../src/components/quiz/QuizSession.tsx#L33)).

**API devuelta**:

| Acción   | Efecto |
|----------|--------|
| `start(opts)` | Filtra `source`, mezcla (o no), recorta a `limit`, crea `SessionState` nuevo, lo guarda. |
| `answer(value)` | Graba `answers[currentIndex] = value` (no avanza solo). |
| `goto(idx)` | Mueve `currentIndex` con clamp `[0, length-1]`. |
| `finish()` | Marca `finishedAt = Date.now()`. |
| `reset()` | `clear` localStorage + `setSession(null)` (vuelve a StartScreen). |

Cada mutación pasa por `update()` ([L101](../../src/components/quiz/useQuizSession.ts#L101)) que persiste con `save` en cada cambio (escritura síncrona en cada respuesta/navegación).

---

## 4. Tipos (`StartOpts`, `SessionState`, pregunta)

`SessionState` ([useQuizSession.ts:7](../../src/components/quiz/useQuizSession.ts#L7)):

```ts
type SessionState = {
  subjectId: string
  seed: number                              // semilla de la mezcla (mulberry32)
  questions: Question[]                      // SNAPSHOT ya filtrado y mezclado
  answers: Record<number, Answer>            // índice-en-questions → respuesta
  currentIndex: number
  startedAt: number                          // Date.now() al arrancar
  finishedAt: number | null
  cuatrimestre?: number | 'all' | 'latest'
  category?: string | 'all'
  repaso?: boolean
}
```

Nota importante: `questions` es un **snapshot inmutable** de la selección; `answers` se indexa por la **posición en ese snapshot**, no por id de pregunta. Por eso el scoring (`summarize`) y la revisión iteran `questions.forEach((q,i)=>answers[i])`.

`StartOpts` ([useQuizSession.ts:45](../../src/components/quiz/useQuizSession.ts#L45)):

```ts
type StartOpts = {
  limit?: number
  cuatrimestre?: number | 'all' | 'latest'
  category?: string | 'all'                  // filtro de categoría única (legacy)
  categories?: string[]                      // multi-categoría (prioritario sobre category)
  repaso?: boolean
}
```

Pregunta (`Question`, definida en la capa de datos `@lib/quiz/types` — referenciada, **no** documentada aquí; ver [types.ts:63](../../src/lib/quiz/types.ts#L63)):

- Unión discriminada por `kind`: `ChoiceQuestion` | `FillQuestion`.
- Comunes: `q`, y opcionales `context`, `code`, `category`, `group`, `cuatrimestre` (1|2), `hint`, `evidence`, `explanationCorrect`, `explanationWrong`, metadatos de fuente.
- `ChoiceQuestion`: `options: string[]` (2..8), `correctIndex: number | number[]`.
- `FillQuestion`: `accept: string | string[]`.
- `Answer = number | string` (índice para choice, texto para fill).
- Helpers usados por la UI: `isCorrect(q, picked)`, `primaryCorrect(q)`, `normalizeFill(s)` ([types.ts:164-185](../../src/lib/quiz/types.ts#L164)).

---

## 5. Tipos de pregunta (choice / fill / mixed)

`QuestionCard` ([QuestionCard.tsx:15](../../src/components/quiz/QuestionCard.tsx#L15)) es un dispatcher por `question.kind`. Coacciona el tipo de `chosen`: `string` para fill, `number` para choice.

### 5.1 Choice ([ChoiceQuestionCard.tsx](../../src/components/quiz/ChoiceQuestionCard.tsx#L27))

- `answered = chosen !== undefined`; `revealed = answered || repaso`.
- Una vez respondido, las opciones quedan deshabilitadas (`disabled={answered || repaso}`); **no se puede cambiar la respuesta**.
- **Máquina de estados de opción** `stateFor()` ([L18-L25](../../src/components/quiz/ChoiceQuestionCard.tsx#L18)), tipo `OptionState = 'idle'|'chosen'|'correct'|'wrong'|'reveal'`:
  - Sin responder → todas `idle`.
  - Acierto: la elegida → `correct`.
  - Fallo: la elegida → `wrong`; **todas** las correctas restantes → `reveal` (verde con anillo). Soporta multi-correcta ("cualquiera de estas").
  - El estado `'chosen'` (color accent) existe en `AnswerOption` pero `stateFor` no lo emite en este flujo (la opción se marca directamente `correct`/`wrong` al responder).
- Render de la opción: [AnswerOption.tsx](../../src/components/quiz/AnswerOption.tsx#L16) — letra A/B/C…, símbolos ✓/✕, `aria-pressed`, accent vía `style` inline.
- Extras: `ContextBox` (bloque "Reading / Contexto"), `code` en `<pre>`, `hint` (botón "Mostrar pista" cuando no respondida; visible directamente en repaso), `FeedbackBanner` al revelar.

### 5.2 Fill ([FillQuestionCard.tsx](../../src/components/quiz/FillQuestionCard.tsx#L17))

- Input de texto + botón "Comprobar". Se envía con `trim()`; vacío o ya respondido → no-op ([L23-L29](../../src/components/quiz/FillQuestionCard.tsx#L23)).
- La corrección la hace `isCorrect` (que normaliza con `normalizeFill`: trim + lowercase + colapsar espacios).
- `renderWithBlank` ([L77](../../src/components/quiz/FillQuestionCard.tsx#L77)) sustituye `___` en el enunciado por una "pastilla" visual.
- Tras responder, el input muestra `chosen` y se bloquea; bordes verde/rojo según acierto.

### 5.3 "Mixed" (mezcla de tipos / Mixto de inglés)

Hay dos sentidos distintos de "mixed":

1. **Banco mixto choice+fill**: el banco puede contener ambos `kind`; cada pregunta se renderiza con su card. El scoring lo trata uniformemente vía `isCorrect`. Cubierto por [`summary.test.ts`](../../src/components/quiz/__tests__/summary.test.ts) (run perfecto incluyendo un fill).
2. **Modo "Mixto" de inglés** (`subject.id === 'ingles'` y `cuatri === 'all'`): mezcla 1er + 2º cuatri **y** el grupo `latest-test`. Es la única configuración que incluye `latest-test`. En StartScreen, `isMixto` desactiva la selección por categorías ([StartScreen.tsx:51,90](../../src/components/quiz/StartScreen.tsx#L51)). Lógica de filtrado replicada y verificada en [`mixed-mode.test.ts`](../../src/components/quiz/__tests__/mixed-mode.test.ts).

---

## 6. Scoring cliente (`summary`, `shuffle`, semilla)

### 6.1 Summary ([summary.ts](../../src/components/quiz/summary.ts#L12))

```ts
summarize(session) → { correct, incorrect, unanswered, total, pct }
```

- Recorre `questions` por índice; `answers[i] === undefined` ⇒ `unanswered`; si no, `isCorrect` decide `correct`/`incorrect`.
- `total = questions.length`; `pct = round(correct/total*100)` (las saltadas penalizan el porcentaje porque cuentan en `total`).
- Usado tanto en `ResultsScreen` ([L17](../../src/components/quiz/ResultsScreen.tsx#L17)) como en `postQuizResult` ([postResult.ts:6](../../src/components/quiz/postResult.ts#L6)).

### 6.2 Shuffle y semilla ([shuffle.ts](../../src/components/quiz/shuffle.ts))

- `mulberry32(seed)`: PRNG determinista de 32 bits.
- `shuffled(arr, seed)`: Fisher–Yates con `mulberry32`. No muta el original (`arr.slice()`).
- La semilla se genera en `start` como `(Date.now() & 0xffffffff) >>> 0` ([useQuizSession.ts:65](../../src/components/quiz/useQuizSession.ts#L65)) y se guarda en `SessionState.seed`. El orden es reproducible a partir de la semilla, pero como el resultado mezclado ya se persiste en `questions`, la semilla es sobre todo trazabilidad/depuración: una recarga restaura el `questions` snapshot, no re-mezcla.
- Las **opciones dentro de una choice no se mezclan**; solo se mezcla el orden de las preguntas.

### 6.3 Resultados en pantalla ([ResultsScreen.tsx](../../src/components/quiz/ResultsScreen.tsx#L16))

- Porcentaje grande, `StatTile` para Aciertos/Fallos/Saltadas/Tiempo.
- `time` = `(finishedAt - startedAt)/1000` formateado `m:ss`.
- `<details>` "Ver revisión detallada" → `ReviewRow` por pregunta: estado (✅/⏭️/❌), enunciado, correcta (`primaryCorrect`), y "Tu respuesta" solo si falló. Para choice, "tu respuesta" es `q.options[chosen]`; para fill, el texto.

---

## 7. Filtros (cuatrimestre / categorías / límite)

### 7.1 En `start` (servidor de verdad de la selección) ([useQuizSession.ts:64-99](../../src/components/quiz/useQuizSession.ts#L64))

Orden de aplicación:

1. **Cuatrimestre**:
   - `'latest'` → solo `group === 'latest-test'`.
   - `'all'` → **todas** las preguntas (incluye `latest-test`).
   - número → `group !== 'latest-test'` y `(cuatrimestre ?? 1) === n`.
   - sin valor → todas menos `latest-test`.
2. **Categorías**: si `categories[]` no vacío, filtra por pertenencia (Set). Si no, usa `category` única (≠ `'all'`). `categories` tiene prioridad.
3. **Orden**: `preserveOrder ? [...filtered] : shuffled(filtered, seed)`.
4. **Límite**: `if (limit && limit < qs.length) qs = qs.slice(0, limit)` — recorte tras mezclar (selección aleatoria de N).

### 7.2 En `StartScreen` (UI de configuración) ([StartScreen.tsx](../../src/components/quiz/StartScreen.tsx#L41))

- **Cuatri**: pills solo si `subject.cuatrimestres.length > 1`. Etiquetas en `CUATRI_LABEL`. Pill "Mixto" (inglés) o "Todo el curso". Pill "Último test" solo si `subject.id === 'ingles'` y hay preguntas `latest-test`.
- **Categorías/temas**: `CategoryMultiCheck` ([CategoryMultiCheck.tsx](../../src/components/quiz/CategoryMultiCheck.tsx#L17)) con "Todos"/"Ninguno", contador por tema y total. `categoryLabel` mapea `unidad-N`/`tema-N`/`tN`/`udN` → "Tema N". Se ocultan en modo Mixto (`hasCategories = items.length>0 && !isMixto`).
- **Persistencia de selección de temas**: la selección se guarda en `localStorage` bajo `quiz-topics:{subject.id}` y se rehidrata filtrando a los temas válidos del cuatri actual ([L74-L88](../../src/components/quiz/StartScreen.tsx#L74)).
- **Recuento efectivo** `effectiveCount`: si Mixto o sin categorías → todas las del cuatri; si hay categorías → 0 si no hay temas marcados, si no las de los temas marcados.
- **Límite**: presets `[30,60,100]` filtrados a los `< effectiveCount`, más "Todas (N)". `resolvedLimit` y la etiqueta del botón muestran lo que se va a lanzar.
- `canStart`: con categorías, exige ≥1 tema; si no, exige `cuatriFiltered.length > 0`.
- `handleStart` traduce el estado UI a `StartOpts` y llama `onStart(limit, cuatri, cats, repaso)` ([L102-L106](../../src/components/quiz/StartScreen.tsx#L102)).

### 7.3 Filtros de la home (lista de asignaturas)

`SubjectFilters` ([SubjectFilters.tsx](../../src/components/quiz/SubjectFilters.tsx#L8)) filtra por `curso` y `cuatri` derivados de los propios subjects, vía `FilterRow` ([FilterRow.tsx](../../src/components/quiz/FilterRow.tsx#L16)). `SubjectCard` ([SubjectCard.tsx](../../src/components/quiz/SubjectCard.tsx#L4)) muestra icono/nombre/descr./recuento y CTA "Empezar →" o "Explorar →" según `entryMode` (`standard` | `hub`). `SubjectGrid` muestra un estado vacío con instrucciones de cómo añadir una asignatura.

---

## 8. Resultados y envío (`postResult` / `clientId`)

- **Disparo**: en `QuizSession`, un `useEffect` envía el resultado **una sola vez** por sesión terminada usando un `reportedRef`, y **solo si no es repaso** ([QuizSession.tsx:25-31](../../src/components/quiz/QuizSession.tsx#L25)). Al reiniciar (no terminada) se resetea el ref para permitir un nuevo envío.
- **`postQuizResult`** ([postResult.ts](../../src/components/quiz/postResult.ts#L5)): `POST /api/quiz/results` con `{ subjectId, clientId, correct, incorrect, unanswered, total, durationSeconds }`. `durationSeconds` se clampa a `[0, 12h]`. Es **best-effort**: cualquier error se traga con `console.warn`, sin afectar a la pantalla de resultados.
- **`clientId`** ([clientId.ts](../../src/components/quiz/clientId.ts)): identificador anónimo persistido en `localStorage` bajo `quiz:clientId`. Usa `crypto.randomUUID()` con fallback. En SSR devuelve `'ssr'`. No es autenticación; solo agrupa historiales por dispositivo/navegador.
- La estructura de la tabla/persistencia de resultados pertenece a `src/lib/quiz/*` y **no** se documenta aquí.

---

## 9. AiHelpButton / aiSearchUrl

- **`AiHelpButton`** ([AiHelpButton.tsx](../../src/components/quiz/AiHelpButton.tsx#L12)): botón icono robot junto al enunciado. Al pulsar abre en pestaña nueva (`noopener,noreferrer`) la URL de búsqueda IA. Para choice pasa también las `options`; para fill solo el enunciado. Acepta `question` o `query` libre.
- **`buildAiSearchUrl`** ([aiSearchUrl.ts](../../src/components/quiz/aiSearchUrl.ts#L6)): construye `https://www.google.com/search?q=...&udm=50` (Google **AI Mode**). Para choice etiqueta las opciones "A …. B …. C …." quitando puntos finales redundantes (`replace(/\.+$/,'')`). `URLSearchParams` codifica los especiales. Verificado en [`aiSearchUrl.test.ts`](../../src/components/quiz/__tests__/aiSearchUrl.test.ts).

---

## 10. Tests

Ubicación: [`src/components/quiz/__tests__/`](../../src/components/quiz/__tests__/). Vitest, entorno `node` (lógica pura, no render).

| Fichero | Qué cubre |
|---------|-----------|
| [`aiSearchUrl.test.ts`](../../src/components/quiz/__tests__/aiSearchUrl.test.ts) | `udm=50`, etiquetado A/B/C con punto final, no duplicar puntos, codificación (`:`→`%3A`, espacio→`+`). |
| [`option-state.test.ts`](../../src/components/quiz/__tests__/option-state.test.ts) | Réplica de `stateFor`: `idle` por defecto, `correct` con multi-correcta, `wrong` + `reveal` de todas las alternativas correctas. |
| [`summary.test.ts`](../../src/components/quiz/__tests__/summary.test.ts) | `summarize`: run perfecto con fill, multi-correcta ("any-of"), fallo + saltadas, `pct`. |
| [`mixed-mode.test.ts`](../../src/components/quiz/__tests__/mixed-mode.test.ts) | Filtrado por cuatri (1/2/latest/all=Mixto) y recorte por `limit`. |

**Deuda de tests**: `option-state.test.ts` y `mixed-mode.test.ts` **reimplementan** la lógica (`stateFor`, `filterForCuatri`) en lugar de importarla del componente/hook. Si la lógica real cambia, el test puede pasar sin reflejar el código de producción (riesgo de divergencia silenciosa). No hay tests de render de componentes ni del ciclo de vida de `useQuizSession` (hidratación, persistencia, envío único).

---

## 11. Casos borde y deuda

1. **Snapshot vs. semilla**: `questions` se persiste mezclado, así que la `seed` no se re-aplica al recargar; es redundante salvo para trazabilidad. Una recarga restaura el orden exacto guardado (bien), pero si en el futuro se quisiera "re-barajar igual" desde solo la semilla, faltaría el `source` original + el filtro exacto.
2. **`answers` indexado por posición**: depende de que `questions` no se reordene tras crear la sesión. Correcto hoy, pero frágil si algún flujo mutara el array.
3. **Reanudar deshabilitado**: `QuizSession` siempre pasa `hasResume={false}` y `onResume` no-op ([QuizSession.tsx:42-45](../../src/components/quiz/QuizSession.tsx#L42)). La reanudación real ocurre de forma implícita en `useQuizSession` (carga la sesión no terminada al hidratar), pero la UI de "Reanudar vs. Empezar de nuevo" del `StartScreen` está presente y muerta en este flujo. Sesión terminada **no** se reanuda; siempre lleva a Results hasta `reset`.
4. **Versionado destructivo**: subir `VERSION` no migra ni purga las claves antiguas (`quiz:v3:*` quedan huérfanas en `localStorage`). Solo deja de leerlas.
5. **Persistencia síncrona en cada acción**: cada `answer`/`goto` serializa todo el `SessionState` (incluido el array completo de preguntas) a `localStorage`. Para bancos grandes puede ser pesado; sin throttle.
6. **`category` (singular) legacy**: `StartOpts.category` sigue existiendo y `SessionState.category` se guarda, pero `StartScreen` solo emite `categories[]`. `category` queda como ruta no usada por el flujo principal (sí potencialmente por modos `redes`/externos).
7. **Scoring penaliza saltadas**: las no respondidas cuentan en `total` ⇒ bajan el `pct`. Es intencional pero conviene tenerlo presente (no es "% sobre respondidas").
8. **Envío best-effort sin reintento**: un fallo de red en `postQuizResult` pierde el resultado del historial silenciosamente (solo `console.warn`). La pantalla del usuario no se entera.
9. **`fill` en repaso**: `FillQuestionCard` fuerza `ok = true` en repaso y muestra `primaryCorrect` en el input ([FillQuestionCard.tsx:20,31](../../src/components/quiz/FillQuestionCard.tsx#L20)). El detalle del **modo repaso** se documenta en `specs/quiz-repaso/`.
10. **`latest-test` acoplado a inglés**: tanto `StartScreen` como `start` tratan `latest-test` y el modo "Mixto" con condicionales `subject.id === 'ingles'` ([StartScreen.tsx:45,57](../../src/components/quiz/StartScreen.tsx#L45)). Acoplamiento por subject id concreto; añadir otra asignatura con "último test" requeriría tocar estos condicionales.
11. **Opciones no barajadas**: solo se mezcla el orden de preguntas, no el de las opciones dentro de cada choice. Si fuese deseable, no está implementado.
