# Plan

1. Añadir `redes` al seed de asignaturas y generar `redes.json` plano para conservar conteo y filtros.
2. Añadir manifests específicos para el hub de Redes, cuestionarios de temario y conceptos por tema.
3. Implementar rutas dedicadas bajo `/quiz/redes/*`.
4. Reutilizar `QuizSession` con una clave de sesión por cuestionario para no mezclar progreso entre tests.
5. Renderizar los PDFs teóricos con resaltados superpuestos y explicación textual por página seleccionada.
