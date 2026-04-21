"""JSON API endpoints for the padel scout."""
import json
import logging
import os

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from ..exceptions import SchemaMismatchError
from ..services.csv_io import (append_rows_to_csv, ensure_player_csv,
                               get_next_match_id, get_player_csv_path,
                               load_player_rows)
from ..services.payload import (build_summary_payload, filter_rows,
                                validate_sets_payload)
from ..utils.parse import parse_positive_int
from ..utils.text import normalize_player_name

logger = logging.getLogger(__name__)


def _err(exc, status=400):
    return JsonResponse({'message': str(exc)}, status=status)


@csrf_exempt
@require_http_methods(['POST'])
def iniciar(request):
    try:
        data = json.loads(request.body or b'{}')
        visible, filename, path = ensure_player_csv(data.get('jugador', ''))
        return JsonResponse({'jugador': visible, 'archivo': filename,
                             'id_partido': get_next_match_id(path)})
    except SchemaMismatchError as exc:
        return _err(exc, 409)
    except ValueError as exc:
        return _err(exc, 400)
    except Exception as exc:
        logger.exception('iniciar')
        return _err(exc, 500)


@csrf_exempt
@require_http_methods(['POST'])
def finalizar(request):
    try:
        data = json.loads(request.body or b'{}')
        match_id = parse_positive_int(data.get('id_partido'), 'id_partido')
        _, _, path = ensure_player_csv(data.get('jugador', ''))
        expected = get_next_match_id(path)
        if match_id != expected:
            raise ValueError(f'El ID_Partido esperado es {expected}.')
        rows = validate_sets_payload(match_id, data.get('sets', []))
        append_rows_to_csv(path, rows)
        return JsonResponse({'ok': True, 'filas_guardadas': len(rows),
                             'siguiente_id_partido': get_next_match_id(path)})
    except SchemaMismatchError as exc:
        return _err(exc, 409)
    except ValueError as exc:
        return _err(exc, 400)
    except Exception as exc:
        logger.exception('finalizar')
        return _err(exc, 500)


@require_http_methods(['GET'])
def resumen(request):
    try:
        visible, _ = normalize_player_name(request.GET.get('jugador', ''))
        _, path = get_player_csv_path(visible)
        if not os.path.exists(path):
            return JsonResponse({'message': 'No existe historial.'}, status=404)
        all_rows = load_player_rows(path)
        match_filter = (request.GET.get('id_partido') or 'all').strip() or 'all'
        set_filter = (request.GET.get('numero_set') or 'all').strip() or 'all'
        _, filtered, available_sets = filter_rows(all_rows, match_filter, set_filter)
        return JsonResponse(build_summary_payload(
            visible, all_rows, filtered, available_sets, match_filter, set_filter))
    except SchemaMismatchError as exc:
        return _err(exc, 409)
    except ValueError as exc:
        return _err(exc, 400)
    except Exception as exc:
        logger.exception('resumen')
        return _err(exc, 500)
