# Tasks — Área personal, filtros y animaciones

**Estado:** EN CURSO. Feature SDD+TDD.

## Bloque A — filtros
- [ ] `subjectFilter.ts` (filterSubjects, availableCursos, cursoLabel).
- [ ] Buscador rediseñado en `SubjectFilters.tsx`.
- [ ] Botones de curso (Todos/Primero..Cuarto) con píldora activa.

## Bloque B — animaciones
- [ ] `motion/presets.ts` (variantes + reduced-motion).
- [ ] `SubjectCard.tsx` a `motion.*` (hover/tap/layout).
- [ ] Rejilla con stagger + whileInView + AnimatePresence al filtrar.

## Bloque C — área personal + nav
- [ ] `attempts.ts`: `loadAllAttempts` + `paginate`.
- [ ] `PersonalArea.tsx` (lista + paginación 15 + revisión inline + vacío).
- [ ] `app/quiz/area-personal/page.tsx`.
- [ ] `UaxTopBar.tsx`: enlace IAEKS + área personal a `/quiz/area-personal`.

## Bloque D — tests
- [ ] `subjectFilter.test.ts`.
- [ ] `attempts.test.ts`.
- [ ] `PersonalArea.test.tsx`.
- [ ] `UaxTopBar.test.tsx`.
- [ ] `pnpm typecheck` + `pnpm test` verdes (100%).

## Pendiente / futuro
- [ ] Sincronizar intentos al servidor para revisión multi-dispositivo (requiere cuentas).
- [ ] Reusar presets de animación en otras zonas del portal.
