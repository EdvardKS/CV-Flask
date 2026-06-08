# Spec: Pipeline de datos y scripts

**Estado:** DOCUMENTADO (ingeniería inversa del código)
**Ámbito:** `scripts/*`, `public/data/quiz`, `app/api/resumen`
**Revisión:** 2026-06-08

---

## 1. Propósito

Esta spec documenta, mediante ingeniería inversa del código, el **pipeline de datos del módulo de quizzes** (asignatura *Redes* como caso completo) y el **endpoint `/api/resumen`** (subsistema padel, no relacionado con quizzes).

El pipeline de quizzes transforma material docente crudo (PDF, PPTX, capturas PNG) en ficheros JSON estables bajo [`public/data/quiz/`](../../public/data/quiz), que el seed [`src/lib/quiz/seed.ts`](../../src/lib/quiz/seed.ts) ingiere a una base de datos SQLite. Los scripts son **Python** (generación/parseo de Redes) y **JavaScript** (parche puntual de Estadística).

Todo el pipeline trabaja en **UTF-8** y aplica reparaciones de *mojibake* sobre el texto extraído de los PDF/PPTX.

---

## 2. Flujo de datos (crudo → JSON → SQLite)

```
temp/REDES/<tema N>/*.pdf|*.pptx|*.png          (material crudo de apoyo)
temp/REDESNUEVOHOY/Examen Ud.*.pdf              (exámenes tipo test de clase)
        │
        │  pdftotext -layout -enc UTF-8  (manual, fuera de los scripts)
        ▼
temp/REDESNUEVOHOY/Examen Ud.*.txt              (volcado de texto)
        │
        │  scripts/parse_redesnuevohoy.py
        ▼
scripts/redes_examenes_clase.json               (dataset persistente, committeado)
        │
        │  scripts/generate_redes_data.py   (== pnpm generate:redes)
        │   + temp/REDES/<tema N>/*  (materiales de apoyo)
        │   + public/data/quiz/redes/{temario,concepts}.json  (base previa)
        ▼
public/data/quiz/redes/temario.json             (manifest temas → quizzes anidados)
public/data/quiz/redes/concepts.json            (slides de conceptos)
public/data/quiz/redes.json                      (lista plana de preguntas — la que ingiere el seed)
        │
        │  src/lib/quiz/seed.ts  (lee public/data/quiz/<id>.json según _subjects.json)
        ▼
data/quiz/quiz.db  (SQLite: tablas quiz_subjects, quiz_questions, quiz_seed_state)
```

Notas clave del flujo:

- Las carpetas `temp/` están en `.gitignore`; el material crudo y los `.txt` **no se commitean**. El único artefacto intermedio committeado es [`scripts/redes_examenes_clase.json`](../../scripts/redes_examenes_clase.json).
- El paso `pdftotext` es **manual** (requiere `poppler-utils` en el PATH); no lo ejecuta ningún script Node/Python del repo.
- El seed **no** lee los manifests anidados (`redes/temario.json`, `redes/concepts.json`); solo lee el JSON plano por asignatura listado en [`public/data/quiz/_subjects.json`](../../public/data/quiz/_subjects.json) (para Redes, [`public/data/quiz/redes.json`](../../public/data/quiz/redes.json)). Los manifests anidados los consume el frontend.

---

## 3. Scripts (tabla)

| Archivo | Entrada | Salida | Función |
|---------|---------|--------|---------|
| [`scripts/parse_redesnuevohoy.py`](../../scripts/parse_redesnuevohoy.py) | `temp/REDESNUEVOHOY/Examen Ud.*.txt` (volcados `pdftotext`) | `scripts/redes_examenes_clase.json` | Parsea texto de exámenes tipo test a `{tema-N: [{number, q, options[4], correctIndex, sourceFile, ud}]}`. |
| [`scripts/test_parse_redesnuevohoy.py`](../../scripts/test_parse_redesnuevohoy.py) | (samples en memoria) | resultado unittest | TDD del parser: dos formatos de pregunta, cabeceras de soluciones, opciones multilínea, descarte de preguntas incompletas. |
| [`scripts/generate_redes_data.py`](../../scripts/generate_redes_data.py) | `scripts/redes_examenes_clase.json` + `temp/REDES/tema *` (materiales) + `public/data/quiz/redes/{temario,concepts}.json` (base) | `public/data/quiz/redes/temario.json`, `public/data/quiz/redes/concepts.json`, `public/data/quiz/redes.json` | Construye los manifests del front y la lista plana; añade quizzes manuales del profesor + exámenes de clase deduplicados. Es `pnpm generate:redes`. |
| [`scripts/append-estadistica-ud1-ud3.js`](../../scripts/append-estadistica-ud1-ud3.js) | `public/data/quiz/estadistica.json` | `public/data/quiz/estadistica.json` (sobrescrito) | Parche idempotente-NO: concatena 32 preguntas de UD1/UD3 al banco de Estadística existente. |
| [`scripts/REDES_EXAMENES_CLASE.md`](../../scripts/REDES_EXAMENES_CLASE.md) | — | — | Documentación operativa del subpipeline de exámenes de clase (no es ejecutable). |

Comando empaquetado en `package.json`:

```bash
pnpm generate:redes      # → python scripts/generate_redes_data.py
```

---

## 4. `generate_redes_data.py`

Script principal de generación de la asignatura Redes. Rutas base ([líneas 9-13](../../scripts/generate_redes_data.py)): `ROOT = scripts/..`, material crudo en `temp/REDES`, salidas en `public/data/quiz/` y `public/data/quiz/redes/`, y dataset de clase en `scripts/redes_examenes_clase.json`.

**Reparación de texto (UTF-8 / mojibake).** `maybe_fix_mojibake` (líneas 124-134) intenta corregir mojibake en dos pasos: si el texto contiene tokens sospechosos (`Â Ã â ð`) reinterpreta vía `latin1 → utf-8`; después aplica un diccionario fijo `WORD_FIXES` (líneas 17-92) que sustituye patrones con `?` por la tilde correcta (`Introducci?n → Introducción`, etc.). `deep_fix` aplica esto recursivamente a strings, listas y dicts.

**Construcción del manifest temario** (`build_temario_manifest`, líneas 392-436):

1. Parte de `redes/temario.json` (base previa) y normaliza con `deep_fix`.
2. Garantiza los 6 temas (`TOPIC_TITLES`), fija títulos, y regenera `supportMaterials` por tema desde el sistema de ficheros (`build_support_materials`, líneas 180-210): clasifica cada fichero de `temp/REDES/tema N/` en `pdf-teorico`, `pptx-convertido`, `pdf-ejercicio` o `pdf-cuestionario` según nombre/extensión.
3. Inyecta los **quizzes manuales** del profesor (`build_manual_quizzes`, líneas 213-343): bancos curados a mano con `sourceType` `png-ocr` (capturas) y `pptx-convertido` (repasos del temario), uno por tema.
4. Inyecta los **exámenes de clase** deduplicados (`build_examenes_clase_quizzes`, líneas 351-389), explicado abajo.
5. Ordena temas (1..6) y quizzes (por `id`).

**Salidas** (`main`, líneas 461-471, vía `write_json` con `ensure_ascii=False, indent=2` + `\n` final):

- `public/data/quiz/redes/temario.json` — manifest jerárquico `{subjectId, topics:[{id, topic, title, supportMaterials, quizzes:[{id, topic, title, sourceFile, sourceType, questionCount, questions:[…]}]}]}`.
- `public/data/quiz/redes/concepts.json` — slides de conceptos con títulos por tema (`build_concepts_manifest`, líneas 439-444).
- `public/data/quiz/redes.json` — **lista plana** de todas las preguntas de todos los quizzes (`build_flat_questions`, líneas 447-453); es la que consume el seed.

**Forma de una pregunta** (`question`, líneas 155-165): `{kind:"choice", q, options, correctIndex, cuatrimestre:2, category:"tema-N", …extra}` donde `extra` añade `sourceFile`, `sourceType`, `evidence`, `sourceSlide`, `ud` según el origen.

---

## 5. `parse_redesnuevohoy.py` (+ su test)

**Entrada:** `temp/REDESNUEVOHOY/Examen Ud.*.txt` (volcados de `pdftotext -layout -enc UTF-8`).
**Salida:** [`scripts/redes_examenes_clase.json`](../../scripts/redes_examenes_clase.json) — `{tema-N: [{number, q, options[4], correctIndex, sourceFile, ud}]}` con `ensure_ascii=False`.

**`parse_file`** (líneas 32-127) es una máquina de estados línea a línea que tolera dos formatos de PDF:

- `N. ¿pregunta?` seguida de opciones `A)`/`A.` en mayúsculas.
- `Pregunta N` en línea propia + pregunta en la siguiente + opciones `a)` en minúsculas.

Reglas:

- Líneas que no arrancan con número de pregunta ni con letra de opción se **concatenan** al elemento abierto (preguntas/opciones partidas en varias líneas).
- La sección de soluciones se detecta por cabecera que empiece por `SOLUCIONES`/`RESPUESTAS`/`Soluciones`/`Respuestas` (incl. `Respuestas correctas`). Cada línea `N. X` (X ∈ A–D/a–d) se normaliza a mayúscula y mapea a `correctIndex` 0..3.
- Se **descartan** preguntas sin las 4 opciones completas (no vacías) o sin solución asociada.
- Se ignoran líneas de cabecera administrativa (`EXAMEN ... TIPO`, `Asignatura:`, `Duración`, `Instrucciones:`, `Tema ... examen`).

**`main`** (líneas 133-158): recorre `Examen Ud.*.txt`, extrae tema/subunidad del nombre vía `UD_RE` (`Examen Ud.(\d+)(?:\.(\d+))?.txt`), etiqueta cada pregunta con `sourceFile` (el `.pdf` equivalente) y `ud` (`Ud.1`, `Ud.1.2`, …), agrupa por `tema-N` y escribe el JSON. Imprime totales por tema.

**Test** [`scripts/test_parse_redesnuevohoy.py`](../../scripts/test_parse_redesnuevohoy.py) (unittest, líneas 26-141): casos cubiertos — formato `N.` + `SOLUCIONES`, formato `Pregunta N` + minúsculas + `RESPUESTAS`, cabecera `Respuestas correctas`, opciones multilínea concatenadas, descarte de preguntas sin respuesta y con menos de 4 opciones. Se ejecuta con `python scripts/test_parse_redesnuevohoy.py`.

### 5.1 Dedup en `generate_redes_data.py`

`build_examenes_clase_quizzes` (líneas 351-389) toma `redes_examenes_clase.json` y, por tema, crea una **única** quiz `tema-N-examenes-de-clase` con `sourceType:"pdf-cuestionario-clase"`:

- `_normalize_question` (líneas 346-348): minúsculas + fix mojibake + elimina todo carácter no alfanumérico latino. Es la clave de deduplicación.
- Antes de añadir, se construye un `set` con **todas** las preguntas ya presentes en el manifest (cuestionarios PDF + quizzes manuales). Las preguntas de clase normalizadas que ya existan se descartan, igual que duplicados intra-quiz.
- Las preguntas conservan `sourceFile` (PDF de origen) y `ud` (`Ud.X.Y`); todas las de un tema viven en la misma quiz, ordenadas por `(ud, number)`.

Tamaños documentados (bruto → tras dedup), según [`REDES_EXAMENES_CLASE.md`](../../scripts/REDES_EXAMENES_CLASE.md): Tema 1: 60→21; Tema 2: 90→24; Tema 3: 60→57; Tema 4: 40→40.

---

## 6. `append-estadistica-ud1-ud3.js`

Script Node CommonJS de **parche puntual** (no Next, no TypeScript).

**Entrada/Salida:** lee y sobrescribe [`public/data/quiz/estadistica.json`](../../public/data/quiz/estadistica.json).

**Función** (líneas 24-392): define dos lotes (`ud1` con 10 preguntas, `ud3` con 22) construidos con el helper `mk(cat, q, opts, ci, hint, ec, ew)` que produce `{cuatrimestre:1, category, q, options, correctIndex, hint, explanationCorrect, explanationWrong}`. Concatena ambos lotes al array existente (`cur.concat(ud1, ud3)`) y reescribe el fichero con `JSON.stringify(out, null, 2)`. Imprime el total resultante.

> A diferencia del pipeline de Redes, este script **no deduplica** ni reescribe desde cero: cada ejecución **vuelve a anexar** las 32 preguntas. No es idempotente — está pensado para correrse una sola vez. Las preguntas usan el esquema de quiz con `hint`/`explanationCorrect`/`explanationWrong` (no presentes en las de Redes).

---

## 7. API `/api/resumen`

[`app/api/resumen/route.ts`](../../app/api/resumen/route.ts) — endpoint `GET`, `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`.

**Importante:** este endpoint pertenece al subsistema **padel**, no al de quizzes. No interviene en el pipeline de `public/data/quiz`. Se documenta aquí por estar dentro del ámbito solicitado.

**Qué hace:** lee tres query params (`jugador`, `id_partido` por defecto `all`, `numero_set` por defecto `all`) y delega en `runPadelCli('resumen', { argv: ['--jugador', …, '--id-partido', …, '--numero-set', …] })` (`@lib/padel/runPython`), que invoca [`legacy-src/padel_cli.py`](../../legacy-src/padel_cli.py). Devuelve `NextResponse.json(r.body, { status: r.status })`.

**Qué resume** (`cmd_resumen` en `padel_cli.py` líneas 85-106 → `build_summary_payload` en [`legacy-src/padel_scout.py`](../../legacy-src/padel_scout.py) líneas 1191-1245+):

- Carga el CSV histórico del jugador (404 si no existe), filtra por partido y set.
- Agrega errores y aciertos por tipo y por bloque, balance neto, KPIs (partidos/sets analizados, medias por set, error/acierto más repetido, bloque más débil), perfil de jugador, comparativas mano/fase, métricas avanzadas, series por set y prioridades de entrenamiento.
- Payload de salida: `{jugador, filtros_aplicados, filtros_disponibles, kpis, errores_por_tipo, aciertos_por_tipo, errores_por_bloque, …}`.

Es un resumen estadístico de rendimiento de pádel por jugador/partido/set, **no** un resumen de quizzes ni del temario.

---

## 8. Formatos y convenciones (UTF-8)

- **Codificación:** todo lee/escribe en **UTF-8** explícito. Python: `read_text(encoding="utf-8")` / `write_text(..., encoding="utf-8")`; JS: `fs.readFileSync(target, 'utf8')`; seed TS: `fs.readFile(file, 'utf8')`.
- **Serialización JSON:** los scripts Python escriben con `json.dumps(payload, ensure_ascii=False, indent=2)` + salto de línea final (`write_json` línea 458). Esto conserva acentos y `ñ` como caracteres reales (no `\uXXXX`).
- **Mojibake:** el material crudo (PDF/PPTX vía conversores) llega con corrupción de tildes; `generate_redes_data.py` la corrige con `maybe_fix_mojibake` (heurística `latin1→utf-8` + diccionario `WORD_FIXES`). `slugify` (líneas 147-152) y `_normalize_question` reutilizan esa corrección antes de generar ids / deduplicar.
- **Esquema de pregunta (Redes):** `{kind:"choice", q, options[], correctIndex, cuatrimestre, category:"tema-N", sourceFile, sourceType, evidence?, sourceSlide?, ud?}`.
- **`sourceType` posibles:** `pdf-teorico`, `pptx-convertido`, `pdf-ejercicio`, `pdf-cuestionario`, `pdf-cuestionario-clase`, `png-ocr`.
- **Seed → SQLite** ([`src/lib/quiz/seed.ts`](../../src/lib/quiz/seed.ts)): lee `_subjects.json`, y por cada asignatura el fichero plano `<id>.json` desde `quizSeedDir()` (`public/data/quiz`, configurable con `QUIZ_SEED_DIR`). Valida con Zod (`questionsSchema`), y **reingesta solo si cambió el mtime** del fichero (tabla `quiz_seed_state.file_mtime`): borra `quiz_questions` de esa asignatura e inserta de nuevo dentro de una transacción. La DB vive en `data/quiz/quiz.db` (configurable con `QUIZ_DB_PATH`).

---

## 9. Notas / deuda

- **Acoplamiento manual:** el paso `pdftotext` (extracción PDF→TXT) no está automatizado; depende de `poppler-utils` instalado en la máquina. Está fuera del comando `pnpm generate:redes`.
- **`append-estadistica-ud1-ud3.js` no es idempotente:** reanexa las 32 preguntas en cada ejecución. No hay script `pnpm` que lo invoque; es un parche manual de un solo uso.
- **Sin pipeline simétrico para otras asignaturas:** solo *Redes* tiene generación automatizada desde material crudo. El resto de bancos (`sistemas-digitales`, `ia`, `ade`, etc.) son JSON planos mantenidos a mano en `public/data/quiz/`.
- **Dependencia de base previa:** `generate_redes_data.py` parte de `redes/temario.json` y `redes/concepts.json` existentes (los normaliza y reescribe). No regenera esos manifests desde cero a partir del material crudo; los materiales de apoyo (`supportMaterials`) sí se redescubren del FS en cada corrida.
- **`/api/resumen` es legacy/padel:** vive en `app/api/` pero invoca código Python de `legacy-src/`. No comparte nada con el pipeline de quizzes salvo el patrón "ruta Next → CLI Python".
- **El seed ignora los manifests anidados:** `redes/temario.json` y `redes/concepts.json` (la jerarquía rica de temas/quizzes/slides) solo los consume el frontend; SQLite solo recibe la lista plana `redes.json`. Cualquier metadato presente solo en el manifest (p. ej. `supportMaterials`, `sourceSlide`) no llega a la DB.
