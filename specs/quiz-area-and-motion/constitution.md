# Constitution — Área personal, filtros y animaciones del portal de tests

Principios inamovibles.

- **Sin cuentas: identidad por dispositivo.** No hay login. Cada visitante se identifica por
  un id anónimo en `localStorage` ([[../quiz/core]]). El «área personal» muestra el historial
  de **este navegador**: los intentos completos viven en `localStorage`
  (`quiz:attempts:v1:{subjectId}`). No se inventa backend de usuarios.
- **Reutilizar la revisión existente.** La vista de revisión pregunta a pregunta ya existe
  (`AttemptResultView`, usada en `QuizSession`). El área personal **agrega** los intentos de
  todas las asignaturas y reutiliza esa vista; no se duplica lógica de revisión.
- **Lógica pura separada de la UI.** El filtrado de asignaturas (texto + curso), la
  agregación de intentos y la paginación son funciones puras testeables, sin DOM ni React.
- **Animaciones cinematográficas pero accesibles.** Movimiento expresivo (springs, reveals al
  hacer scroll, transiciones marcadas) con `framer-motion`, pero **siempre** desactivable: se
  respeta `prefers-reduced-motion` (CSS de `quiz.css` + `useReducedMotion()`). Solo se animan
  `transform`/`opacity`/`layout`.
- **Aditivo y sin regresión.** Nada de lo nuevo rompe el flujo de test/sesión/scoring actual.
  El buscador conserva búsqueda por texto y agrupación; los botones de curso son un filtro
  añadido, no un reemplazo.
- **Sin dependencias nuevas.** `framer-motion` ya es dependencia. No se añaden librerías.
