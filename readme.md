# Edvard K. — OS Portfolio

Portfolio interactivo estilo Windows XP construido con **Next.js 15 + TypeScript**.
Ventanas arrastrables, redimensionables, con snap a bordes, persistencia de posición
y un sistema modular de mini-proyectos.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v3 + `98.css` para el look XP
- Zustand (con middleware `persist`) para el estado del sistema de ventanas y datos de apps
- Framer Motion, React Hook Form + Zod, Nodemailer
- Vitest + Testing Library

## Cómo arrancar

```bash
pnpm install
cp .env.example .env   # rellena SMTP si quieres probar el formulario de contacto
pnpm dev               # http://localhost:3000
```

Comandos disponibles:

- `pnpm dev` — servidor de desarrollo.
- `pnpm build && pnpm start` — build de producción.
- `pnpm typecheck` — comprobación de tipos.
- `pnpm test` — tests unitarios (Vitest).
- `pnpm lint` — ESLint.

## Estructura

```
app/                           # Next.js App Router
  layout.tsx                   # HTML root + metadata + globals.css
  page.tsx                     # desktop
  (cv|projects|quiz|padel|contact)/page.tsx   # deep-links a ventanas
  quiz/[subject]/page.tsx      # deep-link directo a una asignatura
  api/                         # API routes (contact, cv, quiz/[subject])
  sitemap.ts / robots.ts

src/
  os/                          # Sistema operativo (window manager)
    store.ts                   # Zustand + persist: registry, z-index, pos/size
    Window.tsx                 # Chrome (title-bar, resize handles, body)
    useDraggable.ts            # Drag + detección de snap
    useResizable.ts            # Resize 8 direcciones
    snap.ts                    # Cálculo de zonas de snap
    Desktop.tsx  DesktopIcon.tsx  Taskbar.tsx  StartMenu.tsx
    DeepLinkOpener.tsx
    types.ts

  apps/                        # Mini-proyectos (cada uno autocontenido)
    _registry.ts               # Registro central (import de cada manifest)
    cv/                        # { manifest.ts, CvApp.tsx }
    projects/                  # { manifest.ts, ProjectsApp.tsx }
    contact/                   # { manifest.ts, ContactApp.tsx }
    about/                     # { manifest.ts, AboutApp.tsx }
    quiz/
      manifest.ts
      QuizApp.tsx              # Selector de asignatura
      QuizRunner.tsx           # Runner (shuffle, scoring, revisión)
      hooks/useQuizSession.ts  # Sesión persistida en localStorage
      schema.ts                # Zod schema + seeded RNG
      subjects.ts              # Lista de asignaturas
    padel/
      manifest.ts
      PadelApp.tsx             # Lista de partidos + vista
      components/
        SetCounter.tsx         # Contador ± por field para cada set
        Dashboard.tsx          # Score, nivel, top aciertos/errores, tabla por set
      store.ts                 # Persistencia de matches

  lib/
    cv-data.ts                 # Carga + tipado de /public/data/cv_data.json
    email.ts                   # Nodemailer wrapper (SMTP)
    i18n/config.ts             # Zustand de locale + strings UI (ES/EN/HY)
    padel/                     # Puerto TS del scoring de Padel
      constants.ts             # ERROR_FIELDS, SUCCESS_FIELDS, pesos, labels
      scoring.ts               # calculateScoreData, totals, aggregateSets
      __tests__/scoring.test.ts

public/
  data/                        # cv_data.json + bancos de preguntas
    quiz/                      # estructura, sistemas-operativos, ssoo-avanzados, ingles
  pwa/                         # iconos PWA
  manifest.webmanifest

__old_django/                  # Versión Django anterior (archivada, no se despliega)
```

## Añadir un nuevo mini-proyecto

1. Crear carpeta `src/apps/mi-proyecto/`.
2. Escribir `manifest.ts`:

```ts
import type { AppManifest } from '@os/types'
import { MiProyectoApp } from './MiProyectoApp'

const manifest: AppManifest = {
  id: 'mi-proyecto',
  title: 'Mi proyecto',
  icon: 'folder',
  category: 'mini-project',
  defaultSize: { width: 800, height: 600 },
  singleton: true,
  deepLink: '/mi-proyecto',
  description: 'Qué hace este proyecto',
  Component: MiProyectoApp
}
export default manifest
```

3. Crear el componente React en el mismo directorio.
4. Añadirlo a `src/apps/_registry.ts`.
5. (Opcional) Crear `app/mi-proyecto/page.tsx` para deep-link.

Aparecerá automáticamente en el escritorio, la barra de tareas y el menú Inicio.

## Sistema de ventanas

- **Abrir**: doble-click en icono del escritorio o menú Inicio.
- **Mover**: arrastrar la barra de título.
- **Snap**: arrastrar al borde izquierdo/derecho → mitad; arriba → maximizar;
  esquinas → cuartos. Preview visual durante el drag.
- **Redimensionar**: 8 handles (bordes + esquinas). Mínimo 320×200.
- **Maximizar**: doble-click en barra de título o botón `□`.
- **Persistencia**: posición, tamaño y estado se guardan en `localStorage`
  (`os:windows:v1`).
- **Taskbar**: click en item activo → minimiza; click en minimizado → restaura.
- **Mobile** (<768 px): todas las ventanas en modo kiosco fullscreen.

## Despliegue

```bash
docker compose up -d --build   # sirve en http://localhost:5000
```

Variables de entorno (ver `.env.example`): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS`, `CONTACT_RECIPIENT`.

## Legacy (Django)

La versión Django anterior está archivada en `__old_django/` como referencia. No se
despliega. Si necesitas consultarla, `cd __old_django && poetry run python manage.py runserver`.
