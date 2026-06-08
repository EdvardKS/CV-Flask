# Spec: Arquitectura global
**Estado:** DOCUMENTADO (ingeniería inversa del código)
**Ámbito:** raíz del repo, configuración, app/layout, deploy
**Revisión:** 2026-06-08

---

## 1. Propósito

`cv-os` (paquete npm `cv-os`, versión `2.0.0`, ver [package.json](package.json#L2)) es un
**portfolio interactivo estilo Windows XP** construido sobre **Next.js 15 (App Router)**.
La interfaz emula un escritorio de sistema operativo: ventanas arrastrables,
redimensionables, con snap a bordes, persistencia de posición en `localStorage`, barra
de tareas y menú Inicio. Cada mini-proyecto (CV, proyectos, contacto, Padel Scout,
chat IA, y un **sistema de quizzes** de asignaturas) es una "app" autocontenida que se
registra en un manifest central.

El proyecto reemplaza una versión Django anterior (archivada, ver §9) y conserva un
puerto Python del scoring de Padel en `legacy-src/` que se renderiza en build.

Según [readme.md](readme.md) el slogan es: *"Portfolio interactivo estilo Windows XP:
CV, proyectos, quizzes de sistemas operativos y Padel Scout."*

---

## 2. Stack y versiones

Versiones exactas declaradas en [package.json](package.json) (rangos `^`, es decir
"compatible con"):

### Runtime / framework
| Paquete | Versión declarada | Rol |
|---|---|---|
| `next` | `^15.1.4` | Framework (App Router, `output: standalone`) |
| `react` / `react-dom` | `^19.0.0` | UI |
| `typescript` | `^5.6.3` | Lenguaje (modo `strict`) |
| `zustand` | `^5.0.1` | Estado global (window manager, stores de apps) |
| `framer-motion` | `^11.11.17` | Animaciones |
| `react-hook-form` | `^7.53.2` | Formularios |
| `@hookform/resolvers` | `^3.9.1` | Integración RHF + Zod |
| `zod` | `^3.23.8` | Validación de esquemas |
| `clsx` | `^2.1.1` | Composición de classNames |
| `next-intl` | `^3.25.1` | i18n (dependencia presente) |

### Datos / backend (server-side)
| Paquete | Versión | Rol |
|---|---|---|
| `better-sqlite3` | `^12.9.0` | Persistencia SQLite (resultados de quiz) — externalizado del bundle (§7) |
| `@types/better-sqlite3` | `^7.6.13` | Tipos (declarado en `dependencies`) |
| `nodemailer` | `^6.9.16` | Envío de email (formulario de contacto) |
| `csv-parse` / `csv-stringify` | `^5.5.6` / `^6.5.2` | Lectura/escritura de CSVs (Padel) |
| `pdfjs-dist` | `^4.10.38` | Render de PDFs (visor de conceptos del quiz "redes") |

### Estilos
| Paquete | Versión | Rol |
|---|---|---|
| `tailwindcss` | `^3.4.15` | CSS utility-first (v3, **no** v4) |
| `98.css` | `^0.1.20` | Look & feel Windows XP/98 |
| `autoprefixer` | `^10.4.20` | PostCSS plugin |
| `postcss` | `^8.4.49` | Pipeline CSS |

### Testing / tooling
| Paquete | Versión | Rol |
|---|---|---|
| `vitest` | `^2.1.5` | Test runner |
| `@vitejs/plugin-react` | `^4.3.3` | Plugin React para Vitest |
| `@testing-library/react` | `^16.0.1` | Render de componentes en test |
| `@testing-library/jest-dom` | `^6.6.3` | Matchers DOM |
| `jsdom` | `^25.0.1` | Entorno DOM para tests |
| `eslint` | `^9.15.0` | Linter |
| `eslint-config-next` | `^15.1.4` | Reglas Next |
| `@types/node` | `^22.9.1` | Tipos Node |

### Gestor de paquetes
**pnpm `9.12.3`** (fijado en [package.json](package.json#L51) vía `packageManager`).
El Dockerfile usa `corepack enable` para resolverlo. `npm` no se usa (lockfile
`pnpm-lock.yaml`).

---

## 3. Estructura de carpetas

El proyecto convive en dos raíces de código TS (`app/` para el App Router de Next y
`src/` para la lógica), más assets en `public/` y artefactos legacy. Carpetas
top-level (excluyendo `node_modules/`): `app/`, `src/`, `public/`, `legacy-src/`,
`data/`, `scripts/`, `specs/`.

### 3.1 `app/` — Next.js App Router

```
app/
  layout.tsx              # HTML root + metadata + viewport + globals.css
  page.tsx                # entrypoint del escritorio (renderiza <Desktop/>)
  globals.css
  sitemap.ts  robots.ts   # SEO (route handlers de metadata)
  cv/ projects/ contact/ padel/   # deep-links a ventanas (page.tsx c/u)
  quiz/
    layout.tsx  page.tsx  quiz.css
    [subject]/page.tsx              # deep-link directo a una asignatura
    estadistica/page.tsx  estadistica/test/page.tsx  estadistica/fb6/page.tsx
    redes/page.tsx
      redes/autoevaluacion/page.tsx
      redes/conceptos/page.tsx  redes/conceptos/[topic]/page.tsx
      redes/temario/page.tsx    redes/temario/[quizId]/page.tsx
  api/                    # API routes (route handlers)
    ai/chat/route.ts                # chat IA (Ollama)
    contact/route.ts                # formulario de contacto (Nodemailer)
    cv/route.ts                     # datos de CV
    news/route.ts                   # feed lateral
    errores/iniciar|finalizar/route.ts   # flujo Padel "errores"
    resumen/route.ts                # Padel "resumen"
    quiz/
      subjects/route.ts  results/route.ts
      [subject]/route.ts
      redes/concepts/route.ts  redes/concepts/[topic]/route.ts
      redes/summary/route.ts
      redes/temario/route.ts   redes/temario/[quizId]/route.ts
```

> Nota: la estructura real de `app/quiz/` (redes, estadística, múltiples subrutas y
> APIs) es **más amplia** que la descrita en [readme.md](readme.md), que está
> ligeramente desactualizado.

### 3.2 `src/` — lógica de la aplicación (alias `@/*`)

```
src/
  os/                     # Window manager (alias @os/*)
    store.ts              # Zustand + persist: registry, z-index, pos/size
    uiStore.ts            # estado UI auxiliar
    types.ts
    Window.tsx            # chrome de ventana (title-bar, resize handles, body)
    useDraggable.ts  useResizable.ts  snap.ts   # drag / resize / snap
    Desktop.tsx  DesktopIcon.tsx  Taskbar.tsx  StartMenu.tsx
    DeepLinkOpener.tsx    # abre ventana según la URL (deep-link)
    NewsAside.tsx  PhotoCarousel.tsx  AiWallpaper.tsx
  apps/                   # mini-proyectos autocontenidos (alias @apps/*)
    _registry.ts          # registro central de manifests
    _shared/ExternalAppStub.tsx
    about/  cv/  contact/  projects/  ai/  padel/  quiz/   # apps con UI
    f5/  github/  iaeks/  linkedin/                        # apps solo-manifest (enlaces/externas)
    cv/      { manifest.ts, CvApp.tsx, SkillsChart.tsx, Timeline.tsx, period.ts, skills-data.ts }
    padel/   { manifest.ts, PadelApp.tsx, store.ts, components/{SetCounter,Dashboard}.tsx }
    quiz/    { manifest.ts, QuizApp.tsx, QuizRunner.tsx, schema.ts, subjects.ts, hooks/useQuizSession.ts }
  components/quiz/         # UI compartida del sistema de quiz (alias @components/*)
    QuestionCard, ChoiceQuestionCard, FillQuestionCard, AnswerOption, FeedbackBanner,
    QuizHeader, QuizProgressBar, QuizPageShell, QuizSession, QuizRunner, ResultsScreen,
    StartScreen, SubjectGrid, SubjectCard, SubjectFilters, FilterRow, CategoryMultiCheck,
    ContextBox, StatTile, AiHelpButton, shuffle.ts, summary.ts, aiSearchUrl.ts,
    clientId.ts, postResult.ts, useQuizSession.ts
    redes/{PdfConceptViewer, RedesModeHub, TopicMultiSelect}.tsx
    __tests__/{aiSearchUrl, mixed-mode, option-state, summary}.test.ts
  lib/                    # utilidades server/cliente (alias @lib/*)
    cv-data.ts  email.ts  news.ts  ai.ts
    _test/server-only-stub.ts        # stub de 'server-only' para Vitest
    i18n/config.ts                   # store de locale + strings UI
    padel/   { constants.ts, scoring.ts, runPython.ts, __tests__/scoring.test.ts }
    quiz/    { db.ts, repo.ts, seed.ts, boot.ts, paths.ts, redes.ts,
               schema.sql.ts, types.ts, __tests__/{growth,redes,redes-examenes-clase,repo}.test.ts }
  types/pdfjs-dist.d.ts   # declaración de tipos local
```

### 3.3 `public/` — assets estáticos

```
public/
  manifest.webmanifest                     # PWA
  favicon.ico                              # (referenciado por layout)
  data/
    cv_data.json  github-projects.json  linkedin-posts.json
    preguntas_*.json                       # bancos antiguos (estructura, inglés, SO, SSOO avanzados)
    quiz/                                  # bancos/seeds actuales por asignatura
      _subjects.json
      ade, english-latest-test, estadistica, estadistica-fb6, estructura,
      gestion-tecnologia, ia, ingles, redes, sistemas-digitales,
      sistemas-operativos, ssoo-avanzados (.json)
  assets/{certificates, companies, photos}/
  pwa/icons/                               # icon-192.png, icon-512.png
  padel-legacy/                            # HTML legacy (errores.html, resumen.html) servido por rewrites
  news-cache/  padel-data/                 # caches en runtime (gitignored, volúmenes Docker)
```

### 3.4 `legacy-src/` — puerto Python (en uso, NO archivado)

A diferencia del Django archivado, `legacy-src/` **sí participa en el build**:

```
legacy-src/
  padel_scout.py  padel_cli.py     # scoring de Padel en Python
  render_templates.py              # renderiza .j2 -> HTML en build
  errores.html.j2  resumen.html.j2 # plantillas Jinja2
```

El Dockerfile ejecuta `cd legacy-src && python3 render_templates.py` antes del build de
Next (ver §5). El resultado HTML se sirve vía los `rewrites` de
[next.config.ts](next.config.ts#L11) bajo `/padel-legacy/*`.

### 3.5 `data/` — base de datos SQLite (runtime)

```
data/quiz/quiz.db  quiz.db-shm  quiz.db-wal   # SQLite (WAL mode) de resultados de quiz
```

Gitignorada (`/data` en [.gitignore](.gitignore#L33)); en Docker es un volumen.

### 3.6 `scripts/` — generación de datos

`scripts/generate_redes_data.py` (Python), invocado por el script pnpm
`generate:redes`. Carpeta gitignorada solo parcialmente (los `.pyc` en `__pycache__`).

### 3.7 Artefactos archivados (no en build, no en VCS)

- `__old_django/` — versión Django anterior. **No existe actualmente en disco** (está
  archivada/ignorada); referenciada por [readme.md](readme.md#L143) y excluida en
  [tsconfig.json](tsconfig.json#L27) y [vitest.config.ts](vitest.config.ts#L9).
- `__old/`, `output/`, `/temp` — también gitignorados ([.gitignore](.gitignore#L26)).

---

## 4. Scripts y comandos

Definidos en [package.json](package.json#L5) (ejecutar con `pnpm <script>`):

| Script | Comando | Propósito |
|---|---|---|
| `dev` | `next dev` | Servidor de desarrollo (http://localhost:3000) |
| `build` | `next build` | Build de producción (genera `.next/standalone`) |
| `start` | `next start` | Sirve el build |
| `lint` | `next lint` | ESLint (config `eslint-config-next`) |
| `typecheck` | `tsc --noEmit` | Comprobación de tipos sin emitir |
| `test` | `vitest run` | Tests unitarios (una pasada) |
| `test:watch` | `vitest` | Tests en modo watch |
| `generate:redes` | `python scripts/generate_redes_data.py` | Regenera datos del quiz "redes" |

Arranque local típico (según [readme.md](readme.md#L17)):
```bash
pnpm install
cp .env.example .env
pnpm dev          # http://localhost:3000
```

---

## 5. Build y despliegue (Docker)

### 5.1 Dockerfile — multi-stage

[Dockerfile](Dockerfile), base `node:20-alpine`, tres etapas:

1. **`deps`**: `corepack enable`, instala toolchain de compilación nativa
   (`python3 make g++` — necesario para `better-sqlite3`) y `pnpm install
   --frozen-lockfile`.
2. **`builder`**: instala `python3 py3-pip` + `jinja2`, copia `node_modules` de
   `deps`, renderiza las plantillas legacy (`cd legacy-src && python3
   render_templates.py`) y ejecuta `pnpm build`.
3. **`runner`**: imagen final. `NODE_ENV=production`,
   `NEXT_TELEMETRY_DISABLED=1`, instala `python3` (runtime de Padel), crea usuario no
   root `nextjs:nodejs` (uid/gid 1001). Copia `public/`, `legacy-src/`, el output
   `standalone` de Next y `.next/static`.

Variables fijadas en la imagen ([Dockerfile](Dockerfile#L38)):
- `PADEL_DATA_DIR=/app/public/padel-data`
- `QUIZ_DB_PATH=/app/data/quiz/quiz.db`
- `QUIZ_SEED_DIR=/app/public/data/quiz`

Permisos: crea y `chown`/`chmod 775` los directorios de runtime
`public/padel-data`, `public/news-cache`, `data/quiz`.

**Puerto**: `EXPOSE 3000`, `ENV PORT=3000 HOSTNAME=0.0.0.0`, arranque
`CMD ["node", "server.js"]` (server standalone de Next).

> Discrepancia: [readme.md](readme.md#L137) menciona `http://localhost:5000`, pero el
> contenedor expone realmente el **puerto 3000** y `docker-compose.yml` **no publica
> ningún puerto** al host (ver abajo).

### 5.2 docker-compose

[docker-compose.yml](docker-compose.yml), servicio único `web`:
- `build: .`, imagen `edvardks-portfolio:prod`, `container_name: flask`,
  `restart: unless-stopped`.
- Entorno: `NODE_ENV=production`, `QUIZ_DB_PATH=/app/data/quiz/quiz.db`, y carga
  `.env` (`env_file`).
- **Volúmenes nombrados**: `padel_data` → `/app/public/padel-data`, `news_cache` →
  `/app/public/news-cache`, `quiz_data` → `/app/data/quiz` (persistencia entre
  despliegues).
- **Redes externas**: `reverse_proxy` y `ollama_net` (ambas `external: true`). No hay
  `ports:` publicados — el acceso es a través del reverse proxy externo; el chat IA
  alcanza Ollama por la red `ollama_net`.

---

## 6. Variables de entorno

Plantilla en [.env.example](.env.example) (el `.env` real está gitignorado,
[.gitignore](.gitignore#L10)):

| Variable | Ejemplo / default | Uso |
|---|---|---|
| `SMTP_HOST` | `smtp.gmail.com` | Email — `/api/contact` |
| `SMTP_PORT` | `587` | Email |
| `SMTP_USER` | `you@example.com` | Email |
| `SMTP_PASS` | `your-app-password` | Email |
| `CONTACT_RECIPIENT` | `you@example.com` | Destinatario del formulario |
| `OLLAMA_URL` | `http://ollama:11434` | Chat IA — `/api/ai/chat` |
| `OLLAMA_MODEL` | `phi3:mini` | Modelo de Ollama |
| `NEWS_GITHUB_USER` | `EdvardKS` | Feed de noticias lateral |
| `NEWS_LINKEDIN_URL` | URL LinkedIn | Feed lateral |
| `NEWS_TTL_MS` | `1800000` | TTL de caché del feed (30 min) |
| `PADEL_DATA_DIR` | `/app/public/padel-data` | Directorio de CSVs de Padel |

Variables adicionales no presentes en `.env.example` pero fijadas en
[Dockerfile](Dockerfile#L38) / compose: `QUIZ_DB_PATH`, `QUIZ_SEED_DIR`,
`NEXT_TELEMETRY_DISABLED`, `PORT`, `HOSTNAME`, `NODE_ENV`.

---

## 7. Configuración (TS / Tailwind / Vitest / Next)

### 7.1 TypeScript — [tsconfig.json](tsconfig.json)
- `target: ES2022`, `module: esnext`, `moduleResolution: bundler`.
- `strict: true`, `noEmit: true`, `allowJs: false`, `isolatedModules: true`.
- `jsx: preserve`, plugin `next`, `resolveJsonModule: true`, `incremental: true`.
- **Path aliases** ([tsconfig.json](tsconfig.json#L17)):
  `@/* → ./src/*`, `@app/* → ./app/*`, `@os/* → ./src/os/*`,
  `@apps/* → ./src/apps/*`, `@lib/* → ./src/lib/*`,
  `@components/* → ./src/components/*`.
- Excluye `node_modules`, `__old_django`, `__old`, `output`.

### 7.2 Tailwind — [tailwind.config.ts](tailwind.config.ts)
- Tailwind **v3** (`Config` tipado).
- `content`: `./app/**/*.{ts,tsx}` y `./src/**/*.{ts,tsx}`.
- `theme.extend`:
  - **Colores `xp.*`** (paleta Windows XP): `blue #3A6EA5`, `blueDark #1941A5`,
    `blueLight #3C82E0`, `teal #008080`, `desktop #5A7EDA`, `taskbar #245EDC`,
    `taskbarStart #3C8A3C`, `window #ECE9D8`, `title #0A246A`, `titleEnd #A6CAF0`.
  - **Fuentes**: `xp` → Tahoma/Geneva/Verdana; `mono` → Consolas/Monaco.
  - **Sombras**: `xp-window`, `xp-icon`.
- Sin plugins.
- PostCSS ([postcss.config.mjs](postcss.config.mjs)): `tailwindcss` + `autoprefixer`.

### 7.3 Vitest — [vitest.config.ts](vitest.config.ts)
- `environment: jsdom`, `globals: false` (imports explícitos de `vitest`).
- `include: src/**/*.{test,spec}.{ts,tsx}`; excluye `__old_django/**`, `node_modules/**`.
- **Alias clave**: `server-only` → `./src/lib/_test/server-only-stub.ts` (permite
  testear módulos marcados `server-only`). Replica los aliases `@`, `@os`, `@apps`,
  `@lib`, `@components`.

### 7.4 Next.js — [next.config.ts](next.config.ts)
- `output: 'standalone'` (build autocontenido para Docker).
- `reactStrictMode: true`, `poweredByHeader: false`.
- `serverExternalPackages: ['better-sqlite3']` — no se empaqueta el módulo nativo.
- `experimental.optimizePackageImports: ['framer-motion', 'zustand']`.
- **Rewrites**: `/padel-legacy/errores` → `/padel-legacy/errores.html`,
  `/padel-legacy/resumen` → `/padel-legacy/resumen.html` (sirven el HTML legacy
  generado por Jinja2).

---

## 8. Layout raíz, SEO y PWA

### 8.1 Layout raíz — [app/layout.tsx](app/layout.tsx)
- `<html lang="es">` con `<body>{children}</body>`. Importa `./globals.css`.
- **Metadata** ([app/layout.tsx](app/layout.tsx#L4)):
  - `title`: "Edvard K. — OS Portfolio".
  - `description`: portfolio XP con CV, proyectos, quizzes de SO y Padel Scout.
  - `metadataBase`: `https://edvardks.com`.
  - `openGraph`: title/description, `type: website`.
  - `icons.icon`: `/favicon.ico`.
  - `manifest`: `/manifest.webmanifest`.
- **Viewport** ([app/layout.tsx](app/layout.tsx#L17)): `width=device-width`,
  `initialScale=1`, `themeColor #245edc`.

### 8.2 Entrypoint del escritorio — [app/page.tsx](app/page.tsx)
Componente `Home` minimalista: importa `Desktop` desde `@os/Desktop` y lo renderiza.
Toda la lógica del escritorio (iconos, ventanas, taskbar, menú Inicio, deep-link
opener) vive en `src/os/`.

### 8.3 SEO
- **Sitemap** — [app/sitemap.ts](app/sitemap.ts): genera 10 URLs sobre base
  `https://edvardks.com` con prioridades (`/` 1.0, `/cv` 0.9, `/projects` 0.8,
  `/quiz` 0.7, las cuatro asignaturas `quiz/*` 0.6, `/padel` 0.7, `/contact` 0.5).
  `lastModified` = fecha de build.
- **Robots** — [app/robots.ts](app/robots.ts): `allow: '/'` para todo user-agent,
  `sitemap: https://edvardks.com/sitemap.xml`.

### 8.4 PWA
[public/manifest.webmanifest](public/manifest.webmanifest):
- `name`: "Edvard K. — OS Portfolio", `short_name`: "Edvard OS".
- `display: standalone`, `start_url: /`.
- `background_color #5a7eda`, `theme_color #245edc`.
- Iconos `/pwa/icons/icon-192.png` (192×192) y `/pwa/icons/icon-512.png` (512×512).
- **No hay service worker** detectado: la PWA es instalable pero sin caché offline
  registrada en el código revisado.

---

## 9. Notas y deuda técnica

1. **README desactualizado.** [readme.md](readme.md) describe una estructura más simple
   que la real: faltan los quizzes `redes`/`estadistica`, las APIs `quiz/redes/*`,
   `errores/*`, `resumen`, las apps solo-manifest (`f5`, `github`, `iaeks`,
   `linkedin`, `about`, `ai`) y la capa `src/lib/quiz/` (SQLite). Conviene
   sincronizarlo.

2. **Puerto inconsistente.** El README cita `http://localhost:5000` para Docker, pero
   el contenedor expone **3000** y `docker-compose.yml` no publica puertos (acceso solo
   vía red `reverse_proxy` externa).

3. **`container_name: flask`** es un nombre heredado del proyecto Flask/Django anterior;
   no hay Flask en la base de código actual (puede confundir).

4. **Dependencia de Python en runtime.** La imagen final instala `python3` y conserva
   `legacy-src/` porque el scoring de Padel sigue ejecutándose en Python
   ([src/lib/padel/runPython.ts](src/lib/padel/runPython.ts)) en vez de usar únicamente
   el puerto TS ([src/lib/padel/scoring.ts](src/lib/padel/scoring.ts)). Hay lógica de
   Padel duplicada (TS + Python).

5. **`next-intl` declarado pero i18n propio.** Existe `next-intl` en dependencias, pero
   la internacionalización parece implementarse con un store Zustand propio
   ([src/lib/i18n/config.ts](src/lib/i18n/config.ts)); revisar si `next-intl` se usa
   realmente o es dependencia muerta.

6. **`@types/better-sqlite3` en `dependencies`** (no en `devDependencies`); inocuo pero
   no idiomático.

7. **Bancos de preguntas duplicados.** Conviven `public/data/preguntas_*.json`
   (formato antiguo) y `public/data/quiz/*.json` (formato actual + SQLite). Posible
   limpieza pendiente.

8. **Sin CI declarado en el repo revisado** (no se encontró workflow). El control de
   calidad (`typecheck`, `test`, `lint`) se ejecuta manualmente vía pnpm.

9. **Legacy archivado.** `__old_django/` (Django) y `__old/`, `output/`, `temp/` están
   gitignorados y, en el caso de `__old_django`, no presentes en disco actualmente;
   sirven solo de referencia histórica.
