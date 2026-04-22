"""CLI wrapper around padel_scout.py business logic.

Usage (called from Next.js API routes):
    echo '{"jugador":"Juan"}' | python3 padel_cli.py iniciar
    echo '{"jugador":"Juan","id_partido":1,"sets":[...]}' | python3 padel_cli.py finalizar
    python3 padel_cli.py resumen --jugador Juan --id-partido all --numero-set all

Reads JSON from stdin (for POST-like commands), writes JSON to stdout.
Exit code non-zero on error; stderr carries the traceback.

Output data dir can be overridden with the PADEL_DATA_DIR env var.
"""
import argparse
import importlib.util
import json
import os
import sys
import types
from pathlib import Path


def load_padel_scout():
    """Load padel_scout.py as a module, stubbing out Flask deps."""
    here = Path(__file__).resolve().parent
    scout_path = here / 'padel_scout.py'

    # Stub Flask so the import doesn't fail and the blueprint is never actually
    # used (we only call plain helper functions).
    flask_stub = types.ModuleType('flask')
    class _Bp:
        def __init__(self, *a, **kw): pass
        def route(self, *a, **kw):
            def deco(fn): return fn
            return deco
    flask_stub.Blueprint = _Bp
    flask_stub.jsonify = lambda *a, **kw: None
    flask_stub.render_template = lambda *a, **kw: ''
    flask_stub.send_from_directory = lambda *a, **kw: None

    class _Request:
        def get_json(self, silent=True): return {}
        args = {}
    flask_stub.request = _Request()
    sys.modules.setdefault('flask', flask_stub)

    spec = importlib.util.spec_from_file_location('padel_scout', scout_path)
    mod = importlib.util.module_from_spec(spec)
    # Override OUTPUT_DIR before exec? No — it's computed on load. We patch after.
    spec.loader.exec_module(mod)

    # Allow env override of CSV output directory (for Docker volume mount).
    override = os.environ.get('PADEL_DATA_DIR')
    if override:
        os.makedirs(override, exist_ok=True)
        mod.OUTPUT_DIR = override
    else:
        os.makedirs(mod.OUTPUT_DIR, exist_ok=True)
    return mod


def cmd_iniciar(mod, payload):
    name = (payload.get('jugador') or '').strip()
    visible, filename, file_path = mod.ensure_player_csv(name)
    next_id = mod.get_next_match_id(file_path)
    return {'jugador': visible, 'archivo': filename, 'id_partido': next_id}


def cmd_finalizar(mod, payload):
    name = (payload.get('jugador') or '').strip()
    match_id = mod.parse_positive_int(payload.get('id_partido'), 'id_partido')
    sets = payload.get('sets') or []
    _, _, file_path = mod.ensure_player_csv(name)
    expected = mod.get_next_match_id(file_path)
    if match_id != expected:
        raise ValueError(f'El ID_Partido esperado es {expected}. Reinicia la sesión.')
    rows = mod.validate_sets_payload(match_id, sets)
    mod.append_rows_to_csv(file_path, rows)
    return {
        'ok': True,
        'filas_guardadas': len(rows),
        'siguiente_id_partido': mod.get_next_match_id(file_path),
    }


def cmd_resumen(mod, args):
    name = (args.jugador or '').strip()
    visible, _ = mod.normalize_player_name(name)
    _, file_path = mod.get_player_csv_path(visible)
    if not os.path.exists(file_path):
        return {'__status': 404, 'message': 'No existe historial para ese jugador.'}
    all_rows = mod.load_player_rows(file_path)
    match_filter = (args.id_partido or 'all').strip() or 'all'
    set_filter = (args.numero_set or 'all').strip() or 'all'
    filtered_by_match, filtered_rows, available_sets = mod.filter_rows(all_rows, match_filter, set_filter)
    if match_filter == 'all':
        available_sets = sorted({row['Numero_Set'] for row in all_rows})
    else:
        available_sets = sorted({row['Numero_Set'] for row in filtered_by_match})
    return mod.build_summary_payload(
        player_name=visible,
        all_rows=all_rows,
        filtered_rows=filtered_rows,
        available_sets=available_sets,
        match_filter=match_filter,
        set_filter=set_filter,
    )


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest='cmd', required=True)
    sub.add_parser('iniciar')
    sub.add_parser('finalizar')
    r = sub.add_parser('resumen')
    r.add_argument('--jugador', default='')
    r.add_argument('--id-partido', default='all', dest='id_partido')
    r.add_argument('--numero-set', default='all', dest='numero_set')
    args = parser.parse_args()

    try:
        mod = load_padel_scout()
        if args.cmd in ('iniciar', 'finalizar'):
            payload = {}
            if not sys.stdin.isatty():
                raw = sys.stdin.read().strip()
                payload = json.loads(raw) if raw else {}
            result = cmd_iniciar(mod, payload) if args.cmd == 'iniciar' else cmd_finalizar(mod, payload)
        else:
            result = cmd_resumen(mod, args)
        sys.stdout.write(json.dumps(result, ensure_ascii=False))
        sys.stdout.flush()
        status = result.pop('__status', None) if isinstance(result, dict) else None
        sys.exit(0 if not status else 10 + (status - 400))
    except (ValueError, getattr(load_padel_scout.__globals__.get('mod', object), 'SchemaMismatchError', ValueError) if False else ValueError) as exc:
        sys.stdout.write(json.dumps({'message': str(exc)}, ensure_ascii=False))
        sys.exit(1)
    except Exception as exc:
        import traceback
        sys.stderr.write(traceback.format_exc())
        sys.stdout.write(json.dumps({'message': f'Error: {exc}'}, ensure_ascii=False))
        sys.exit(2)


if __name__ == '__main__':
    main()
