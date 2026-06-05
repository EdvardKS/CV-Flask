# Cómo añadir una asignatura (subject) al Quiz

> Guía para humanos **y para el agente (Claude Code)**. Describe la arquitectura,
> qué datos hacen falta y el procedimiento para dar de alta una asignatura nueva
> en el sistema de tests estilo Moodle UAX.
>
> **Regla clave para el agente:** si falta cualquier dato **obligatorio** para
> implementar la asignatura, **NO inventes** ni rellenes con placeholders.
> Detente y haz un *human pause* (`AskUserQuestion`) pidiendo exactamente lo que
> falta (ver §6). Solo continúa cuando el usuario lo proporcione.

---

## 1. Arquitectura — qué componentes intervienen

```
app/quiz/
  layout.tsx              Chrome persistente (UaxTopBar) + carga quiz.css
  page.tsx                Home "Mis asignaturas" (lista + buscador + grupos)
  [subject]/page.tsx      Página genérica de una asignatura (la mayoría usan esta)
  estadistica/…           Hub especial (test general + ejercicio guiado FB6)
  redes/…                 Hub especial (temario / autoevaluación / conceptos)

src/lib/quiz/             CAPA DE DATOS (servidor)
  types.ts                Esquemas Zod: subjectMetaSchema, choice/fill question
  schema.sql.ts           DDL SQLite (tablas quiz_subjects / quiz_questions)
  db.ts                   Conexión + migraciones ALTER por columna
  seed.ts                 Ingesta de JSON → SQLite (idempotente por mtime)
  repo.ts                 Lectura: listSubjects / getSubject / listQuestions
  paths.ts                Rutas de la DB y del seed dir

src/components/quiz/      CAPA DE UI (cliente)
  SubjectFilters.tsx      Buscador + agrupación curso→cuatrimestre (home)
  SubjectCard.tsx         Tarjeta de asignatura
  StartScreen.tsx         Configurar intento (temas, mix, cuatri, nº, repaso)
  AttemptsPanel.tsx       "Intentos anteriores" (localStorage)
  QuizSession.tsx         Orquestador: start → runner → results / review
  useQuizSession.ts       Estado de la sesión (localStorage, flags, answers)
  QuizRunner.tsx          Examen: 1/página o todas + nav lateral
  QuestionNavPanel.tsx    Cuadrícula numerada de navegación (Moodle)
  QuestionCard.tsx        Dispatcher choice/fill + QuestionFrame
  question/QuestionFrame  Caja "Pregunta N · estado · Marcar"
  question/QuestionBody   Caja azul: contexto/instrucciones, enunciado, código
  question/AnswerFeedback Caja crema: correcta/incorrecta + explicación
  AnswerOption.tsx        Opción tipo radio (choice)
  ChoiceQuestionCard.tsx  Pregunta de opciones
  FillQuestionCard.tsx    Pregunta de rellenar hueco
  AttemptResultView.tsx   Tabla resumen Moodle + revisión detallada
  attempts.ts             Historial de intentos en localStorage
  palette.ts              Paleta Moodle UAX (fuente única de color)

public/data/quiz/
  _subjects.json          Registro de TODAS las asignaturas (metadatos)
  {id}.json               Banco de preguntas de cada asignatura
```

**Para una asignatura estándar NO se toca ningún componente .tsx ni la capa de
datos.** Basta con (a) crear `{id}.json` y (b) registrar la entrada en
`_subjects.json`. La UI y los filtros funcionan automáticamente.

---

## 2. Modelo de datos

### 2.1 Metadatos de asignatura — entrada en `public/data/quiz/_subjects.json`

Validado por `subjectMetaSchema` en [src/lib/quiz/types.ts](../../src/lib/quiz/types.ts).

| Campo          | Obligatorio | Tipo / valores                     | Para qué sirve |
|----------------|-------------|------------------------------------|----------------|
| `id`           | **Sí**      | minúsculas, dígitos y guiones (`^[a-z0-9-]+$`) | Clave única + ruta `/quiz/{id}` + nombre del fichero `{id}.json` |
| `name`         | **Sí**      | string                             | Título visible |
| `description`  | Recomendado | string                             | Texto de la tarjeta + buscador |
| `icon`         | Recomendado | emoji                              | Icono (chip magenta). Default `📝` |
| `color`        | Recomendado | hex `#rrggbb`                      | Acento de la asignatura (borde/icono/badge). Default `#3a6ea5` |
| `curso`        | Recomendado | entero 1–6                         | Agrupación en la home |
| `cuatrimestre` | Recomendado | `1` \| `2` \| (omitir = Anual)     | Agrupación en la home |
| `entryMode`    | No          | `"standard"` \| `"hub"`            | `hub` ⇒ página propia (ver §5). Default `standard` |

### 2.2 Banco de preguntas — fichero `public/data/quiz/{id}.json`

Un array de preguntas. Dos tipos (discriminados por `kind`). Si una entrada no
trae `kind`, se asume `choice` (retrocompatibilidad).

**Pregunta de opciones (`choice`):**
```json
{
  "kind": "choice",
  "q": "¿Cuál es el complemento a 2 de 0101 en 4 bits?",
  "options": ["1011", "1010", "0101", "1101"],
  "correctIndex": 0,
  "category": "tema-3",
  "cuatrimestre": 2,
  "hint": "Invierte los bits y suma 1.",
  "explanationCorrect": "~0101 = 1010; 1010 + 1 = 1011.",
  "explanationWrong": "Recuerda: complemento a 1 y luego +1.",
  "evidence": "Tema 3, diapositiva 12.",
  "code": "0101  ->  ????",
  "context": "Trabaja en aritmética de 4 bits sin signo."
}
```
- `correctIndex` puede ser un número **o** un array (varias correctas válidas).

**Pregunta de rellenar (`fill`):**
```json
{
  "kind": "fill",
  "q": "Form a word from \"visible\": \"NFT owners enjoy public ___ of their purchases.\"",
  "accept": ["visibility"],
  "category": "unidad-6",
  "hint": "Sustantivo derivado de 'visible'.",
  "explanationCorrect": "visible → visibility."
}
```
- `accept` puede ser string o array (todas las variantes aceptadas; se comparan
  sin distinguir mayúsculas/espacios — ver `normalizeFill`).
- El enunciado puede contener `___` para mostrar el hueco resaltado.

**Campos por pregunta:**

| Campo                | Obligatorio | Aplica a | Para qué |
|----------------------|-------------|----------|----------|
| `kind`               | Recomendado | ambas    | `"choice"` o `"fill"` |
| `q`                  | **Sí**      | ambas    | Enunciado |
| `options`            | **Sí (choice)** | choice | 2–8 opciones |
| `correctIndex`       | **Sí (choice)** | choice | índice(s) correcto(s), base 0 |
| `accept`             | **Sí (fill)**   | fill   | respuesta(s) aceptada(s) |
| `category`           | Recomendado | ambas    | Habilita el **multicheck de temas** en StartScreen. Formatos reconocidos: `tema-N`, `unidad-N`, `tN`, `udN` → "Tema N" |
| `cuatrimestre`       | No          | ambas    | `1`/`2`. Filtra por cuatri dentro de la asignatura (útil en Inglés) |
| `group`              | No          | ambas    | Marca un subconjunto (p.ej. `"latest-test"` en Inglés) |
| `hint`               | No          | ambas    | Pista (botón "Mostrar pista" / visible en repaso) |
| `explanationCorrect` | No          | ambas    | Explicación al acertar / en repaso |
| `explanationWrong`   | No          | ambas    | Explicación al fallar |
| `evidence`           | No          | ambas    | "¿Por qué?" (referencia a fuente) |
| `code`               | No          | ambas    | Bloque de código monoespaciado |
| `context`            | No          | ambas    | Caja de instrucciones/lectura previa |

> ⚠️ Las columnas `hint`, `explanationCorrect`, `explanationWrong` y `group`
> **se persisten en SQLite** (ver §4). Si añades un campo NUEVO al esquema de
> pregunta tendrás que tocar `schema.sql.ts`, `db.ts` (migración), `seed.ts`
> (insert) y `repo.ts` (select + mapeo). Para campos existentes no hace falta.

---

## 3. Procedimiento — añadir una asignatura ESTÁNDAR

1. **Crear el banco**: `public/data/quiz/{id}.json` con el array de preguntas (§2.2).
2. **Registrar la asignatura**: añadir un objeto a `public/data/quiz/_subjects.json` (§2.1).
3. **Resembrar la DB de desarrollo** (el seed es idempotente por `mtime`, pero si
   cambiaste el esquema o quieres forzar): borra `data/quiz/quiz.db*`. Se
   regenera al arrancar.
4. **Verificar**:
   ```bash
   npx tsc --noEmit         # tipos
   npx vitest run           # tests
   npm run dev              # /quiz y /quiz/{id}
   ```
5. La asignatura aparece sola en la home (agrupada por curso/cuatri y buscable),
   y `/quiz/{id}` ofrece la configuración de intento + el examen.

**No se modifica ningún componente.** Categorías, cuatrimestres, mix, límites,
repaso, feedback inmediato e historial de intentos funcionan por datos.

---

## 4. Cuándo SÍ hay que tocar componentes / capa de datos

| Necesidad | Ficheros a tocar |
|-----------|------------------|
| Campo nuevo en la pregunta que deba persistir | `types.ts` + `schema.sql.ts` + `db.ts` (ALTER) + `seed.ts` (INSERT) + `repo.ts` (SELECT + map) |
| Campo nuevo en metadatos de asignatura        | `types.ts` (`subjectMetaSchema`) + `schema.sql.ts` + `db.ts` + `seed.ts` (`upsertSubject`) + `repo.ts` (`listSubjects`/`SubjectRow`) |
| Nuevo tipo de pregunta (≠ choice/fill)         | `types.ts` (nuevo schema + unión) + un `XxxQuestionCard.tsx` + dispatcher en `QuestionCard.tsx` |
| Agrupación/filtros distintos en la home        | `SubjectFilters.tsx` |
| Modo "hub" (ver §5)                            | nueva carpeta de ruta + componente de hub |

Tras cualquier cambio de esquema: borra `data/quiz/quiz.db*` y reejecuta tsc + tests.

---

## 5. Asignaturas "hub" (caso especial)

`entryMode: "hub"` indica que la asignatura NO usa la página genérica
`[subject]/page.tsx`, sino una ruta propia con varios modos. Ejemplos vivos:
- **Estadística** (`app/quiz/estadistica/`): test general + ejercicio guiado FB6.
- **Redes** (`app/quiz/redes/`): cuestionarios de temario, autoevaluación, conceptos.

Crear un hub es trabajo de programación a medida (rutas, manifiestos en
`src/lib/quiz/redes.ts`, componentes propios). Reutiliza `QuizSession`,
`QuizPageShell`, `QuizHeader` y `breadcrumb`. **No lo emprendas sin
especificación**: si el usuario pide algo "tipo Redes/Estadística", haz un human
pause (§6) para acordar los modos, fuentes de datos y navegación.

---

## 6. Checklist de información requerida + HUMAN PAUSE

Antes de implementar, el agente debe tener TODO lo **obligatorio**. Si falta algo,
**parar y preguntar** con `AskUserQuestion` (no inventar):

**Mínimo imprescindible:**
- [ ] `id` de la asignatura (slug).
- [ ] `name` visible.
- [ ] El **banco de preguntas**: o bien el JSON, o el material fuente (PDF, temario,
      examen) del que extraerlas. Sin contenido real **no se crean preguntas**.
- [ ] Por cada pregunta: enunciado + (opciones + correcta) ó (respuesta aceptada).

**Recomendado (si no se da, preguntar o usar default razonable y avisar):**
- [ ] `curso` y `cuatrimestre` (para la agrupación de la home).
- [ ] `icon`, `color` (acento).
- [ ] `category` por pregunta (para el multicheck de temas) y su nomenclatura.
- [ ] ¿Hay pistas/explicaciones? (`hint`, `explanationCorrect/Wrong`, `evidence`).
- [ ] ¿Es "standard" o "hub"? Si hub, qué modos.

### Plantilla de human pause (lo que el agente debe preguntar)
Cuando falte info, lanzar `AskUserQuestion` con preguntas como:
1. **Contenido** — "¿Me pasas el banco de preguntas (JSON) o el material fuente
   (PDF/temario) para extraerlas? Sin contenido no puedo crear las preguntas."
2. **Ubicación curricular** — "¿De qué curso y cuatrimestre es? (para agruparla
   en la home)."
3. **Temas/categorías** — "¿Quieres poder filtrar por temas? Si sí, ¿qué temas y
   cómo se reparten las preguntas?"
4. **Pistas/feedback** — "¿Las preguntas llevan pista y explicación de
   correcto/incorrecto, o solo la respuesta correcta?"
5. **Tipo de entrada** — "¿Asignatura estándar (un único banco) o hub con varios
   modos como Redes/Estadística?"

No continuar con la implementación hasta resolver al menos el **mínimo
imprescindible**. Para lo recomendado, si el usuario no contesta, aplicar
defaults y **declararlos explícitamente** en la respuesta.

---

## 7. Verificación final (siempre)

```bash
npx tsc --noEmit     # 0 errores
npx vitest run       # tests verdes
npm run dev          # revisar /quiz (home) y /quiz/{id} (examen + repaso + intentos)
```
Si tocaste el esquema SQLite: `rm data/quiz/quiz.db*` antes de arrancar.
