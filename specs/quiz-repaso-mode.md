# Spec: Modo Repaso para Quiz

**Estado:** PROPUESTA — pendiente de aprobación. No editar código hasta aprobar.
**Fecha:** 2026-06-01
**Autor:** Claude (dirigido por usuario)

---

## 1. Objetivo

Añadir un checkbox **"Modo repaso"** en la pantalla de inicio (`StartScreen`) de
todos los quiz. Al activarlo y empezar el test con la configuración seleccionada
(cuatrimestre, temas, nº de preguntas — sin cambios), el test se abre en modo
estudio:

- Respuesta correcta ya marcada en **verde** desde el inicio.
- **Pistas abiertas y fijas** (sin botón ocultar).
- Feedback / explicación **ya mostrado** en cada pregunta.
- **Solo lectura**: opciones no clicables; el usuario solo navega ←/→.
- **No puntúa y no envía resultados** (sin `postQuizResult`, sin stats, sin nota).

Un solo punto de entrada (`StartScreen` + flag `repaso`) cubre **todos** los quiz
porque todos pasan por `QuizSession`: `[subject]`, `redes/temario`,
`redes/autoevaluacion`, `estadistica/*`, inglés, etc.

**Fuera de alcance:** la app aislada `src/apps/quiz/` (estilo XP, hooks/schema
propios). No se toca.

---

## 2. Decisiones confirmadas

| Tema | Decisión |
|------|----------|
| Interacción con opciones | Solo lectura, el usuario navega ←/→ |
| Puntuación / stats | No puntúa, no envía (`postQuizResult` omitido) |
| Alcance | Solo flujo principal Next.js (`QuizSession`). Legacy ignorado |
| Pistas | Abiertas y fijas (sin toggle) |

---

## 3. Arquitectura actual (referencia)

```
QuizSession.tsx
 ├─ StartScreen.tsx          → onStart(limit, cuatrimestre, categories)
 ├─ QuizRunner.tsx           → QuestionCard → ChoiceQuestionCard / FillQuestionCard
 │                             ├─ AnswerOption.tsx   (estados: idle|correct|wrong|reveal)
 │                             └─ FeedbackBanner.tsx
 └─ ResultsScreen.tsx

useQuizSession.ts  → SessionState, StartOpts, start()/answer()/goto()/finish()/reset()
                     persiste en localStorage  quiz:v{VERSION}:{id}
```

- Verde correcto = `AnswerOption` estados `correct` / `reveal` (emerald).
- Pista = estado local `hintOpen` en `ChoiceQuestionCard.tsx:28`.
- Envío de resultado = `QuizSession.tsx:25-31` (`postQuizResult`).

---

## 4. Modelo de datos

### 4.1 `StartOpts` (useQuizSession.ts:44-49)
Añadir campo opcional:
```ts
export type StartOpts = {
  limit?: number
  cuatrimestre?: number | 'all' | 'latest'
  category?: string | 'all'
  categories?: string[]
  repaso?: boolean          // NUEVO
}
```

### 4.2 `SessionState` (useQuizSession.ts:7-17)
Añadir campo opcional (retrocompatible: ausente ⇒ `false`):
```ts
export type SessionState = {
  ...
  repaso?: boolean          // NUEVO
}
```
`start()` copia `opts.repaso` a `next.repaso`.

> **Sin bump de VERSION.** El campo es opcional; sesiones viejas en localStorage
> simplemente no lo tienen (= modo normal). No rompe nada.

---

## 5. Cambios por archivo

### 5.1 `useQuizSession.ts`
- `StartOpts`: + `repaso?: boolean`.
- `SessionState`: + `repaso?: boolean`.
- En `start()`: `repaso: opts.repaso ?? false` dentro del objeto `next`.
- Resto sin cambios. El filtrado de preguntas (cuatri/categorías/límite/shuffle)
  se mantiene **idéntico**: repaso usa la misma config normal.

### 5.2 `StartScreen.tsx`
- Nuevo estado: `const [repaso, setRepaso] = useState(false)`.
- Nuevo checkbox UI debajo del selector "¿Cuántas preguntas?" y antes del botón
  "Empezar test". Estilo coherente (Tailwind, slate/amber). Texto:
  - Label: **"Modo repaso"**
  - Ayuda: "Abre el test con las respuestas correctas, pistas y explicaciones ya
    mostradas. No puntúa."
- `onStart` cambia de firma para incluir `repaso`:
  ```ts
  onStart: (limit?, cuatrimestre?, categories?, repaso?: boolean) => void
  ```
- `handleStart()` pasa `repaso`.
- Texto del botón cuando `repaso` activo: "Empezar repaso (N)" en vez de
  "Empezar test (N)".

### 5.3 `QuizSession.tsx`
- `onStart` callback propaga `repaso`:
  ```ts
  onStart={(limit, cuatrimestre, categories, repaso) =>
    start({ limit, cuatrimestre, categories, repaso })}
  ```
- **Guard de envío** (crítico): no postear si repaso.
  ```ts
  if (session?.finishedAt && !session.repaso && !reportedRef.current) { ... postQuizResult ... }
  ```
- Pasar `repaso={session.repaso}` a `QuizRunner`.

### 5.4 `QuizRunner.tsx`
- Nueva prop `repaso?: boolean`.
- Pasar `repaso` a `QuestionCard`.
- **Navegación en repaso:**
  - Ocultar el botón "Terminar" (no hay nota que calcular) **o** reemplazarlo por
    "Salir" que llama a `onFinish`/reset → vuelve a `StartScreen`.
  - Decisión propuesta: mostrar botón **"Salir del repaso"** que llama a un nuevo
    `onExit` → `reset()` (vuelve a la pantalla de inicio, sin ResultsScreen).
  - Contador "Respondidas: N" se oculta o se sustituye por etiqueta "Repaso".

### 5.5 `QuestionCard.tsx`
- Propagar `repaso` a `ChoiceQuestionCard` y `FillQuestionCard`.

### 5.6 `ChoiceQuestionCard.tsx`
- Nueva prop `repaso?: boolean`.
- `const revealed = answered || repaso`.
- **Pista:** si `repaso`, render pista siempre abierta y fija (sin botón toggle).
  Si no, comportamiento actual.
- **Opciones:** `stateFor` recibe `repaso`. En repaso:
  - opción correcta → `'correct'` (verde ✓).
  - resto → `'idle'`.
  - `onPick` = no-op; `disabled = true` siempre (solo lectura).
- **Feedback:** si `repaso`, mostrar `FeedbackBanner` en variante neutra
  (ver 5.8) — sin "¡Correcto!/Incorrecto", solo respuesta correcta + explicación
  + evidencia.

### 5.7 `FillQuestionCard.tsx`
- Nueva prop `repaso?: boolean`.
- En repaso: input deshabilitado, mostrando la **respuesta correcta**
  (`primaryCorrect(question)`) pre-rellenada en verde; pista visible; banner
  neutro. Sin botón "Comprobar".

### 5.8 `FeedbackBanner.tsx`
- Añadir prop opcional `repaso?: boolean`.
- Si `repaso`: cabecera neutra ("Respuesta correcta:" + `primaryCorrect`) en vez
  de "¡Correcto!/Respuesta incorrecta", manteniendo explicación + evidencia.
  Color neutro (slate/emerald suave).
- Modo normal: sin cambios.

### 5.9 `AnswerOption.tsx`
- **Sin cambios.** Ya soporta el estado `correct` (verde). Repaso reutiliza
  estados existentes.

---

## 6. Flujo en modo repaso

1. Usuario marca "Modo repaso" en `StartScreen`, elige config, pulsa "Empezar
   repaso".
2. `start({..., repaso:true})` crea sesión con mismas preguntas filtradas.
3. `QuizRunner` (repaso) renderiza cada pregunta con: correcta en verde, pista
   abierta, banner explicativo. Opciones bloqueadas.
4. Usuario navega ←/→. No hay respuestas que registrar.
5. "Salir del repaso" → `reset()` → vuelve a `StartScreen`. **Nunca** se llama a
   `postQuizResult` ni se muestra `ResultsScreen`.

---

## 7. Casos borde

- **Sesión repaso persistida + recarga:** `useQuizSession` rehidrata; como
  `finishedAt` es null, reanuda el repaso. OK (la config de filtrado ya está en
  `questions`). El flag `repaso` viaja en `SessionState`.
- **Preguntas sin `hint`:** no se renderiza bloque pista (igual que hoy).
- **Preguntas multi-correcta (`correctIndex: number[]`):** marcar todas en verde.
- **FillQuestion sin opciones:** mostrar texto correcto vía `primaryCorrect`.
- **Sesión normal vieja en localStorage:** `repaso` ausente ⇒ `false` ⇒ test
  normal intacto.
- **`AiHelpButton`:** se mantiene visible en repaso (no molesta). Confirmar.

---

## 8. Garantías de no-regresión

- Todos los cambios de comportamiento van **detrás de `repaso === true`**. Con
  `repaso` falso/ausente el código sigue exactamente la rama actual.
- No se cambia `VERSION` de localStorage → sesiones existentes intactas.
- `AnswerOption` y la lógica de scoring (`isCorrect`, `summarize`) no se tocan.
- Firma de `onStart` gana un parámetro **opcional** al final → llamadas
  existentes siguen compilando.

---

## 9. Plan de pruebas (manual)

1. Quiz normal (sin checkbox): responder, ver verde/rojo al elegir, terminar, ver
   ResultsScreen con nota, resultado enviado. **Igual que antes.**
2. Quiz repaso: marcar checkbox, empezar → todas las correctas en verde, pistas
   abiertas, explicación visible, opciones no clicables.
3. Navegar ←/→ en repaso recorre todas las preguntas.
4. Salir del repaso → vuelve a StartScreen, **no** aparece ResultsScreen, **no**
   se postea resultado (verificar Network / ausencia de llamada).
5. Repetir 1-4 en: `[subject]` genérico, `redes/temario`, `redes/autoevaluacion`,
   `estadistica/test`, inglés (mixto + cuatris).
6. FillQuestion (subjects con kind 'fill'): correcta pre-rellenada en repaso.
7. Recargar página a mitad de repaso → reanuda en repaso.

---

## 10. Rollback

Cambios aislados y aditivos. Revertir = quitar el campo `repaso` y sus ramas
condicionales. Sin migraciones de datos. `git revert` del commit basta.

---

## 11. Archivos tocados (resumen)

| Archivo | Cambio |
|---------|--------|
| `src/components/quiz/useQuizSession.ts` | +campo `repaso` en StartOpts y SessionState |
| `src/components/quiz/StartScreen.tsx` | checkbox + estado + firma onStart |
| `src/components/quiz/QuizSession.tsx` | propagar repaso, guard postQuizResult, onExit |
| `src/components/quiz/QuizRunner.tsx` | prop repaso, botón "Salir del repaso" |
| `src/components/quiz/QuestionCard.tsx` | propagar repaso |
| `src/components/quiz/ChoiceQuestionCard.tsx` | reveal forzado, pista fija, read-only |
| `src/components/quiz/FillQuestionCard.tsx` | respuesta pre-rellenada, read-only |
| `src/components/quiz/FeedbackBanner.tsx` | variante neutra repaso |

`AnswerOption.tsx`: sin cambios. Legacy `src/apps/quiz/*`: sin cambios.
