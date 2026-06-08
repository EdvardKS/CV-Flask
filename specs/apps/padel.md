# Spec: App Padel

**Estado:** DOCUMENTADO (ingeniería inversa del código)
**Ámbito:** src/apps/padel/*, src/lib/padel/*, app/padel
**Revisión:** 2026-06-08

---

## 1. Propósito

La app **Padel Scout** es un mini-proyecto del "OS de escritorio" del portfolio. Su objetivo es **registrar partidos de pádel set a set** contabilizando *aciertos* (golpes ganadores) y *errores* no forzados por categoría técnica, y derivar de esos conteos un **scoring** ponderado (puntuación 0-100, nivel de rendimiento, impacto neto) con **agregación por set** y por partido.

Hay que distinguir dos capas que conviven en el repositorio bajo el mismo dominio "padel":

- **Capa nativa Next.js (documentada aquí como núcleo):** lógica de scoring pura en TypeScript ([src/lib/padel/scoring.ts](../../src/lib/padel/scoring.ts)) + un store cliente con persistencia en `localStorage` ([src/apps/padel/store.ts](../../src/apps/padel/store.ts)) y componentes de UI (`SetCounter`, `Dashboard`). Esta capa funciona 100% en el navegador, sin backend.
- **Capa "legacy" (puente Python):** el componente `PadelApp` actual **no** monta el contador/dashboard nativos, sino que ofrece dos tarjetas que abren paneles HTML legacy en pestaña nueva (`/padel-legacy/errores.html` y `/padel-legacy/resumen.html`), conectados a un CLI Python vía rutas API ([src/lib/padel/runPython.ts](../../src/lib/padel/runPython.ts)). Ver §7.

> **Nota de estado real:** los componentes `SetCounter` y `Dashboard` y el `store` están implementados y testeables, pero **no están enganchados** desde `PadelApp.tsx` (ver §9). Documentan la intención de la app nativa; la entrada de usuario hoy es el flujo legacy.

---

## 2. Manifest

Fichero: [src/apps/padel/manifest.ts](../../src/apps/padel/manifest.ts)

| Campo | Valor |
|---|---|
| `id` | `padel` |
| `title` | `Padel Scout` |
| `icon` | `trophy` |
| `category` | `mini-project` |
| `defaultSize` | `1120 × 760` |
| `minSize` | `600 × 500` |
| `singleton` | `true` (una sola ventana a la vez) |
| `deepLink` | `/padel` |
| `description` | `Dashboard de errores, aciertos y score por set` |
| `Component` | `PadelApp` |

El deep link se resuelve en [app/padel/page.tsx](../../app/padel/page.tsx), que monta `<Desktop />` y un `<DeepLinkOpener appId="padel" />` para abrir la ventana automáticamente. `metadata.title` = `Padel Scout — Edvard K.`.

---

## 3. Modelo de datos (match / set / fields)

### 3.1 Campos (fields) — [src/lib/padel/constants.ts](../../src/lib/padel/constants.ts)

Cada **set** es un registro `SetRow` con un contador entero por cada categoría técnica. Las categorías se definen en dos listas `as const`:

**`ERROR_FIELDS` (15 categorías):** `Doble_Falta`, `Resto_Derecha_Fallado`, `Resto_Reves_Fallado`, `Globo_Malo`, `Error_Fondo_Derecha`, `Error_Fondo_Reves`, `Bajada_Derecha_Error`, `Bajada_Reves_Error`, `Posicionamiento_Fondo_Error`, `Error_Volea_Derecha`, `Error_Volea_Reves`, `Posicionamiento_Volea_Error`, `Tirar_Ficha_Error`, `Bandeja_Error`, `Smash_Error`.

**`SUCCESS_FIELDS` (13 categorías):** `Winner_Derecha`, `Winner_Reves`, `Resto_Ganador_Derecha`, `Resto_Ganador_Reves`, `Globo_De_Oro`, `Chiquita_Ganadora`, `Bajada_De_Pared`, `Remate_Finalizador`, `Volea_Derecha_Ganadora`, `Volea_Reves_Ganadora`, `Bandeja_Vibora_Definitiva`, `Volea_Bloqueo_Contraataque`, `Dormilona`.

Tipos derivados:
- `ErrorField = typeof ERROR_FIELDS[number]`
- `SuccessField = typeof SUCCESS_FIELDS[number]`
- `SetRow = Record<ErrorField | SuccessField, number>` — fila con las **28 categorías**, todas numéricas.

Diccionarios paralelos:
- `ERROR_LABELS` / `SUCCESS_LABELS`: etiqueta legible en español por campo (p.ej. `Doble_Falta → 'Doble falta'`).
- `FIELD_LABELS`: unión de ambos (`{...ERROR_LABELS, ...SUCCESS_LABELS}`).
- `ERROR_WEIGHTS` / `SUCCESS_WEIGHTS`: peso numérico por campo (ver §5).

`emptySetRow(): SetRow` construye una fila con las 28 categorías inicializadas a `0`.

### 3.2 Match y Set — [src/apps/padel/store.ts](../../src/apps/padel/store.ts)

```ts
type PadelMatch = {
  id: string          // `m-${Date.now()}-${random}`
  player: string       // nombre del jugador (trim, fallback 'Jugador')
  createdAt: number     // timestamp ms
  sets: SetRow[]        // ≥1; arranca con [emptySetRow()]
}
```

Un **partido** es un jugador + lista ordenada de sets. Un **set** es un `SetRow` (28 contadores). No hay rival ni resultado de juego/games modelado: el dominio es *scouting* de golpes, no el marcador deportivo.

---

## 4. Store y persistencia

Fichero: [src/apps/padel/store.ts](../../src/apps/padel/store.ts). Implementado con **Zustand** + middleware `persist`.

- Persistencia en **`localStorage`** bajo la clave **`padel:matches:v1`** (opción `name` del middleware). Persiste el estado completo (`matches` y `currentId`).
- Estado: `matches: PadelMatch[]`, `currentId: string | null`.

Acciones:

| Acción | Efecto |
|---|---|
| `newMatch(player) → id` | Crea match con id único, nombre saneado (`trim()`, fallback `'Jugador'`), `createdAt = Date.now()` y un set vacío. Lo **antepone** a la lista (`[m, ...matches]`) y lo selecciona (`currentId`). Devuelve el id. |
| `deleteMatch(id)` | Filtra el match; si era el seleccionado, pone `currentId = null`. |
| `selectMatch(id \| null)` | Cambia el partido activo. |
| `addSet(matchId)` | Añade un `emptySetRow()` al final de `sets`. |
| `updateSet(matchId, setIndex, row)` | Reemplaza el set en esa posición por `row` (inmutable). |
| `removeSet(matchId, setIndex)` | Elimina el set por índice. |

Todas las mutaciones son inmutables (`map`/`filter`/spreads). El id usa `Date.now()` + sufijo aleatorio base-36, por lo que **no es estable entre creaciones simultáneas** salvo por el sufijo aleatorio (4 chars).

> Esta persistencia es **independiente** del flujo legacy (CSV en disco vía Python, §7). Los datos del store nativo viven solo en el navegador.

---

## 5. Scoring (constants + scoring.ts)

Fichero: [src/lib/padel/scoring.ts](../../src/lib/padel/scoring.ts). Lógica pura, sin estado.

### 5.1 Pesos — [constants.ts](../../src/lib/padel/constants.ts)

Cada categoría aporta `count × peso` a un acumulador de "puntos". Rangos observados:

- **`SUCCESS_WEIGHTS`** 2.0–3.0. Máximo (3.0): `Winner_Derecha`, `Winner_Reves`, `Remate_Finalizador`, `Volea_Derecha_Ganadora`, `Volea_Reves_Ganadora`, `Bandeja_Vibora_Definitiva`. Restos ganadores y jugadas de muro/dormilona 2.5; globo/chiquita 2.0.
- **`ERROR_WEIGHTS`** 1.5–2.5. Máximo (2.5): `Doble_Falta`, restos fallados, `Tirar_Ficha_Error`. Mínimo (1.5): los dos `Posicionamiento_*_Error`. El resto 2.0.

### 5.2 Helpers

- `calculateErrorTotal(row)` / `calculateSuccessTotal(row)`: suma **bruta** (sin pesos) de los contadores de error / acierto de un `SetRow`. Usados en `SetCounter` (legend) y en la tabla por set del `Dashboard`.
- `calculateBalanceTotal(errors, successes) = successes - errors` (saldo bruto; helper exportado pero no usado en la UI documentada).
- `aggregateSets(sets: SetRow[]) → { errors: Totals, successes: Totals }`: por cada campo, suma el contador a lo largo de todos los sets. `Totals = Partial<Record<ErrorField|SuccessField, number>>`. Es la **agregación a nivel de partido**.

### 5.3 `calculateScoreData(errorTotals, successTotals) → ScoreData`

Núcleo del scoring. Sobre totales **agregados** (no brutos por campo):

```
aciertos     = round( Σ successTotals[f] × SUCCESS_WEIGHTS[f] )      // 2 dp
errores      = round( Σ errorTotals[f]  × ERROR_WEIGHTS[f] )         // 2 dp
denom        = max(1, aciertos + errores)
score        = clamp( round(100 × aciertos / denom, 1), 0, 100 )      // 1 dp, 0..100
impacto_neto = round(aciertos - errores)
nivel        = level(score)
```

`ScoreData = { score, puntos_acierto, puntos_error, impacto_neto, nivel }`.

Detalles:
- `round(n, dp=2)` redondea a `dp` decimales; `clamp(n, min, max)` acota.
- `denom = max(1, …)` evita división por cero: con todo a 0, `score = 0`.
- El **score es un porcentaje de eficacia ponderada**: proporción de puntos de acierto sobre el total de puntos (acierto + error). No depende del volumen absoluto, solo de la ratio ponderada.
- `impacto_neto` sí es absoluto (puede ser negativo) → diferencia de puntos ponderados.

**Niveles** (`level(score)`), en `ScoreData['nivel']`:

| Rango score | Nivel |
|---|---|
| ≥ 80 | `Alto rendimiento` |
| 65–79.9 | `Competitivo` |
| 50–64.9 | `Inestable` |
| < 50 | `En desarrollo` |

### 5.4 `calculateAreaScore(positive, negative, successTotals, errorTotals)`

Variante por **área/zona**: recibe subconjuntos de `SuccessField[]` y `ErrorField[]` y calcula `{ score, aciertos (bruto), errores (bruto), impacto }` con la misma fórmula de ratio ponderada. Exportada pero **no usada** en los componentes documentados (posible uso futuro/legacy de perfilado por zona de pista).

---

## 6. UI (SetCounter, Dashboard)

> Ambos componentes consumen `PadelMatch` y el `store`, pero (ver §9) no se montan desde `PadelApp.tsx` en la versión actual.

### 6.1 `PadelApp` — [src/apps/padel/PadelApp.tsx](../../src/apps/padel/PadelApp.tsx)

Pantalla de **selección** ("¿A dónde quieres ir?") con dos `ChoiceCard`:
- **Recopilación de puntos** (🎾) → abre `/padel-legacy/errores.html` en pestaña nueva.
- **Resumen** (📊) → abre `/padel-legacy/resumen.html`.

`go(target)` hace `window.open('/padel-legacy/${target}.html', '_blank', 'noopener')`. Texto al pie aclara que es el "panel legacy conectado a la API original de scouting". Las páginas legacy viven en `public/padel-legacy/` (`errores.html/js`, `resumen.html/js`, `player-session.js`, `padel-dashboard.css`).

### 6.2 `SetCounter` — [src/apps/padel/components/SetCounter.tsx](../../src/apps/padel/components/SetCounter.tsx)

Contador `±` por categoría, set a set:
- Renderiza un `<fieldset>` por set. La leyenda muestra `Set N · Aciertos: X · Errores: Y` (totales brutos vía `calculateSuccessTotal/calculateErrorTotal`).
- Dos columnas: **Aciertos** (`SUCCESS_FIELDS`, verde `#2e7d32`) y **Errores** (`ERROR_FIELDS`, rojo `#c62828`), renderizadas por `FieldList`.
- `FieldList` lista cada campo con su etiqueta + botones `−`/`+` y el valor. El botón `−` se deshabilita cuando el valor es `0`; el valor en negro/gris según sea `>0`.
- `update(setIndex, field, delta)` clampa por abajo a 0: `Math.max(0, row[field] + delta)` y persiste con `updateSet`.
- Botón **"✕ borrar"** por set, visible solo si hay >1 set (`removeSet`). Botón **"+ Añadir set"** (`addSet`).

Es la pantalla de **captura de datos** del flujo nativo.

### 6.3 `Dashboard` — [src/apps/padel/components/Dashboard.tsx](../../src/apps/padel/components/Dashboard.tsx)

Panel de **estadísticas** del partido. Memoiza:
- `agg = aggregateSets(match.sets)` — totales por campo del partido.
- `score = calculateScoreData(agg.errors, agg.successes)` — scoring global.

Bloques:
1. **BigStats** (tarjetas): `Score`, `Nivel` (color según nivel), `Pts. acierto` (verde), `Pts. error` (rojo), `Impacto neto` (verde/rojo según signo). El color de nivel se mapea con un objeto: Alto rendimiento `#2e7d32`, Competitivo `#1565c0`, Inestable `#ef6c00`, En desarrollo `#c62828`.
2. **Top listas** (`TopList`): "Top aciertos" y "Errores más costosos". Cada lista toma los campos con `count > 0`, calcula `weighted = count × peso`, ordena **descendente por peso ponderado** y toma los **5 primeros**. Barra de progreso proporcional al máximo (`weighted / max × 100%`). Muestra `count · weighted.toFixed(1)pts`. Si no hay datos: "Sin datos aún.".
3. **Resumen por set** (tabla): una fila por set con `Set`, `Aciertos` (bruto), `Errores` (bruto) y, recalculando por set (`aggregateSets([row])` + `calculateScoreData`), `Score` y `Nivel` de ese set individual.

La **agregación** ocurre en dos niveles: global (cabecera/top-listas, sumando todos los sets) y por set (cada fila de la tabla recalcula su propio score aislado).

---

## 7. runPython

Fichero: [src/lib/padel/runPython.ts](../../src/lib/padel/runPython.ts). **Puente servidor → CLI Python.** Solo Node (usa `node:child_process`), se ejecuta en rutas API, no en el navegador.

**`runPadelCli(subcommand, { stdin?, argv? }) → Promise<PyResult>`** donde `PyResult = { status: number, body: unknown }`.

Mecánica:
1. `spawn('python3', [CLI, subcommand, ...argv])`, con `CLI = <cwd>/legacy-src/padel_cli.py`.
2. Inyecta env `PADEL_DATA_DIR` (por defecto `<cwd>/public/padel-data`, override por `process.env.PADEL_DATA_DIR`) — directorio donde el Python escribe los CSV por jugador.
3. Pasa `stdin` al proceso (JSON para comandos tipo POST) o cierra stdin vacío.
4. Acumula stdout/stderr; al cerrar, intenta `JSON.parse(stdout)`; si falla, envuelve en `{ message }`.

**Mapeo de exit code → HTTP status:**

| Exit code Python | `status` devuelto |
|---|---|
| `0` | `200` |
| `1` (ValueError de negocio) | `400` |
| `10`–`19` | `390 + code` → es decir `400`–`409` (mapea estados HTTP 400-409; p.ej. el `404` del CLI sale como exit `14`) |
| error de `spawn` | `500` (`spawn failed: …`) |
| otro / `2` (excepción) | `500` (loguea `[padel-cli]` en consola) |

**El CLI Python** ([legacy-src/padel_cli.py](../../legacy-src/padel_cli.py)) es un wrapper sobre `padel_scout.py` (lógica original Flask, con Flask *stubbeado* para importarla sin servidor). Subcomandos:

- **`iniciar`** (stdin `{jugador}`): asegura el CSV del jugador y devuelve `{ jugador, archivo, id_partido }` (siguiente id).
- **`finalizar`** (stdin `{jugador, id_partido, sets}`): valida que `id_partido` sea el esperado, valida los sets y **anexa filas al CSV**; devuelve `{ ok, filas_guardadas, siguiente_id_partido }`.
- **`resumen`** (argv `--jugador --id-partido --numero-set`, default `all`): carga el CSV, filtra por partido/set y devuelve el payload de resumen (`build_summary_payload`); si no hay historial, `{ __status: 404, … }` → exit `14`.

Consumidores (rutas API que llaman a `runPadelCli`):
- [app/api/errores/iniciar/route.ts](../../app/api/errores/iniciar/route.ts)
- [app/api/errores/finalizar/route.ts](../../app/api/errores/finalizar/route.ts)
- [app/api/resumen/route.ts](../../app/api/resumen/route.ts)

> En resumen: la **persistencia "de verdad"** del flujo legacy son **CSV por jugador en disco** generados por Python, expuestos vía estas rutas y consumidos por los HTML legacy. Es un camino distinto al store Zustand/localStorage del flujo nativo.

---

## 8. Tests

Fichero: [src/lib/padel/__tests__/scoring.test.ts](../../src/lib/padel/__tests__/scoring.test.ts) (Vitest). Cubre **solo la lógica de scoring pura** (`scoring.ts` + `emptySetRow`). No hay tests de store, componentes ni del puente Python.

| Test | Verifica |
|---|---|
| `returns 0 score for empty row` | Sin datos → `score = 0`, `nivel = 'En desarrollo'` (caso `denom = max(1, 0)`). |
| `returns 100 for only successes` | Solo aciertos → `score = 100`, `nivel = 'Alto rendimiento'` (errores = 0 ⇒ ratio total). |
| `scales level by score` | 10 `Doble_Falta` (×2.5 = 25) + 10 `Winner_Derecha` (×3 = 30) → `100×30/55 ≈ 54.5` → `Inestable`. Valida fórmula ponderada y umbral de nivel. |
| `aggregates multiple sets correctly` | `aggregateSets([r, r2])` suma por campo entre sets (`Winner_Derecha: 3+4=7`, `Doble_Falta: 2`). |
| `calculates totals from a row` | `calculateSuccessTotal`/`calculateErrorTotal` suman brutos por fila (8 aciertos, 2 errores). |

Cobertura: fórmula de score, umbrales de nivel (alto/medio/cero), agregación entre sets y totales brutos. **Sin cubrir:** `calculateAreaScore`, `calculateBalanceTotal`, redondeos límite, `runPadelCli`, store y UI.

---

## 9. Notas / deuda técnica

1. **UI nativa desconectada.** `SetCounter` y `Dashboard` (y el `store`) están implementados pero **`PadelApp.tsx` no los monta**: solo enlaza al flujo legacy en pestaña nueva. Hay dos caminos paralelos de captura/persistencia sin integrar entre sí (localStorage nativo vs CSV Python). Decidir cuál es el oficial o unificarlos.
2. **Doble fuente de verdad / pesos.** Pesos y categorías viven en TS (`constants.ts`) y, presumiblemente, replicados en el Python legacy (`padel_scout.py`). Riesgo de divergencia entre el scoring nativo y el del resumen legacy.
3. **Dependencia de `python3` en runtime.** El puente requiere `python3` en PATH del servidor y el script `legacy-src/padel_cli.py` + `padel_scout.py`. El mapeo de exit codes 10–19 es una convención frágil (acoplada a que el CLI emita exactamente `10 + (status-400)`).
4. **`calculateAreaScore` muerto.** Exportado y sin consumidores en la app documentada; o se usa en otro punto no inspeccionado o es deuda.
5. **IDs de match no garantizados únicos** ante creaciones en el mismo ms (mitigado por sufijo aleatorio de 4 chars, no infalible).
6. **Sin validación de esquema al rehidratar** `localStorage`: un `padel:matches:v1` con shape antiguo podría romper la UI (la clave incluye `v1`, pero no hay `migrate` en el `persist`).
7. **Etiqueta vs campo.** `ERROR_FIELDS` tiene 15 entradas y `SUCCESS_FIELDS` 13 (28 contadores por set); cualquier alta de categoría debe tocar a la vez `*_FIELDS`, `*_WEIGHTS` y `*_LABELS` (no hay garantía de tipo que lo fuerce más allá de `Record<…>`).
