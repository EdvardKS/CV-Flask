# Plan — Área personal, filtros y animaciones

## Bloque A — Filtros (buscador + curso) con lógica pura

| Archivo | Cambio |
|---------|--------|
| `src/components/quiz/subjectFilter.ts` (nuevo) | `filterSubjects(subjects, query, curso)`, `availableCursos(subjects)`, `cursoLabel(n)`. Puro, sin DOM. |
| [SubjectFilters.tsx](../../src/components/quiz/SubjectFilters.tsx) | Usa las funciones puras. Input rediseñado (icono SVG, botón limpiar, foco animado). Control segmentado Todos/Primero..Cuarto con píldora `layoutId`. |

## Bloque B — Animaciones cinematográficas

| Archivo | Cambio |
|---------|--------|
| `src/components/quiz/motion/presets.ts` (nuevo) | Variantes `container`/`item`, `spring`, helper `useMotionVariants()` que respeta `useReducedMotion()`. |
| [SubjectCard.tsx](../../src/components/quiz/SubjectCard.tsx) | Migrado a `motion.*`: `whileHover`/`whileTap` (escala+elevación spring), `layout`. |
| [SubjectFilters.tsx](../../src/components/quiz/SubjectFilters.tsx) | Rejilla `motion.ul` con stagger + `whileInView`; `AnimatePresence`/`layout` al filtrar; entrada al montar. |

## Bloque C — Área personal + nav

| Archivo | Cambio |
|---------|--------|
| [attempts.ts](../../src/components/quiz/attempts.ts) | `loadAllAttempts()` (recorre `localStorage`, prefijo `quiz:attempts:v${VERSION}:`, ordena `finishedAt` desc) y `paginate(list, page, size)` puro. |
| `src/components/quiz/PersonalArea.tsx` (nuevo) | Lista intentos agregados, paginación 15, lookup de asignatura (nombre/icono/color), botón «Revisar» → `AttemptResultView` inline + volver. Estado vacío. Animado. |
| `app/quiz/area-personal/page.tsx` (nuevo) | Server: `ensureQuizSeeded()`, `listSubjects()`, `QuizPageShell`+`QuizHeader`+`<PersonalArea>`. |
| [UaxTopBar.tsx](../../src/components/quiz/chrome/UaxTopBar.tsx) | `Área personal` → `/quiz/area-personal`; nuevo `Conoce IAEKS.com` externo (`<a target=_blank>`); soporte `external` en `NAV`. |

## Bloque D — Tests (TDD)

- `subjectFilter.test.ts` — `filterSubjects` (texto/curso/combinado/diacríticos), `availableCursos`.
- `attempts.test.ts` — `loadAllAttempts` (agrega+ordena, jsdom), `paginate` (corte de 15, límites).
- `PersonalArea.test.tsx` — lista página 1, pagina, «Revisar» abre revisión, vacío.
- `UaxTopBar.test.tsx` — incluye IAEKS externo y área personal → `/quiz/area-personal`.

## Verificación

`pnpm typecheck` + `pnpm test` verdes. Manual: nav, área personal con revisión, buscador+curso, animaciones cinematográficas (y sin movimiento con `prefers-reduced-motion`).

## No-regresión

- Flujo de test/sesión/scoring intacto. Búsqueda por texto y agrupación conservadas.
- Sin dependencias nuevas. Animaciones desactivables.
