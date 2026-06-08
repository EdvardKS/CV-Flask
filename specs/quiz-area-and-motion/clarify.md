# Clarify — Área personal, filtros y animaciones

Petición del usuario (2026-06-08) y decisiones confirmadas.

| Tema | Decisión |
|------|----------|
| Área personal | Al pulsar «Área personal» (hoy enlaza a `/`, muerto), mostrar los tests realizados, **más reciente primero**, **paginación de 15**, con botón para ir a la **revisión** de cada intento. |
| Fuente de datos | **localStorage** de este navegador: `loadAllAttempts()` agrega los intentos de todas las asignaturas (`quiz:attempts:v1:*`). Es donde ya está el detalle que alimenta la revisión. No hay cuentas; el historial es por dispositivo. |
| Revisión | Reutiliza `AttemptResultView` (pregunta a pregunta) — el mismo flujo que ya funciona desde `AttemptsPanel`. |
| Nav nuevo | Enlace externo **«Conoce IAEKS.com»** → `https://iaeks.com`, pestaña nueva. |
| Buscador | Rediseñar el input (feo): icono SVG, mejor espaciado, botón limpiar, foco animado. |
| Filtros por curso | Botones **Todos · Primero · Segundo · Tercero · Cuarto** (curso 1..4) que filtran por `curso`. Combinan con la búsqueda por texto. |
| Animaciones | **Cinematográficas** («más wow»): springs con física, reveals al hacer scroll, transiciones de página/filtro marcadas, micro-interacciones. Aplicadas a entrada/salida de asignaturas, filtros y navegación. Estudiadas con cuidado. |
| Accesibilidad | Respetar `prefers-reduced-motion` (CSS existente + `useReducedMotion()`). |

## Fuera de alcance

- Cuentas de usuario / login / sincronización multi-dispositivo de intentos.
- Persistir preguntas+respuestas de cada intento en el servidor.
- Animar el visor PDF de conceptos (Redes) o la app OS de escritorio.
