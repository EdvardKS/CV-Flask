# Spec: Redes — implementación (código)

**Estado:** DOCUMENTADO (ingeniería inversa del código)
**Ámbito:** `src/lib/quiz/redes.ts`, `src/components/quiz/redes/*`, `app/quiz/redes/*`, `app/api/quiz/redes/*`
**Revisión:** 2026-06-08

> Documentación complementaria a los specs de intención (`constitution.md`, `clarify.md`, `plan.md`, `tasks.md`). Aquí se describe **el código tal y como está**, no la intención. Todas las referencias son enlaces relativos con número de línea.

---

## 1. Propósito

La asignatura **Redes** es una asignatura de tipo *hub*: en lugar de un único listado de preguntas, ofrece tres modos de estudio sobre el mismo banco de material extraído de las carpetas de Redes (cuestionarios PDF, exámenes de clase, PPTX convertidos, OCR de PNG y PDFs de contenido teórico).

Los tres modos son:

1. **Cuestionarios de temario** — preguntas tipo test agrupadas por tema, mezclables o por cuestionario individual.
2. **Tests de autoevaluación** — banco oficial de preguntas por Unidad Didáctica (UD), con pista y explicación.
3. **Conceptos importantes por tema** — visor de páginas clave del PDF de contenido con resaltados y criterio de examen.

Todo el material vive en `public/data/quiz/redes/` (manifiestos JSON + PDFs en `assets/`). El loader es **server-only** y los manifiestos se validan con Zod en el momento de leerlos.

---

## 2. Modos y rutas

| Modo | Ruta listado | Ruta sesión / detalle | API espejo |
|------|--------------|------------------------|------------|
| Hub | [`app/quiz/redes/page.tsx`](../../app/quiz/redes/page.tsx#L20) | — | [`/api/quiz/redes/summary`](../../app/api/quiz/redes/summary/route.ts#L7) |
| 1 · Temario | [`app/quiz/redes/temario/page.tsx`](../../app/quiz/redes/temario/page.tsx#L21) | [`temario/[quizId]/page.tsx`](../../app/quiz/redes/temario/[quizId]/page.tsx#L17) | [`/api/quiz/redes/temario`](../../app/api/quiz/redes/temario/route.ts#L7) · [`/temario/[quizId]`](../../app/api/quiz/redes/temario/[quizId]/route.ts#L7) |
| 2 · Autoevaluación | (selección en el hub) | [`app/quiz/redes/autoevaluacion/page.tsx`](../../app/quiz/redes/autoevaluacion/page.tsx#L22) | (sirve preguntas vía temario/summary; sin endpoint propio) |
| 3 · Conceptos | [`app/quiz/redes/conceptos/page.tsx`](../../app/quiz/redes/conceptos/page.tsx#L20) | [`conceptos/[topic]/page.tsx`](../../app/quiz/redes/conceptos/[topic]/page.tsx#L17) | [`/api/quiz/redes/concepts`](../../app/api/quiz/redes/concepts/route.ts#L7) · [`/concepts/[topic]`](../../app/api/quiz/redes/concepts/[topic]/route.ts#L7) |

Notas de routing:

- **Todas** las páginas y rutas API declaran `export const dynamic = 'force-dynamic'` y llaman a `ensureQuizSeeded()` antes de leer datos (ver [`page.tsx`](../../app/quiz/redes/page.tsx#L13)).
- El sujeto se resuelve con `getSubject('redes')` ([repo](../../app/quiz/redes/page.tsx#L2)); si no existe, el hub/temario lanzan `Error` y las páginas de detalle hacen `notFound()`.
- Los tres modos del hub envían la selección de temas a su `destination` mediante un querystring `?temas=<id,id,...>` (codificado y ordenado), parseado en cada página con un helper local `parseTemas()` idéntico en las tres páginas ([ejemplo](../../app/quiz/redes/autoevaluacion/page.tsx#L16)).

### Flujo de selección de temas → sesión

1. El usuario marca temas en el `TopicMultiSelect` del hub.
2. Al pulsar el CTA, `router.push(\`${destination}?temas=...\`)` ([`TopicMultiSelect.tsx`](../../src/components/quiz/redes/TopicMultiSelect.tsx#L53)).
3. La página destino parsea `temas`, valida los ids contra el manifiesto, carga las preguntas y monta un `<QuizSession>` con una `sessionKey` derivada de los temas ordenados (p. ej. `redes-autoeval:UD1+UD2`).

---

## 3. Hub de modos

[`RedesModeHub`](../../src/components/quiz/redes/RedesModeHub.tsx#L22) (Server Component, renderizado desde el hub page) recibe:

```ts
{ subject, summary, temarioTopics, autoevalTopics, conceptTopics }
```

Los arrays de temas se construyen en la página hub ([`page.tsx`](../../app/quiz/redes/page.tsx#L29)) mapeando cada manifiesto a `TopicOption { id, title, count }`:

- **temarioTopics** → `count` = suma de `questionCount` de los quizzes del tema.
- **autoevalTopics** → `count` = `questionCount` del topic.
- **conceptTopics** → `count` = `slides.length`.

El hub renderiza tres tarjetas (`Modo 1/2/3`), cada una con:

- Una insignia con el conteo agregado del modo (`summary.temarioQuizCount` tests, `summary.autoevaluacionCount` preguntas, `summary.conceptTopicCount` temas).
- Para temario y conceptos, un enlace al **listado clásico** (`/quiz/redes/temario`, `/quiz/redes/conceptos`).
- Un `TopicMultiSelect` con su propio `storageKey`, `destination`, `ctaLabel` y `countLabel`.

La tarjeta de autoevaluación se **deshabilita visualmente** (`cardClasses(true)`, [línea 56](../../src/components/quiz/redes/RedesModeHub.tsx#L56)) cuando `summary.autoevaluacionCount === 0`, y muestra `emptyHint`. El color de acento (`subject.color`) se aplica inline a etiquetas y CTAs.

### TopicMultiSelect

[`TopicMultiSelect`](../../src/components/quiz/redes/TopicMultiSelect.tsx#L32) (Client Component) envuelve el `CategoryMultiCheck` genérico ([import](../../src/components/quiz/redes/TopicMultiSelect.tsx#L5)) y añade:

- **Persistencia en `localStorage`** bajo `storageKey` (uno por modo: `redes-temario-topics`, `redes-autoeval-topics`, `redes-conceptos-topics`). Lectura tolerante a errores en `readStored()` ([línea 20](../../src/components/quiz/redes/TopicMultiSelect.tsx#L20)); solo conserva strings.
- **Hidratación segura**: al montar valida los ids guardados contra `topics` actuales (descarta ids obsoletos) y marca `hydrated` antes de empezar a persistir, para no pisar el storage durante SSR ([efecto](../../src/components/quiz/redes/TopicMultiSelect.tsx#L37)).
- **Navegación**: `start()` no hace nada con selección vacía; ordena los ids (`[...selected].sort()`) y los une con coma en `?temas=` ([línea 53](../../src/components/quiz/redes/TopicMultiSelect.tsx#L53)).
- El botón CTA se oculta si `topics.length === 0` y se deshabilita si `disabled || selected.size === 0`.

`TopicOption` es un alias de `MultiCheckItem` (`{ id, title, count }`).

---

## 4. Viewer de conceptos (PDF + highlights + IA)

[`PdfConceptViewer`](../../src/components/quiz/redes/PdfConceptViewer.tsx#L16) (Client Component) recibe `{ deck: SlideConceptDeck, accent }` desde [`conceptos/[topic]/page.tsx`](../../app/quiz/redes/conceptos/[topic]/page.tsx#L32).

### Renderizado del PDF

- Usa **pdfjs-dist** (`getDocument`, `GlobalWorkerOptions`) directamente en el cliente. El worker se configura con `new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url)` ([línea 9](../../src/components/quiz/redes/PdfConceptViewer.tsx#L9)).
- Estado de navegación por slide: `index` (0-based). El slide activo es `deck.slides[index]`.
- **Carga del documento** (`useEffect` sobre `deck.pdfUrl`, [línea 23](../../src/components/quiz/redes/PdfConceptViewer.tsx#L23)): estado `loading | ready | error`; usa un flag `cancelled` para destruir el doc si el efecto se reejecuta antes de resolver.
- **Render de la página** (`useEffect` sobre `pdf` y `slide.page`, [línea 44](../../src/components/quiz/redes/PdfConceptViewer.tsx#L44)): obtiene `pdf.getPage(slide.page)`, viewport a `scale: 1.3`, pinta en un `<canvas>` y cancela la `renderTask` si el efecto se desmonta.
- En error muestra "No se ha podido renderizar el PDF de este tema."; en `loading` un texto "Cargando material...".

### Highlights

Sobre el canvas hay una capa absoluta `pointer-events-none` que dibuja cada `slide.highlights` como un recuadro ámbar ([línea 88](../../src/components/quiz/redes/PdfConceptViewer.tsx#L88)). Las coordenadas son **porcentuales** (`x/y/w/h` en 0–100, posicionadas con `left/top/width/height` en `%`), de modo que escalan con el ancho del canvas sin depender del tamaño real del render. La `key` combina `slide.id + label + x + y`.

### Botón IA

[`AiHelpButton`](../../src/components/quiz/AiHelpButton.tsx#L12) se renderiza en la cabecera del concepto con `query={slide.searchText}` ([línea 77](../../src/components/quiz/redes/PdfConceptViewer.tsx#L77)). Al pulsar abre en pestaña nueva una búsqueda de **Google AI Mode** (`udm=50`) construida por [`buildAiSearchUrl`](../../src/components/quiz/aiSearchUrl.ts#L6). En este modo (sin `question`, solo `query`) la URL es simplemente el `searchText` del slide. (En el modo quiz el mismo botón etiqueta las opciones A/B/C…).

### Resto de la UI

- Cabecera: título del slide, "Página N del PDF · X / Y" y el botón IA.
- Bloque "Por qué importa" con `slide.explanation` y un recuadro ámbar con `slide.examRelevance` ([línea 108](../../src/components/quiz/redes/PdfConceptViewer.tsx#L108)).
- Navegación Anterior/Siguiente con límites (`canPrev`/`canNext`) y un indicador de progreso memoizado.

---

## 5. Loader server-only ([`redes.ts`](../../src/lib/quiz/redes.ts#L1))

Módulo marcado con `import 'server-only'` ([línea 1](../../src/lib/quiz/redes.ts#L1)): no puede importarse desde el cliente. Lee de forma **síncrona** (`readFileSync`) los manifiestos de `public/data/quiz/redes/` resueltos con `process.cwd()` ([línea 17](../../src/lib/quiz/redes.ts#L17)).

`readJson<T>()` ([línea 19](../../src/lib/quiz/redes.ts#L19)) hace `JSON.parse` + un `parse` validador (Zod) por llamada. No hay caché: cada invocación relee y revalida el fichero.

### Funciones exportadas

| Función | Fichero | Devuelve | Notas |
|---------|---------|----------|-------|
| `getRedesTemarioManifest()` | `temario.json` | `RedesTemarioManifest` | validado con `redesTemarioManifestSchema` |
| `getRedesConceptManifest()` | `concepts.json` | `RedesConceptManifest` | |
| `getRedesAutoevalManifest()` | `autoevaluacion.json` | `RedesAutoevalManifest` | |
| `getRedesAutoevalQuestions(topicIds)` | — | `Question[]` | filtra `manifest.questions` por `q.category ∈ topicIds`; `[]` si lista vacía ([L37](../../src/lib/quiz/redes.ts#L37)) |
| `getRedesTemarioQuestionsByTopics(topicIds)` | — | `Question[]` | concatena las preguntas de **todos** los quizzes de los temas seleccionados ([L44](../../src/lib/quiz/redes.ts#L44)) |
| `getRedesModeSummary()` | — | `SubjectModeSummary` | agrega conteos de los 3 manifiestos ([L56](../../src/lib/quiz/redes.ts#L56)) |
| `getRedesQuizById(quizId)` | — | `TemarioQuiz \| null` | busca en todos los temas ([L73](../../src/lib/quiz/redes.ts#L73)) |
| `getRedesConceptTopic(topicId)` | — | `SlideConceptDeck \| null` | busca el deck por id ([L82](../../src/lib/quiz/redes.ts#L82)) |

**Detalle importante — autoevaluación por categoría:** `getRedesAutoevalQuestions` filtra por `q.category`, no por el `topic.id` directamente. En los datos actuales coinciden: los `topic.id` del manifiesto de autoevaluación son `UD1..UD6` y las preguntas llevan `category: 'UD1'..'UD6'` (verificado: 10/10/10/10/19/10 = 69 preguntas). La página de autoevaluación valida los temas del querystring contra `manifest.topics.map(t => t.id)` antes de llamar al loader ([`autoevaluacion/page.tsx`](../../app/quiz/redes/autoevaluacion/page.tsx#L34)).

`getRedesModeSummary` calcula:
- `autoevaluacionCount` = `autoeval.questions.length`
- `temarioQuizCount` = Σ `topic.quizzes.length`
- `temarioQuestionCount` = Σ Σ `quiz.questionCount`
- `conceptTopicCount` = `concepts.topics.length`

---

## 6. APIs (contratos)

Todas las rutas son `GET`, `force-dynamic`, llaman a `ensureQuizSeeded()`, envuelven en `try/catch` con `console.error('[quiz/redes/...]', error)` y devuelven `{ error }` con status `500` ante fallo. Son **espejos JSON** de las funciones del loader (mismos datos que consumen las páginas, para consumo externo/depuración).

| Endpoint | Handler | Éxito (200) | Error |
|----------|---------|-------------|-------|
| `GET /api/quiz/redes/summary` | [route.ts](../../app/api/quiz/redes/summary/route.ts#L7) | `SubjectModeSummary` | 500 |
| `GET /api/quiz/redes/temario` | [route.ts](../../app/api/quiz/redes/temario/route.ts#L7) | `RedesTemarioManifest` completo | 500 |
| `GET /api/quiz/redes/temario/[quizId]` | [route.ts](../../app/api/quiz/redes/temario/[quizId]/route.ts#L7) | `TemarioQuiz` | **404** `{error:'Unknown quiz'}` si no existe; 500 |
| `GET /api/quiz/redes/concepts` | [route.ts](../../app/api/quiz/redes/concepts/route.ts#L7) | `RedesConceptManifest` completo | 500 |
| `GET /api/quiz/redes/concepts/[topic]` | [route.ts](../../app/api/quiz/redes/concepts/[topic]/route.ts#L7) | `SlideConceptDeck` | **404** `{error:'Unknown topic'}` si no existe; 500 |

No hay endpoint dedicado de autoevaluación: la autoevaluación se sirve a través de la página y comparte el conteo vía `summary`. `params` se resuelve como `Promise` (App Router de Next 15): `const { quizId } = await params`.

---

## 7. Estructura de datos

Schemas Zod definidos en [`src/lib/quiz/types.ts`](../../src/lib/quiz/types.ts#L100). Datos en `public/data/quiz/redes/`.

### `temario.json` → `RedesTemarioManifest` ([schema](../../src/lib/quiz/types.ts#L100))

```
{ subjectId: 'redes', topics: TemarioTopic[] }   // 6 temas
TemarioTopic { id, topic:number, title, supportMaterials: TemarioSupportMaterial[], quizzes: TemarioQuiz[] }
TemarioQuiz  { id, topic, title, sourceFile, sourceType?, questionCount, questions: Question[] }
TemarioSupportMaterial { id, title, sourceFile, sourceType, questionCount }
```

- `sourceType` observados en quizzes: `pdf-cuestionario`, `pdf-cuestionario-clase`, `png-ocr`, `pptx-convertido`.
- `questions` usa el `questionsSchema` genérico (discriminated union `choice` / `fill`; objetos sin `kind` se preprocessan como `choice`, [L55](../../src/lib/quiz/types.ts#L55)).
- En el listado de temario, `supportMaterials` se muestran como chips informativos (no clicables) y los `quizzes` como enlaces a `temario/[quizId]`.

### `autoevaluacion.json` → `RedesAutoevalManifest` ([schema](../../src/lib/quiz/types.ts#L150))

```
{ subjectId:'redes',
  topics: { id:'UD1'.., topic, title, questionCount }[],   // 6 UDs
  questions: Question[] }                                   // 69, con category 'UDn'
```

Las preguntas llevan `hint`, `explanationCorrect`, `explanationWrong`, `sourceFile`, `sourceType`. El vínculo tema↔pregunta es `topic.id === question.category`.

### `concepts.json` → `RedesConceptManifest` ([schema](../../src/lib/quiz/types.ts#L136))

```
{ subjectId:'redes', topics: SlideConceptDeck[] }   // 6 decks
SlideConceptDeck { id, topic, title, pdfUrl, pageCount, slides: SlideConceptEntry[]>=1 }
SlideConceptEntry { id, page, title, highlights: Highlight[]>=1, explanation, examRelevance, searchText }
Highlight { x, y, w, h, label }   // x/y/w/h en rango 0..100 (porcentual)
```

- `pdfUrl` apunta a `/data/quiz/redes/assets/tema-N-contenido.pdf`.
- `slides[].page` es 1-based contra el PDF (`pageCount` total).

### Assets ([`public/data/quiz/redes/assets/`](../../public/data/quiz/redes/assets))

6 PDFs de contenido teórico: `tema-1-contenido.pdf` … `tema-6-contenido.pdf` (~1.4–2.1 MB c/u). Son los renderizados por el `PdfConceptViewer`.

### `redes.json` (banco plano) ([fichero](../../public/data/quiz/redes.json))

`public/data/quiz/redes.json` (≈130 KB) es el **array plano** de todas las preguntas de la asignatura (no anidado por tema). No lo consume el loader server-only; sirve de fuente derivada/seed y lo usa un test de consistencia para verificar que las preguntas `pdf-cuestionario-clase` aparecen exactamente una vez (ver §8).

---

## 8. Tests

Dos suites en entorno `node` (`// @vitest-environment node`):

### [`redes.test.ts`](../../src/lib/quiz/__tests__/redes.test.ts#L4) — manifiestos

- Verifica el **summary exacto**: `{ autoevaluacionCount: 69, temarioQuizCount: 17, temarioQuestionCount: 309, conceptTopicCount: 6 }`.
- `getRedesQuizById('tema-2-1-examen-test')`: tema 2, 30 preguntas, primera pregunta `kind:'choice'`, `cuatrimestre:2`, `category:'tema-2'`, `sourceFile:'Tema 2.1.-Examen Test.pdf'`, `sourceType:'pdf-cuestionario'`.
- `getRedesQuizById('tema-5-repaso-del-temario')`: 5 preguntas, `sourceType:'pptx-convertido'`, `sourceFile:'IPv6-El-Futuro-de-Internet.pptx'`.
- `getRedesConceptTopic('tema-5')`: tema 5, ≥5 slides, el primer slide tiene ≥1 highlight.

### [`redes-examenes-clase.test.ts`](../../src/lib/quiz/__tests__/redes-examenes-clase.test.ts#L8) — exámenes de clase

- Para temas **1..4** existe el quiz `tema-N-examenes-de-clase` con `sourceType:'pdf-cuestionario-clase'` y `questionCount === questions.length > 0`.
- Cada pregunta: `kind:'choice'`, `category:'tema-N'`, exactamente **4 opciones** no vacías, `correctIndex` numérico en `[0,3]`, `sourceFile` que casa `/^Examen Ud\./`.
- **Deduplicación**: ninguna pregunta (normalizada con `normalize()`, minúsculas + solo alfanumérico/acentos) se repite frente a otros quizzes del mismo tema ni dentro del propio quiz.
- **Consistencia con el banco plano**: el conjunto de preguntas `pdf-cuestionario-clase` en `redes.json` es exactamente igual (multiset normalizado) al del manifiesto de temario ([L54](../../src/lib/quiz/__tests__/redes-examenes-clase.test.ts#L54)).

**No cubierto por tests:** componentes React (hub, viewer PDF, multiselect), rutas API, manifiesto de autoevaluación (más allá del `autoevaluacionCount` del summary), y validación de coordenadas de highlights.

---

## 9. Notas / deuda

- **Sin caché en el loader.** `readJson` relee + revalida con Zod en cada llamada y cada página/API es `force-dynamic`, por lo que `temario.json` (~197 KB) se parsea y valida en cada request. Candidato a memoización a nivel de módulo.
- **`parseTemas` triplicado.** El mismo helper está copiado en las tres páginas ([temario](../../app/quiz/redes/temario/page.tsx#L15), [autoevaluacion](../../app/quiz/redes/autoevaluacion/page.tsx#L16), [conceptos](../../app/quiz/redes/conceptos/page.tsx#L14)). Podría extraerse.
- **Acoplamiento `category`↔`id` en autoevaluación.** El filtrado de preguntas depende de que `question.category` coincida con `topic.id` (`UDn`), invariante no garantizada por schema; si divergen, un tema devolvería 0 preguntas en silencio.
- **Autoevaluación sin endpoint API propio**, a diferencia de temario y conceptos (asimetría respecto a las "APIs espejo").
- **Render PDF en cliente.** `pdfjs-dist` se carga y renderiza en el navegador; no hay fallback de imagen ni precarga. El error de render se limita a un mensaje de texto.
- **Texto acoplado a la procedencia.** Subtítulos del temario mencionan rutas internas (`temp/REDES`, "tus carpetas de Redes"), que reflejan el pipeline de extracción más que conceptos de producto.
- **Validación parcial de selección.** Conceptos no valida los ids de `?temas` contra el manifiesto (filtra por intersección, [`conceptos/page.tsx`](../../app/quiz/redes/conceptos/page.tsx#L31)); temario y autoevaluación sí descartan ids inválidos.
