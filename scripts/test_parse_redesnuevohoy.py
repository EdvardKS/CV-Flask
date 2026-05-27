"""Unit tests for parse_redesnuevohoy.parse_file.

Run: `python scripts/test_parse_redesnuevohoy.py`
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from parse_redesnuevohoy import parse_file  # noqa: E402


def write_temp(text: str) -> Path:
    fd = tempfile.NamedTemporaryFile(
        mode="w", suffix=".txt", delete=False, encoding="utf-8"
    )
    fd.write(text)
    fd.close()
    return Path(fd.name)


class ParseFileTests(unittest.TestCase):
    def test_ud_1_style_numbered_questions_uppercase_options(self) -> None:
        sample = """\
    EXAMEN TIPO TEST
Asignatura: Algo
Instrucciones: marca una.

1. ¿Pregunta uno?
A) Op A
B) Op B
C) Op C
D) Op D

2. ¿Pregunta dos con texto
que continúa en otra línea?
A) Alfa
B) Beta
C) Gamma
D) Delta
SOLUCIONES
1. B
2. D
"""
        path = write_temp(sample)
        out = parse_file(path)
        self.assertEqual(len(out), 2)
        self.assertEqual(out[0]["q"], "¿Pregunta uno?")
        self.assertEqual(out[0]["options"], ["Op A", "Op B", "Op C", "Op D"])
        self.assertEqual(out[0]["correctIndex"], 1)
        self.assertIn("texto que continúa en otra línea", out[1]["q"])
        self.assertEqual(out[1]["correctIndex"], 3)

    def test_ud_2_style_pregunta_header_lowercase_options(self) -> None:
        sample = """\
Tema 2.2.- EXAMEN TIPO TEST

Pregunta 1
¿Primera?
a) uno
b) dos
c) tres
d) cuatro

Pregunta 2

¿Segunda?
a) A
b) B
c) C
d) D
RESPUESTAS
    1. b
2. c
"""
        path = write_temp(sample)
        out = parse_file(path)
        self.assertEqual(len(out), 2)
        self.assertEqual(out[0]["correctIndex"], 1)
        self.assertEqual(out[1]["correctIndex"], 2)

    def test_solutions_header_with_trailing_words(self) -> None:
        sample = """\
1. ¿Q?
A) a
B) b
C) c
D) d
Respuestas correctas
1. C
"""
        path = write_temp(sample)
        out = parse_file(path)
        self.assertEqual(len(out), 1)
        self.assertEqual(out[0]["correctIndex"], 2)

    def test_multiline_option_text_joins(self) -> None:
        sample = """\
1. ¿Q?
A) Opción que se
parte en varias líneas
B) Otra
C) Otra2
D) Otra3
SOLUCIONES
1. A
"""
        path = write_temp(sample)
        out = parse_file(path)
        self.assertEqual(out[0]["options"][0], "Opción que se parte en varias líneas")

    def test_question_without_answer_is_dropped(self) -> None:
        sample = """\
1. ¿Sin respuesta?
A) a
B) b
C) c
D) d
SOLUCIONES
"""
        path = write_temp(sample)
        self.assertEqual(parse_file(path), [])

    def test_question_missing_options_is_dropped(self) -> None:
        sample = """\
1. ¿Solo dos?
A) a
B) b
SOLUCIONES
1. A
"""
        path = write_temp(sample)
        self.assertEqual(parse_file(path), [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
