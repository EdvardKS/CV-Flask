# Redes — Exámenes de clase (REDESNUEVOHOY)

Pipeline para incorporar los exámenes tipo test en PDF de `temp/REDESNUEVOHOY/`
al manifest de cuestionarios de temario de Redes, agrupándolos **una sola quiz
por tema** y deduplicando contra las preguntas ya presentes en el manifest.

## Resultado en `temario.json`

Cada tema con PDFs en `REDESNUEVOHOY` recibe una quiz adicional con id
`tema-N-examenes-de-clase` y `sourceType: "pdf-cuestionario-clase"`. Las
preguntas conservan su PDF de origen en `sourceFile` y la unidad concreta en
`ud` (`Ud.1.1`, `Ud.2.3`, etc.) — pero **no** se separan por punto específico:
todas las del tema viven en la misma quiz, ordenadas por `(ud, número)`.

Tamaños actuales (dedup vs resto de quizzes del mismo tema):

| Tema | Quizzes existentes | PDFs Ud.X.Y                 | Brutas | Tras dedup |
|------|--------------------|-----------------------------|--------|------------|
| 1    | 4                  | Ud.1.1 / Ud.1.2 / Ud.1.3    | 60     | 21         |
| 2    | 4                  | Ud.2.1 / Ud.2.2 / Ud.2.3    | 90     | 24         |
| 3    | 2                  | Ud.3.1 / Ud.3.2             | 60     | 57         |
| 4    | 1                  | Ud.4                        | 40     | 40         |

## Ficheros

| Ruta                                            | Rol                                                                                  |
|-------------------------------------------------|--------------------------------------------------------------------------------------|
| `temp/REDESNUEVOHOY/Examen Ud.*.pdf`            | PDFs originales (no se commitean, `temp/` está en `.gitignore`).                     |
| `temp/REDESNUEVOHOY/Examen Ud.*.txt`            | Volcado de texto via `pdftotext -layout`. Tampoco se commitea.                       |
| `scripts/parse_redesnuevohoy.py`                | Convierte los `.txt` a `redes_examenes_clase.json`.                                  |
| `scripts/redes_examenes_clase.json`             | Dataset persistente (committeado) con `{tema-N: [{q, options[4], correctIndex, sourceFile, ud}]}`. |
| `scripts/generate_redes_data.py`                | Lee el JSON anterior, deduplica vs manifest, agrupa por tema, escribe `public/data/quiz/redes/temario.json` y `public/data/quiz/redes.json`. |
| `src/lib/quiz/__tests__/redes.test.ts`          | Test del summary (totales).                                                          |
| `src/lib/quiz/__tests__/redes-examenes-clase.test.ts` | TDD: invariantes estructurales + dedup de las nuevas quizzes.                  |
| `scripts/test_parse_redesnuevohoy.py`           | TDD: unit tests del parser (formatos `Pregunta N`, `N.`, headers de soluciones, multi-línea). |

## Cómo refrescar tras añadir/modificar PDFs

```bash
# 1) Extraer texto (requiere poppler-utils / pdftotext en PATH)
cd temp/REDESNUEVOHOY
for f in *.pdf; do pdftotext -layout -enc UTF-8 "$f" "${f%.pdf}.txt"; done
cd -

# 2) Parsear PDFs → JSON estable
python scripts/parse_redesnuevohoy.py

# 3) Regenerar manifests del front
python scripts/generate_redes_data.py

# 4) Verificar
python scripts/test_parse_redesnuevohoy.py
npx vitest run src/lib/quiz/__tests__/redes.test.ts src/lib/quiz/__tests__/redes-examenes-clase.test.ts
```

## Reglas del parser (`parse_redesnuevohoy.py`)

- Detecta dos formatos en los PDFs:
  - `N. ¿pregunta?` + opciones `A)`/`A.` (mayúsculas).
  - `Pregunta N` en línea propia + pregunta en la siguiente + opciones `a)` (minúsculas).
- Tolera preguntas y opciones partidas en varias líneas: las líneas que no
  arrancan con número ni con letra de opción se concatenan al elemento abierto.
- Sección de soluciones: cualquier cabecera que **empiece** por `SOLUCIONES`,
  `RESPUESTAS`, `Soluciones` o `Respuestas` (también `Respuestas correctas`).
- Cada solución `N. X` (X ∈ A–D / a–d) se normaliza a mayúscula y se mapea a
  `correctIndex` (0..3).
- Descarta preguntas sin las 4 opciones completas o sin solución asociada.

## Reglas de dedup (`generate_redes_data.py`)

- Función `_normalize_question`: `lowercase` + arregla mojibake + elimina todo
  carácter que no sea alfanumérico latino. Garantiza que pequeñas diferencias
  de puntuación o espaciado no engañen al deduplicador.
- Se construye un `set` con todas las preguntas normalizadas presentes en el
  manifest (cuestionarios de PDF + quizzes manuales del profesor) **antes** de
  añadir las de clase. Las repetidas se descartan.
- También dedup intra-quiz (si la misma pregunta aparece en varios Ud.X.Y del
  mismo tema, sólo se conserva una vez).

## Invariantes garantizados por los tests

`redes-examenes-clase.test.ts` (vitest):

- Existe `tema-N-examenes-de-clase` para N ∈ {1, 2, 3, 4}.
- `quiz.questionCount === quiz.questions.length > 0`.
- `sourceType === 'pdf-cuestionario-clase'`.
- Cada pregunta: `kind === 'choice'`, `category === 'tema-N'`,
  `options.length === 4` (todas no vacías), `correctIndex ∈ [0,3]`,
  `sourceFile` empieza por `Examen Ud.`.
- Ninguna pregunta de `examenes-de-clase` coincide (normalizada) con otra
  pregunta del mismo tema en otra quiz.
- Sin duplicados internos en la propia quiz.
- `public/data/quiz/redes.json` contiene exactamente el mismo set de preguntas
  `pdf-cuestionario-clase` que el manifest temario.

`test_parse_redesnuevohoy.py` (unittest):

- Parseo formato `N. ... A) ...` con soluciones `SOLUCIONES / 1. B`.
- Parseo formato `Pregunta N` + minúsculas con `RESPUESTAS / 1. b`.
- Cabecera `Respuestas correctas` (palabras extra) reconocida.
- Opciones multilínea concatenadas correctamente.
- Preguntas sin respuesta o con menos de 4 opciones se descartan.
