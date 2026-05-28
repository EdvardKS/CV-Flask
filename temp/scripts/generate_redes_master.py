import json
import re
import unicodedata
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "redesNUEVO"
RAW_DIR = OUT_DIR / "datasets_web"
MASTER_PATH = OUT_DIR / "redes_master.json"
AUDIT_PATH = OUT_DIR / "AUDITORIA_REDES.md"
LOCAL_PATH = OUT_DIR / "preguntas.json"
COMPLETE_LEGACY_PATH = OUT_DIR / "preguntas_completo.json"
API_URL = "https://redes-liard.vercel.app/api/datasets"
DATASET_URL = "https://redes-liard.vercel.app/datasets/"


TEMAS = {
    "UD1": "Introduccion, modelos, direccionamiento y dispositivos",
    "UD2": "LAN, WLAN, Ethernet, Bluetooth, VPN y VLAN",
    "UD3": "Cableado estructurado y normativa",
    "UD4": "Encaminamiento y sistemas autonomos",
    "UD5": "Repaso general",
    "UD6": "Criptografia, firma digital y seguridad",
}


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize_text(value):
    text = str(value or "").strip().lower()
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def selected_to_bool(value):
    return value is True or value == 1 or str(value).lower() in {"1", "true", "yes", "si", "sí"}


def tema_from_source(source):
    match = re.search(r"(?:Tema|Unidad)_(\d+)", source)
    if not match:
        return "UDX"
    return f"UD{match.group(1)}"


def bloque_from_source(source):
    return "temario" if source.startswith("Tema_") else "autoevaluacion"


def parse_web_question(raw, source, index):
    question = str(raw.get("question") or raw.get("qtext") or raw.get("text") or "").strip()
    answers = raw.get("answers") if isinstance(raw.get("answers"), list) else []
    options = {}
    correct = ""
    letters = "abcdefghijklmnopqrstuvwxyz"

    for answer_index, answer in enumerate(answers):
        if isinstance(answer, str):
            text = answer.strip()
            selected = False
        else:
            text = str(answer.get("text") or answer.get("answer") or "").strip()
            selected = selected_to_bool(answer.get("selected"))
        if not text:
            continue
        letter = letters[len(options)]
        options[letter] = text
        if selected:
            correct = letter

    if not question or len(options) < 2:
        return None

    tema = tema_from_source(source)
    base_id = source.replace(".json", "").replace("_", "-")
    correct_text = options.get(correct, "")
    return {
        "id": f"{base_id}-{index + 1:02d}",
        "tema": tema,
        "bloque": bloque_from_source(source),
        "source": source,
        "pregunta": question,
        "opciones": options,
        "respuesta_correcta": correct,
        "explicacion": f"Respuesta correcta: {correct_text}" if correct_text else "",
        "fingerprint": normalize_text(question),
    }


def parse_local_question(raw):
    question = str(raw.get("pregunta") or "").strip()
    options = raw.get("opciones") if isinstance(raw.get("opciones"), dict) else {}
    correct = str(raw.get("respuesta_correcta") or "").strip()
    tema = str(raw.get("tema") or "UDX").strip()
    explanation = raw.get("explicacion_acierto") or raw.get("explicacion") or ""
    return {
        "id": str(raw.get("id") or "").strip(),
        "tema": tema,
        "bloque": "autoevaluacion",
        "source": "redesNUEVO/preguntas.json",
        "pregunta": question,
        "opciones": options,
        "respuesta_correcta": correct,
        "explicacion": explanation,
        "fingerprint": normalize_text(question),
    }


def fetch_json(url):
    with urllib.request.urlopen(url, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def collect_txt_questions():
    questions = []
    for path in sorted((ROOT / "REDESNUEVOHOY").glob("*.txt")):
        text = path.read_text(encoding="utf-8", errors="replace")
        pattern = re.compile(r"(?m)^\s*(\d+)\.\s+(.+?)(?=\n\s*A\))", re.S)
        for match in pattern.finditer(text):
            question = re.sub(r"\s+", " ", match.group(2)).strip()
            questions.append({"source": path.name, "pregunta": question, "fingerprint": normalize_text(question)})
    return questions


def make_audit(files, web_questions, local_questions, txt_questions, unique_general):
    local_fps = {item["fingerprint"] for item in local_questions if item["fingerprint"]}
    txt_fps = {item["fingerprint"] for item in txt_questions if item["fingerprint"]}
    web_by_file = defaultdict(list)
    dup_web = defaultdict(list)
    dup_local = defaultdict(list)

    for item in web_questions:
        web_by_file[item["source"]].append(item)
        dup_web[item["fingerprint"]].append(item)
    for item in local_questions:
        dup_local[item["fingerprint"]].append(item)

    lines = [
        "# Auditoria Redes",
        "",
        "Asignatura: Introduccion a las Redes Informaticas.",
        "",
        "## Resumen",
        "",
        f"- JSON web detectados: {len(files)}.",
        f"- Preguntas web brutas: {len(web_questions)}.",
        f"- Preguntas locales previas en `redesNUEVO/preguntas.json`: {len(local_questions)}.",
        f"- Preguntas TXT de temario en `REDESNUEVOHOY`: {len(txt_questions)}.",
        f"- Preguntas del test general deduplicado: {len(unique_general)}.",
        f"- Preguntas web que faltaban en `preguntas.json`: {sum(1 for q in web_questions if q['fingerprint'] not in local_fps)}.",
        f"- Preguntas web que faltaban en TXT temario: {sum(1 for q in web_questions if q['fingerprint'] not in txt_fps)}.",
        "",
        "## Faltantes Por JSON",
        "",
        "| JSON web | Total | Faltan en preguntas.json | Faltan en TXT temario |",
        "|---|---:|---:|---:|",
    ]

    for file_name in files:
        items = web_by_file[file_name]
        lines.append(
            f"| `{file_name}` | {len(items)} | "
            f"{sum(1 for q in items if q['fingerprint'] not in local_fps)} | "
            f"{sum(1 for q in items if q['fingerprint'] not in txt_fps)} |"
        )

    lines.extend(["", "## Preguntas Repetidas En La Web", ""])
    duplicate_groups = [(fp, group) for fp, group in dup_web.items() if fp and len(group) > 1]
    lines.append(f"Grupos repetidos: {len(duplicate_groups)}.")
    lines.append("")
    for _, group in duplicate_groups:
        refs = ", ".join(f"`{item['source']}#{int(item['id'].split('-')[-1])}`" for item in group)
        lines.append(f"- {group[0]['pregunta']} :: {refs}")

    lines.extend(["", "## Preguntas Repetidas En El JSON Local", ""])
    local_duplicate_groups = [(fp, group) for fp, group in dup_local.items() if fp and len(group) > 1]
    lines.append(f"Grupos repetidos: {len(local_duplicate_groups)}.")
    lines.append("")
    for _, group in local_duplicate_groups:
        refs = ", ".join(f"`{item['id']}`" for item in group)
        lines.append(f"- {group[0]['pregunta']} :: {refs}")

    lines.extend(["", "## Preguntas Anadidas Al Banco Maestro", ""])
    added = [q for q in web_questions if q["fingerprint"] not in local_fps]
    lines.append(f"Total candidatas nuevas respecto a `preguntas.json`: {len(added)}.")
    lines.append("")
    for source, count in sorted(Counter(q["source"] for q in added).items()):
        lines.append(f"- `{source}`: {count}")

    return "\n".join(lines) + "\n"


def to_legacy_question(question, next_id_by_tema):
    tema = question["tema"]
    next_id_by_tema[tema] += 1
    return {
        "id": f"{tema}-{next_id_by_tema[tema]}",
        "tema": tema,
        "bloque": question["bloque"],
        "source": question["source"],
        "pregunta": question["pregunta"],
        "opciones": question["opciones"],
        "respuesta_correcta": question["respuesta_correcta"],
        "explicacion_acierto": question.get("explicacion") or "",
        "explicacion_error": question.get("explicacion") or "",
    }


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    files = fetch_json(API_URL)["files"]
    web_questions = []
    for file_name in files:
        payload = fetch_json(DATASET_URL + file_name)
        write_json(RAW_DIR / file_name, payload)
        items = payload.get("items") if isinstance(payload, dict) else payload
        for index, raw in enumerate(items or []):
            parsed = parse_web_question(raw, file_name, index)
            if parsed:
                web_questions.append(parsed)

    local_questions = []
    local_raw_questions = []
    if LOCAL_PATH.exists():
        local_payload = read_json(LOCAL_PATH)
        local_raw_questions = local_payload.get("preguntas", [])
        for raw in local_payload.get("preguntas", []):
            parsed = parse_local_question(raw)
            if parsed["pregunta"]:
                local_questions.append(parsed)

    merged_by_fingerprint = {}
    for question in local_questions + web_questions:
        fp = question["fingerprint"]
        if fp and fp not in merged_by_fingerprint:
            merged_by_fingerprint[fp] = question

    unique_general = list(merged_by_fingerprint.values())
    public_questions = [{k: v for k, v in q.items() if k != "fingerprint"} for q in local_questions + web_questions]
    public_unique = [{k: v for k, v in q.items() if k != "fingerprint"} for q in unique_general]

    master = {
        "asignatura": "Introduccion a las Redes Informaticas",
        "source_url": "https://redes-liard.vercel.app/",
        "temas": TEMAS,
        "stats": {
            "web_files": len(files),
            "web_questions_raw": len(web_questions),
            "local_questions_previous": len(local_questions),
            "all_questions_with_source_duplicates": len(public_questions),
            "general_deduplicated_questions": len(public_unique),
        },
        "datasets_web": files,
        "preguntas": public_questions,
        "test_general": public_unique,
    }
    write_json(MASTER_PATH, master)

    local_fps = {item["fingerprint"] for item in local_questions if item["fingerprint"]}
    next_id_by_tema = Counter()
    for item in local_raw_questions:
        tema = str(item.get("tema") or "UDX")
        match = re.search(r"-(\d+)$", str(item.get("id") or ""))
        if match:
            next_id_by_tema[tema] = max(next_id_by_tema[tema], int(match.group(1)))
        else:
            next_id_by_tema[tema] += 1

    legacy_additions = [
        to_legacy_question(question, next_id_by_tema)
        for question in web_questions
        if question["fingerprint"] not in local_fps
    ]
    complete_legacy = {
        "asignatura": "Introduccion a las Redes Informaticas",
        "temas": TEMAS,
        "stats": {
            "preguntas_originales": len(local_raw_questions),
            "preguntas_anadidas": len(legacy_additions),
            "preguntas_totales": len(local_raw_questions) + len(legacy_additions),
        },
        "preguntas": local_raw_questions + legacy_additions,
    }
    write_json(COMPLETE_LEGACY_PATH, complete_legacy)

    audit = make_audit(files, web_questions, local_questions, collect_txt_questions(), unique_general)
    AUDIT_PATH.write_text(audit, encoding="utf-8")

    print(f"OK {MASTER_PATH}")
    print(f"OK {COMPLETE_LEGACY_PATH}")
    print(f"OK {AUDIT_PATH}")
    print(json.dumps(master["stats"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
