# Specs — cv-os

Documentación técnica del proyecto **cv-os** (portfolio interactivo estilo Windows XP
+ sistema de quiz educativo, Next.js 15 + React 19 + TypeScript).

Dos tipos de spec conviven:
- **Intención** (qué se quiere): `redes/{constitution,clarify,plan,tasks}`, `quiz-repaso/spec`.
- **Ingeniería inversa** (qué hace el código hoy): el resto, marcados `**Estado:** DOCUMENTADO`.

## Índice

### Plataforma / base

| Spec | Ámbito |
|------|--------|
| [architecture.md](architecture.md) | Stack, estructura, scripts, Docker, env, layout/SEO/PWA |
| [os/window-manager.md](os/window-manager.md) | Gestor de ventanas (store Zustand, drag/resize/snap, taskbar, start menu, deep-link, adornos) |
| [platform/i18n.md](platform/i18n.md) | Internacionalización ES/EN/HY (store propio; next-intl inerte) |
| [platform/news.md](platform/news.md) | NewsAside: GitHub + LinkedIn, caché 2 niveles, `/api/news` |
| [platform/data-pipeline.md](platform/data-pipeline.md) | Scripts Python/JS: crudo → JSON → SQLite; `/api/resumen` |

### Apps (mini-proyectos)

| Spec | Ámbito |
|------|--------|
| [apps/cv.md](apps/cv.md) | App CV: datos `cv_data.json`, timeline, radar de skills |
| [apps/projects.md](apps/projects.md) | Galería de proyectos (`github-projects.json`) |
| [apps/contact.md](apps/contact.md) | Formulario + `/api/contact` + nodemailer SMTP |
| [apps/padel.md](apps/padel.md) | Pádel: scoring TS + UI nativa + puente CLI Python |
| [apps/ai-assistant.md](apps/ai-assistant.md) | Chat IA sobre Ollama, `/api/ai/chat` con guardarraíles |
| [apps/launchers.md](apps/launchers.md) | App About + lanzadores externos (github/linkedin/f5/iaeks) |

### Quiz

| Spec | Ámbito |
|------|--------|
| [quiz/core.md](quiz/core.md) | Núcleo UI/sesión: `QuizSession`, scoring cliente, filtros, modos pregunta |
| [quiz/data-layer.md](quiz/data-layer.md) | SQLite (better-sqlite3): esquema, seed, repo, APIs |
| [quiz/estadistica.md](quiz/estadistica.md) | Asignatura Estadística (hub, test, ejercicio fb6) |
| [quiz-repaso/spec.md](quiz-repaso/spec.md) | **Feature** Modo repaso (implementada) |
| [quiz-image-lightbox/](quiz-image-lightbox/) | **Feature** Visor de imágenes con zoom/paneo (constitution/clarify/plan/tasks/tdd) |
| [quiz-area-and-motion/](quiz-area-and-motion/) | **Feature** Área personal + filtros por curso + buscador + animaciones cinematográficas |

### Redes (asignatura)

| Spec | Ámbito |
|------|--------|
| [redes/constitution.md](redes/constitution.md) | Principios inamovibles |
| [redes/clarify.md](redes/clarify.md) | Decisiones aclaradas |
| [redes/plan.md](redes/plan.md) | Plan técnico |
| [redes/tasks.md](redes/tasks.md) | Áreas de trabajo + checklist |
| [redes/implementation.md](redes/implementation.md) | Implementación real (3 modos, visor PDF, APIs, datos) |

### Sistemas Digitales (asignatura — feature en curso)

| Spec | Ámbito |
|------|--------|
| [sistemas-digitales/constitution.md](sistemas-digitales/constitution.md) | Principios inamovibles |
| [sistemas-digitales/clarify.md](sistemas-digitales/clarify.md) | Decisiones confirmadas |
| [sistemas-digitales/plan.md](sistemas-digitales/plan.md) | Plan (campo `image`, materiales externos, contenido) |
| [sistemas-digitales/tasks.md](sistemas-digitales/tasks.md) | Checklist por bloques |
| [sistemas-digitales/tdd.md](sistemas-digitales/tdd.md) | Ciclos TDD (red→green→refactor) y suite de tests |

## Convención

- Una feature/subsistema = un `.md` (o subcarpeta si tiene varios docs).
- Specs de ingeniería inversa: cabecera `**Estado:** DOCUMENTADO (ingeniería inversa del código)` + `**Ámbito:**` + `**Revisión:**`.
- Specs de intención (SpecKit): `constitution → clarify → plan → tasks`, con `**Estado:**` (PROPUESTA / APROBADA / IMPLEMENTADA).
- Rutas citadas como enlaces markdown relativos al root del repo.
