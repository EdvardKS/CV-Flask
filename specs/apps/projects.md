# Spec: App Projects

**Estado:** DOCUMENTADO (ingeniería inversa del código)
**Ámbito:** src/apps/projects/*, app/projects
**Revisión:** 2026-06-08

---

## 1. Propósito

La app **Proyectos** es una galería en formato grid que muestra una lista de
proyectos personales y profesionales (mini-proyectos abiertos y repos en
GitHub). Cada proyecto se presenta como una tarjeta con icono, nombre,
descripción, etiquetas de tecnología y acciones. Los repositorios privados se
marcan visualmente con un candado y su botón de acceso aparece deshabilitado.

Algunos proyectos son "internos" (el propio OS de este portfolio): en lugar de
abrir GitHub en una pestaña nueva, abren otra ventana de la aplicación dentro
del window manager.

Definida en el manifest ([`src/apps/projects/manifest.ts`](../../src/apps/projects/manifest.ts)):

- **id:** `projects`
- **title:** `Proyectos`
- **icon:** `folder`
- **category:** `cv`
- **description:** `Lista de proyectos personales y profesionales`

---

## 2. Manifest

Fuente: [`src/apps/projects/manifest.ts`](../../src/apps/projects/manifest.ts)

| Campo | Valor |
|---|---|
| `id` | `projects` |
| `title` | `Proyectos` |
| `icon` | `folder` |
| `category` | `cv` |
| `defaultSize` | `{ width: 960, height: 680 }` |
| `singleton` | `true` (una sola instancia de ventana) |
| `deepLink` | `/projects` |
| `description` | `Lista de proyectos personales y profesionales` |
| `Component` | `ProjectsApp` |

El manifest se exporta como `default` y enlaza el componente raíz
`ProjectsApp`.

### Ruta / deep link

[`app/projects/page.tsx`](../../app/projects/page.tsx) define la ruta Next.js
`/projects`. La página renderiza el escritorio (`Desktop`) y un
`DeepLinkOpener` con `appId="projects"`, de modo que al navegar a `/projects`
se abre automáticamente la ventana de esta app dentro del window manager.

- `metadata.title`: `Proyectos — Edvard K.`

---

## 3. Componentes

### 3.1 ProjectsApp

Fuente: [`src/apps/projects/ProjectsApp.tsx`](../../src/apps/projects/ProjectsApp.tsx)

Componente cliente (`'use client'`) y raíz de la app. Es un wrapper de
presentación muy ligero:

- Renderiza una cabecera con el título `📂 Proyectos` y un subtítulo
  descriptivo: *"Mini-proyectos abiertos y repos en GitHub — repos privados
  marcados con candado."*
- Aplica estilos inline (borde inferior, colores, tamaños de fuente).
- Delega todo el contenido en `<ProjectsGrid />`.

No tiene lógica de estado propia.

### 3.2 ProjectsGrid

Fuente: [`src/apps/projects/ProjectsGrid.tsx`](../../src/apps/projects/ProjectsGrid.tsx)

Componente cliente (`'use client'`) que carga y renderiza las tarjetas.

**Tipo de dato (`GhProject`):**

```ts
type GhProject = {
  id: string
  name: string
  icon: string
  url: string
  internal?: string
  private?: boolean
  description: string
  tags: string[]
}
```

**Estado y carga de datos:**

- `projects: GhProject[] | null` y `error: string | null` con `useState`.
- En un `useEffect` (al montar) hace `fetch('/data/github-projects.json', { cache: 'force-cache' })`,
  parsea el JSON y rellena `projects`. Si falla, guarda el mensaje en `error`.
- Estados de UI:
  - Si `error`: muestra `Error: {mensaje}` en rojo.
  - Si `projects` aún es `null`: muestra `Cargando proyectos…`.
  - En caso normal: renderiza la lista `<ul className="gh-projects-grid">`.

**Renderizado de cada tarjeta (`gh-project-card`):**

- Cabecera con icono (`p.icon`), nombre como botón (`open(p)`) y meta:
  - Pill `🔒 Private` / `Public` según `p.private`.
  - Pill `● live` si el proyecto es interno (`p.internal`).
- Descripción (`p.description`).
- Lista de tags (`p.tags`) como badges (`gh-tl-badge-item`).
- Footer de acciones según el tipo de proyecto:
  - **Interno** (`p.internal`): botón `🪟 Abrir ventana`.
  - **Privado** (`p.private`): botón `🔒 Privado` deshabilitado.
  - **Público**: enlace `Ver en GitHub` que abre `p.url` en pestaña nueva
    (`target="_blank"`, `rel="noopener noreferrer"`).
  - Para no-privados se añade además un botón "ghost" con el icono de GitHub
    enlazando a `p.url`.

**Lógica de apertura (`open(p)`):**

- Si el proyecto tiene `internal`, llama a `resolveInternal(url)`:
  - Solo resuelve rutas que empiezan por `/`; normaliza quitando query y barra
    final.
  - Mapeo de rutas internas a `appId` (y opcionalmente `params`):
    - `/` o `/cv` → `cv`
    - `/padel`, `/padel/errores`, `/padel/resumen` → `padel`
    - `/projects` → `projects`
    - `/contact` → `contact`
    - `/quiz` → `quiz`
    - `/ECSO` o `/ecso` → `quiz` con `params { subject: 'estructura' }`
    - `/quiz/<subject>` → `quiz` con `params { subject: <subject> }`
    - Cualquier otra → `null`
  - Si resuelve y existe el manifest en `APPS_BY_ID[appId]`, abre la ventana
    mediante `openApp(manifest, params)` del store del window manager
    (`useWM`).
- Si no hay `internal` (o no resuelve), abre `p.url` en pestaña nueva con
  `window.open(..., '_blank', 'noopener,noreferrer')`.

**Auxiliar `GhIcon`:** componente SVG inline con el logo de GitHub usado en los
botones de acción.

**Dependencias del OS:**

- `useWM` (store Zustand del window manager) → acción `openApp`.
- `APPS_BY_ID` desde [`@apps/_registry`](../../src/apps/_registry.ts) para
  resolver el manifest destino de los enlaces internos.

---

## 4. Fuente de datos

**Los datos NO están hardcodeados ni provienen de `cv_data`.** Se cargan en
runtime desde un archivo JSON estático servido públicamente:

- **Ruta de fetch:** `/data/github-projects.json`
- **Archivo físico:** [`public/data/github-projects.json`](../../public/data/github-projects.json)
- **Caché:** `fetch(..., { cache: 'force-cache' })`.

El JSON es un array de objetos `GhProject`. En la revisión actual contiene
**10 proyectos**:

| id | name | private | internal | tags (resumen) |
|---|---|:---:|:---:|---|
| `ragasus` | ragasus | 🔒 | — | NestJS, Next.js, Ollama, pgvector, RAG, BI |
| `chickenmanagement` | ChickenManagement | 🔒 | — | Next.js, Express, TypeScript, Docker, Radix UI |
| `cv-flask` | CV-Flask | — | `/` | Next.js, TypeScript, Ollama, Docker, React, Zustand |
| `teriyaki` | teriyaki-v1.7 | — | — | RAG, Qdrant, LLM, Jupyter, Privacy |
| `agentic-pdf-pipeline` | agentic-pdf-pipeline | — | — | LangGraph, CrewAI, Agentic AI, Python, RAG |
| `formularioweb` | FormularioWebConValidacion | 🔒 | — | Web, Validation, UX, Forms |
| `kuberagent` | kuberagent | — | — | Kubernetes, Agentic AI, Python, DevOps |
| `basketball-tournaments` | basketballtournaments | 🔒 | — | Fullstack, Sports, Tournaments |
| `lavbotdocker` | LavBotDocker | — | — | RAG, Qdrant, FastAPI, Docker, Python, LLM |
| `miyo` | miyo | — | — | JavaScript, Social, Events, Photos |

Observaciones sobre los datos:

- Solo `cv-flask` tiene `internal: "/"` → se abre como ventana interna (la app
  `cv`) y muestra el pill `● live`.
- Los campos `internal` y `private` son opcionales; su ausencia equivale a
  proyecto público externo.
- Todas las `url` apuntan a repos de GitHub del usuario `EdvardKS`.

---

## 5. Notas / deuda técnica

- **Sin validación de esquema:** el JSON se castea directamente a
  `GhProject[]` (`r.json() as Promise<GhProject[]>`). No hay validación
  runtime (p. ej. Zod); un JSON malformado o con campos faltantes podría
  romper el render sin un error claro.
- **Acoplamiento del mapeo interno:** `resolveInternal` mantiene un mapa de
  rutas → `appId` codificado a mano en
  [`ProjectsGrid.tsx`](../../src/apps/projects/ProjectsGrid.tsx). Añadir nuevas
  apps con deep link interno exige editar esta función; no deriva el mapeo del
  registro/manifests automáticamente.
- **Estilos mixtos:** `ProjectsApp` usa estilos inline mientras que
  `ProjectsGrid` depende de clases CSS globales (`gh-projects-grid`,
  `gh-project-card`, `gh-project-pill`, `gh-tl-badge-item`, etc.) definidas
  fuera del componente; no hay CSS module local junto a la app.
- **`cache: 'force-cache'`:** los cambios en
  `public/data/github-projects.json` pueden no reflejarse hasta invalidar la
  caché del navegador/cliente.
- **Datos manuales:** pese al nombre `github-projects.json` y al icono/UI tipo
  GitHub, la lista se mantiene manualmente en el archivo estático; no se
  sincroniza con la API de GitHub. Mantener la lista actualizada es un proceso
  manual.
- **`internal` apunta a `cv` para `/`:** la ruta `/` y `/cv` resuelven ambas a
  la app `cv`; el botón "Abrir ventana" de CV-Flask abre la app de CV, no la
  app de proyectos.
