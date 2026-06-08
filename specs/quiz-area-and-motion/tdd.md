# TDD — Área personal, filtros y animaciones

Bajo [constitution.md](constitution.md), decisiones de [clarify.md](clarify.md), diseño en
[plan.md](plan.md). Checklist en [tasks.md](tasks.md).

## Suite

| Archivo | Nivel | Qué bloquea |
|---------|-------|-------------|
| `src/components/quiz/__tests__/subjectFilter.test.ts` | Lógica (node) | Filtrado por texto, por curso y combinado (con diacríticos); cursos disponibles. |
| `src/components/quiz/__tests__/attempts.test.ts` | Lógica (jsdom) | `loadAllAttempts` agrega y ordena desc; `paginate` corta de 15 y respeta límites. |
| `src/components/quiz/__tests__/PersonalArea.test.tsx` | Componente (jsdom) | Lista intentos, pagina, abre revisión; estado vacío. |
| `src/components/quiz/chrome/__tests__/UaxTopBar.test.tsx` | Componente (jsdom) | Nav con IAEKS externo y área personal correcta. |

## Ciclos

### Ciclo 1 — filtrado puro (texto + curso)
- **RED.** `filterSubjects(subjects, query, curso)` debe: devolver todo sin filtros; filtrar
  por nombre/descripción ignorando acentos; filtrar por `curso`; combinar ambos (AND).
  `availableCursos` devuelve los cursos distintos presentes, ordenados.
- **GREEN.** Implementación en `subjectFilter.ts` (reaprovecha la normalización diacrítica).
- **REFACTOR.** `SubjectFilters.tsx` consume estas funciones (UI sin lógica de filtrado).

### Ciclo 2 — agregación y paginación de intentos
- **RED.** `loadAllAttempts()` recorre `localStorage` (varias claves `quiz:attempts:v1:*`),
  aplana y ordena por `finishedAt` desc. `paginate(list, page, size=15)` devuelve la porción
  correcta y nunca se sale de rango (page fuera de límites → vacío/clamp).
- **GREEN.** Añadidas a `attempts.ts`. Test con `localStorage` de jsdom sembrado a mano.

### Ciclo 3 — área personal (UI)
- **RED.** Con intentos sembrados, `PersonalArea` renderiza ≤15 filas (página 1), permite
  pasar de página, y «Revisar» muestra la vista de revisión del intento. Sin intentos →
  estado vacío. Falla sin el componente.
- **GREEN.** `PersonalArea.tsx` + ruta `app/quiz/area-personal/page.tsx`.

### Ciclo 4 — navegación
- **RED.** El nav incluye «Conoce IAEKS.com» como `<a target="_blank">` a `iaeks.com` y
  «Área personal» apunta a `/quiz/area-personal`.
- **GREEN.** `UaxTopBar.tsx` con soporte de enlaces externos.

## Animaciones

El movimiento (springs, reveals, transiciones) se valida **manualmente** en navegador; no se
hace unit-test del movimiento. Los presets (`motion/presets.ts`) se mantienen como datos puros
y respetan `useReducedMotion()`.

## Resultado

`pnpm test` verde con la suite nueva · `pnpm typecheck` verde. Umbral 100% para push.
