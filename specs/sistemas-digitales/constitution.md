# Constitution — Sistemas Digitales

Principios inamovibles de la feature. Toda decisión posterior los respeta.

- **Identidad de la asignatura.** `Sistemas Digitales` (SDIG) es de **1º curso, 2º cuatrimestre**.
  La asignatura ya existe en [public/data/quiz/_subjects.json](../../public/data/quiz/_subjects.json)
  (`id: sistemas-digitales`, `curso: 1`) con un banco de 20 preguntas solo-texto. Esta
  feature **amplía**, no reemplaza, ese banco.
- **Reutilizar el flujo de quiz sin romper lo existente.** Se reusa el runner estándar
  (`QuizSession` → `StartScreen`/`QuizRunner`). Cualquier cambio al núcleo del quiz
  (schema, BD, tarjetas) es **aditivo y retrocompatible**: las asignaturas y preguntas
  actuales se comportan exactamente igual.
- **Soporte de imágenes opcional.** Las preguntas pueden llevar un campo `image` opcional.
  Una pregunta sin `image` se renderiza como hoy. El campo nunca es obligatorio.
- **HTML de estudio: estáticos y externos.** Los documentos `simulacro_examen.html` y
  `guia_escritura.html` se sirven **tal cual** desde `/public` y se abren en **pestaña
  nueva**. No se reescriben, no se incrustan en el runner, no se parsea su markup en
  tiempo de ejecución. Son material de estudio autocontenido.
- **Fidelidad al material real.** Las 12 preguntas nuevas y sus imágenes derivan del
  examen real (`simulacro_examen.html`). El enunciado, las opciones y la respuesta
  correcta reflejan el documento original.
- **Datos primero (data-driven).** Tanto las preguntas (JSON → SQLite por seed) como los
  enlaces a material externo (campo en metadatos de asignatura) son datos, no código
  hardcodeado por asignatura. Lo que se añada debe servir a cualquier asignatura futura.
