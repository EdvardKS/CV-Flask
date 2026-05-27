"""Parse Examen Ud.X.Y PDF text dumps from temp/REDESNUEVOHOY into JSON.

Run once after `pdftotext -layout -enc UTF-8 *.pdf *.txt` has been executed
inside `temp/REDESNUEVOHOY/`. Produces `scripts/redes_examenes_clase.json`
consumed by `generate_redes_data.py`.
"""
from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "temp" / "REDESNUEVOHOY"
OUT_PATH = Path(__file__).resolve().parent / "redes_examenes_clase.json"


QUESTION_RE = re.compile(r"^(\d+)\.\s+(.+)$")
PREGUNTA_RE = re.compile(r"^Pregunta\s+(\d+)\s*$", re.IGNORECASE)
OPTION_RE = re.compile(r"^([A-Da-d])[\.\)]\s*(.*)$")
SOL_HEADER_RE = re.compile(r"^\s*(SOLUCIONES|RESPUESTAS|Soluciones|Respuestas)\b.*$", re.IGNORECASE)
SOL_LINE_RE = re.compile(r"^\s*(\d+)\.\s*([A-Da-d])\.?\s*$")
HEADER_SKIPS = (
    "asignatura:",
    "duración",
    "duracion",
    "instrucciones:",
)


def parse_file(path: Path) -> list[dict]:
    lines = path.read_text(encoding="utf-8").splitlines()
    questions: dict[int, dict] = {}
    answers: dict[int, str] = {}

    cur_n: int | None = None
    cur_q: list[str] = []
    cur_opt: str | None = None
    cur_opt_text: list[str] = []
    in_sols = False

    def flush_opt() -> None:
        nonlocal cur_opt, cur_opt_text
        if cur_n is not None and cur_opt is not None:
            entry = questions.setdefault(cur_n, {"q": "", "opts": {}})
            entry["opts"][cur_opt] = " ".join(cur_opt_text).strip()
        cur_opt = None
        cur_opt_text = []

    def flush_q_text() -> None:
        if cur_n is not None and cur_q:
            entry = questions.setdefault(cur_n, {"q": "", "opts": {}})
            entry["q"] = " ".join(cur_q).strip()

    for raw in lines:
        line = raw.strip()
        if SOL_HEADER_RE.match(line):
            flush_opt()
            flush_q_text()
            in_sols = True
            continue
        if in_sols:
            m = SOL_LINE_RE.match(line)
            if m:
                answers[int(m.group(1))] = m.group(2).upper()
            continue
        if not line:
            continue
        upper = line.upper()
        if "EXAMEN" in upper and "TIPO" in upper:
            continue
        if any(line.lower().startswith(prefix) for prefix in HEADER_SKIPS):
            continue
        if line.lower().startswith("tema ") and "examen" in line.lower():
            continue

        m = PREGUNTA_RE.match(line)
        if m:
            flush_opt()
            flush_q_text()
            cur_n = int(m.group(1))
            cur_q = []
            continue

        if not OPTION_RE.match(line):
            m = QUESTION_RE.match(line)
            if m:
                flush_opt()
                flush_q_text()
                cur_n = int(m.group(1))
                cur_q = [m.group(2)]
                continue

        m = OPTION_RE.match(line)
        if m:
            flush_opt()
            cur_opt = m.group(1).upper()
            cur_opt_text = [m.group(2)]
            continue

        if cur_opt is not None:
            cur_opt_text.append(line)
        elif cur_n is not None:
            cur_q.append(line)

    flush_opt()
    flush_q_text()

    result: list[dict] = []
    for n in sorted(questions):
        item = questions[n]
        letter = answers.get(n)
        if not letter or letter not in item["opts"] or not item["q"]:
            continue
        options = [item["opts"].get(L, "").strip() for L in ("A", "B", "C", "D")]
        if not all(options):
            continue
        result.append(
            {
                "number": n,
                "q": item["q"],
                "options": options,
                "correctIndex": ord(letter) - ord("A"),
            }
        )
    return result


UD_RE = re.compile(r"Examen\s+Ud\.(\d+)(?:\.(\d+))?\.txt$", re.IGNORECASE)


def main() -> None:
    if not SRC_DIR.is_dir():
        raise SystemExit(f"Source dir not found: {SRC_DIR}")

    bundled: dict[str, list[dict]] = {}
    for txt in sorted(SRC_DIR.glob("Examen Ud.*.txt")):
        m = UD_RE.search(txt.name)
        if not m:
            continue
        tema = int(m.group(1))
        sub = m.group(2)
        ud_label = f"Ud.{tema}" if sub is None else f"Ud.{tema}.{sub}"
        pdf_name = txt.name[:-4] + ".pdf"
        items = parse_file(txt)
        for entry in items:
            entry["sourceFile"] = pdf_name
            entry["ud"] = ud_label
        bundled.setdefault(f"tema-{tema}", []).extend(items)

    OUT_PATH.write_text(
        json.dumps(bundled, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    total = sum(len(v) for v in bundled.values())
    per_tema = {k: len(v) for k, v in bundled.items()}
    print(f"Wrote {OUT_PATH} — {total} questions; per tema: {per_tema}")


if __name__ == "__main__":
    main()
