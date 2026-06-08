# Tasks — Área personal, filtros y animaciones

**Estado:** IMPLEMENTADO. Feature SDD+TDD.

## Bloque A — filtros
- [x] `subjectFilter.ts` (filterSubjects, availableCursos, cursoLabel).
- [x] Buscador rediseñado en `SubjectFilters.tsx` (icono SVG, limpiar, glow de foco).
- [x] Botones de curso (Todos/Primero..Cuarto) con píldora activa `layoutId`.

## Bloque B — animaciones
- [x] `motion/presets.ts` (variantes + `useMotionPreset` con reduced-motion).
- [x] `SubjectCard.tsx` a `motion(Link)` (hover/tap spring, layout, item variant).
- [x] Rejilla con stagger + re-stagger al cambiar de curso.

## Bloque C — área personal + nav
- [x] `attempts.ts`: `loadAllAttempts` + `paginate`.
- [x] `PersonalArea.tsx` (lista + paginación 15 + revisión inline + vacío).
- [x] `app/quiz/area-personal/page.tsx`.
- [x] `UaxTopBar.tsx`: enlace IAEKS externo + área personal a `/quiz/area-personal`.

## Bloque D — tests
- [x] `subjectFilter.test.ts` (7).
- [x] `attempts-area.test.ts` (loadAllAttempts + paginate, 7).
- [x] `PersonalArea.test.tsx` (3).
- [x] `UaxTopBar.test.tsx` (2).
- [x] `pnpm typecheck` verde · `pnpm test` 70/70 verde.

## Pendiente (manual / futuro)
- [ ] Comprobación manual en navegador (animaciones cinematográficas, área personal con datos reales).
- [ ] Sincronizar intentos al servidor para revisión multi-dispositivo (requiere cuentas).
