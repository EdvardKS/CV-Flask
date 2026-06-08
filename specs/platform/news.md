# Spec: Noticias (NewsAside)

**Estado:** DOCUMENTADO (ingeniería inversa del código)
**Ámbito:** [src/lib/news.ts](../../src/lib/news.ts), [app/api/news](../../app/api/news/route.ts), [src/os/NewsAside.tsx](../../src/os/NewsAside.tsx)
**Revisión:** 2026-06-08

---

## 1. Propósito

El sistema de Noticias alimenta el panel lateral "Notificaciones" del escritorio (news aside). Agrega la actividad reciente del autor desde dos orígenes y la presenta como un feed cronológico dentro del entorno tipo SO del portfolio.

La lógica de agregación, caché y normalización vive en [src/lib/news.ts](../../src/lib/news.ts); se expone vía el endpoint [`/api/news`](../../app/api/news/route.ts); y se consume desde el componente cliente [`NewsAside`](../../src/os/NewsAside.tsx).

---

## 2. Fuente de datos

El feed combina **tres** orígenes mediante `buildFeed()` ([src/lib/news.ts](../../src/lib/news.ts), `Promise.all`):

### 2.1 GitHub (API pública)
- Endpoint: `https://api.github.com/users/{GITHUB_USER}/events/public`.
- Acceso **no autenticado** (límite 60 req/h por IP), cabeceras `Accept: application/vnd.github+json` y `User-Agent: edvardks-portfolio/2.0`.
- Procesa los **primeros 30 eventos** y mapea solo estos tipos a `NewsItem`:
  - `PushEvent` → `kind: 'push'` (concatena hasta 2 mensajes de commit, primera línea).
  - `CreateEvent` → `kind: 'create'` (rama/tag).
  - `PullRequestEvent` → `kind: 'pr'`.
  - `WatchEvent` → `kind: 'star'`.
  - `IssuesEvent` / `IssueCommentEvent` → `kind: 'issue'`.
  - El resto (Release, Fork, …) se ignora.
- Es la fuente fiable (JSON estructurado).

### 2.2 LinkedIn (scraping best-effort de OpenGraph)
- URL: perfil público `LINKEDIN_URL`.
- LinkedIn responde **999** a bots anónimos. `undici` (el `fetch` de Next.js) rechaza códigos HTTP no estándar y lanza excepción, por lo que se usa un cliente propio `rawGet()` sobre `node:http`/`node:https` (tolera 999, sigue hasta 4 redirecciones, timeout 10 s).
- Se envía un `User-Agent` de navegador Chrome. Del HTML de la landing solo se extraen meta tags **OpenGraph/Twitter** vía `parseMeta()` (regex, soporta ambos órdenes property/content):
  - `og:title` / `twitter:title` → nombre.
  - `og:description` / `twitter:description` → headline.
  - `og:image` / `twitter:image` → foto.
- Si hay nombre, genera **un** `NewsItem` `kind: 'profile'` y rellena `feed.profile`. Si LinkedIn bloquea, error `"LinkedIn bloquea scraping anónimo (999)"` y se cae a GitHub-only.
- **No** obtiene posts/actividad (requieren login).

### 2.3 LinkedIn curado (fichero estático)
- `loadCuratedLinkedIn()` lee `public/data/linkedin-posts.json` (relativo a `process.cwd()`).
- Lista mantenida **manualmente** con destacados reales del feed de LinkedIn. Cada entrada se normaliza a `NewsItem` con `source: 'linkedin'`, `kind` por defecto `'post'`, y `url` por defecto el perfil.
- Si el fichero falta, solo registra un `warn` y devuelve `[]` (no es error bloqueante).

### 2.4 Orden y ensamblado
En `buildFeed()`: los items de LinkedIn (perfil + curados) van **primero** (mayor valor editorial), los de GitHub debajo; cada grupo ordenado por `at` descendente (`localeCompare`). `ok = items.length > 0`. Los errores de GitHub/LinkedIn se acumulan en `errors[]`.

### Modelo de datos

```ts
type NewsItem = {
  id: string
  source: 'github' | 'linkedin'
  kind: string        // 'push' | 'create' | 'pr' | 'star' | 'issue' | 'profile' | 'post' | ...
  title: string
  detail?: string
  url?: string
  at: string          // ISO timestamp
  repo?: string
  avatar?: string
  tags?: string[]
}

type NewsFeed = {
  updatedAt: string
  ok: boolean
  items: NewsItem[]
  errors?: string[]
  profile?: { name?: string; headline?: string; photo?: string; url: string }
}
```

---

## 3. API `/api/news` (contrato + caché)

Definida en [app/api/news/route.ts](../../app/api/news/route.ts).

### Contrato

| Aspecto | Valor |
|---|---|
| Método | `GET` |
| Runtime | `nodejs` (export `runtime = 'nodejs'`) |
| Renderizado | `dynamic = 'force-dynamic'` |
| Query param | `?refresh=1` → fuerza rebuild (`force: true`, salta cachés) |
| Respuesta | `NextResponse.json(feed)` con un objeto `NewsFeed` |
| Cache-Control | `public, max-age=60, s-maxage=60, stale-while-revalidate=1800` |

El handler solo traduce `?refresh=1` a `getFeed({ force })` y serializa el resultado. Toda la lógica de caché está en la librería.

### Estrategia de caché (`getFeed()` en [src/lib/news.ts](../../src/lib/news.ts))

Dos niveles, con TTL común `TTL_MS` (30 min por defecto):

1. **Memoria** (`mem`, variable de módulo): si existe y su edad < `TTL_MS`, se devuelve directamente (salvo `force`).
2. **Disco** (`CACHE_FILE` = `{CACHE_DIR}/feed.json`): si no hay memoria, se lee el snapshot; si su edad (`updatedAt`) < `TTL_MS`, se hidrata memoria y se devuelve.
3. **Rebuild**: si ambos cachés caducan, se llama a `buildFeed()`, se guarda en memoria y se escribe a disco (`writeDiskCache`, crea el dir con `recursive`; fallo solo loggea `warn`).
4. **Degradación elegante**: si el rebuild falla (`!feed.ok`) y existe un snapshot de disco con `ok: true`, se devuelve el **stale** en vez de propagar el error (salvo `force`).

Nota: la cabecera HTTP `max-age=60` + `stale-while-revalidate=1800` es independiente y más corta que el TTL interno de 30 min; capas de caché distintas (CDN/navegador vs. servidor).

---

## 4. UI NewsAside

Componente cliente [src/os/NewsAside.tsx](../../src/os/NewsAside.tsx) (`'use client'`).

- **Visibilidad**: controlada por el store `useUI` (`notificationsOpen` / `setNotifications`). Si `!open` devuelve `null`.
- **Carga**: `load(force)` hace `fetch('/api/news' + (force ? '?refresh=1' : ''), { cache: 'no-store' })` y guarda el feed en estado local. Se dispara una vez al montar (`useEffect → load(false)`).
- **Estructura**:
  - `header` con título "Notificaciones" y subtítulo de fecha localizada (`formatDateHeader`, `Intl.DateTimeFormat('es-ES')`), más botón "×" que cierra el panel.
  - Bloque **perfil** (`feed.profile.photo`): avatar + nombre + headline (de LinkedIn OG).
  - **Meta**: muestra "Actualizando…" mientras `loading`, o "Hace {relative(updatedAt)}"; botón "↻" llama a `load(true)` (refresco forzado).
  - **Aviso** (`feed.errors`): banner "⚠ Fuente limitada (…)" con los errores acumulados.
  - **Lista** (`news-list`):
    - 3 skeletons mientras `feed === null`.
    - "Sin actividad reciente." si `items.length === 0`.
    - Por item: punto de color (`#24292f` GitHub / `#0a66c2` LinkedIn) con icono SVG inline (`GhIcon`/`LiIcon`); enlace (`url`, abre en `_blank` con `rel="noopener noreferrer"`) con `title`, `detail`, hasta **4 tags** (`#tag`) y tiempo relativo.
- **`relative(iso)`**: formatea la antigüedad (s / min / h / d / mes / años).
- Estilos por clases CSS (`news-aside`, `news-head`, `news-item`, etc.); no hay CSS embebido en el componente.

---

## 5. Env / config

Variables leídas en [src/lib/news.ts](../../src/lib/news.ts) (todas con valor por defecto, ninguna obligatoria):

| Variable | Default | Uso |
|---|---|---|
| `NEWS_GITHUB_USER` | `EdvardKS` | Usuario para `…/users/{user}/events/public`. |
| `NEWS_LINKEDIN_URL` | `https://www.linkedin.com/in/edvardks/` | Perfil a scrapear (OG meta). |
| `NEWS_TTL_MS` | `1800000` (30 min) | TTL de caché memoria + disco. |
| `NEWS_CACHE_DIR` | `{cwd}/public/news-cache` | Directorio del snapshot `feed.json` (volumen escribible en Docker). |

Rutas/ficheros no configurables:
- Snapshot de caché: `{NEWS_CACHE_DIR}/feed.json`.
- Posts curados de LinkedIn: `public/data/linkedin-posts.json` (relativo a `process.cwd()`).

No requiere tokens ni claves de API (GitHub se usa sin autenticar; LinkedIn por scraping anónimo).

---

## 6. Notas / deuda técnica

- **Rate limit GitHub**: 60 req/h por IP sin token. El TTL de 30 min lo mantiene holgado, pero en despliegues con IP compartida podría agotarse; no hay soporte para token de GitHub.
- **Fragilidad del scraping LinkedIn**: depende de que la landing pública exponga OG meta y de un parseo por regex; cambios de HTML o bloqueo (999 permanente) dejan el perfil vacío. Por diseño solo se obtiene el perfil, nunca posts → los posts dependen del fichero curado manual.
- **Caché en memoria por instancia**: `mem` es estado de módulo; en serverless/multi-instancia cada réplica mantiene su propia copia, así que el TTL efectivo y la frescura varían entre instancias (el snapshot en disco mitiga parcialmente).
- **Persistencia de disco en serverless**: `NEWS_CACHE_DIR` bajo `public/` asume FS escribible/persistente (pensado para Docker con volumen). En plataformas con FS efímero o de solo lectura, la escritura falla silenciosamente (solo `warn`) y se pierde el nivel de caché de disco.
- **Doble capa de caché desalineada**: TTL interno (30 min) vs. `Cache-Control max-age=60`/`stale-while-revalidate=1800`. El cliente además usa `cache: 'no-store'`, por lo que la cabecera afecta sobre todo a CDN/proxies intermedios.
- **`avatar` infrautilizado**: el tipo `NewsItem` define `avatar`, pero la UI solo usa la foto vía `feed.profile.photo`, no por item.
