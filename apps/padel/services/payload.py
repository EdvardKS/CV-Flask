"""Validation + summary payload composition."""
from ..constants import (ERROR_BLOCK_FIELDS, ERROR_FIELDS, ERROR_LABELS,
                         GRAPH_TOOLTIPS, SUCCESS_BLOCK_FIELDS,
                         SUCCESS_FIELDS, SUCCESS_LABELS)
from ..utils.parse import parse_non_negative_int, parse_positive_int
from .comparisons import build_hand_comparison, build_phase_comparison
from .metrics import build_advanced_metrics
from .priorities import build_training_priorities
from .profile import build_player_profile
from .recommendations import build_insights
from .scoring import calculate_score_data
from .series import build_series_by_match, build_series_by_set
from .totals import (calculate_balance_total as _bal,
                     calculate_error_total as _et,
                     calculate_success_total as _st)


def validate_sets_payload(match_id, sets_payload):
    if not isinstance(sets_payload, list) or not sets_payload:
        raise ValueError('No hay sets para guardar.')
    rows = []
    expected = 1
    for raw in sets_payload:
        if not isinstance(raw, dict):
            raise ValueError('Cada set debe ser un objeto JSON.')
        n = parse_positive_int(raw.get('Numero_Set'), 'Numero_Set')
        if n != expected:
            raise ValueError('Los sets deben enviarse correlativos desde 1.')
        row = {'ID_Partido': match_id, 'Numero_Set': n}
        for f in ERROR_FIELDS + SUCCESS_FIELDS:
            row[f] = parse_non_negative_int(raw.get(f, 0), f)
        row['Total_ENF_Set'] = _et(row)
        row['Total_Aciertos_Set'] = _st(row)
        row['Balance_Set'] = _bal(row['Total_ENF_Set'], row['Total_Aciertos_Set'])
        rows.append(row)
        expected += 1
    return rows


def filter_rows(rows, match_filter, set_filter):
    by_match = rows
    if match_filter != 'all':
        mid = parse_positive_int(match_filter, 'id_partido')
        by_match = [r for r in rows if r['ID_Partido'] == mid]
    available_sets = sorted({r['Numero_Set'] for r in by_match})
    final = by_match
    if set_filter != 'all':
        n = parse_positive_int(set_filter, 'numero_set')
        final = [r for r in by_match if r['Numero_Set'] == n]
    return by_match, final, available_sets


def build_summary_payload(player_name, all_rows, filtered_rows,
                          available_sets, match_filter, set_filter):
    err_t = {f: sum(r[f] for r in filtered_rows) for f in ERROR_FIELDS}
    win_t = {f: sum(r[f] for r in filtered_rows) for f in SUCCESS_FIELDS}
    err_blocks = {b: sum(err_t[f] for f in fs) for b, fs in ERROR_BLOCK_FIELDS.items()}
    win_blocks = {b: sum(win_t[f] for f in fs) for b, fs in SUCCESS_BLOCK_FIELDS.items()}
    score = calculate_score_data(err_t, win_t)
    profile = build_player_profile(win_t, err_t, score)
    hand = build_hand_comparison(err_t, win_t)
    phase = build_phase_comparison(err_t, win_t)
    advanced = build_advanced_metrics(filtered_rows, err_t, win_t, score)
    priorities = build_training_priorities(err_t)
    return {
        'jugador': player_name,
        'filtros_aplicados': {'id_partido': match_filter, 'numero_set': set_filter},
        'filtros_disponibles': {
            'partidos': sorted({r['ID_Partido'] for r in all_rows}),
            'sets': available_sets,
        },
        'kpis': _kpis(filtered_rows, err_t, win_t, err_blocks),
        'errores_por_tipo': [{'clave': f, 'label': ERROR_LABELS[f], 'total': err_t[f]} for f in ERROR_FIELDS],
        'aciertos_por_tipo': [{'clave': f, 'label': SUCCESS_LABELS[f], 'total': win_t[f]} for f in SUCCESS_FIELDS],
        'series_por_partido': build_series_by_match(filtered_rows),
        'series_por_set': build_series_by_set(filtered_rows),
        'score_jugador': score, 'perfil_jugador': profile,
        'comparativa_manos': hand, 'comparativa_fases': phase,
        'metricas_avanzadas': advanced,
        'prioridades_entrenamiento': priorities,
        'tooltips_graficas': GRAPH_TOOLTIPS,
        'insights': build_insights(err_t, win_t, err_blocks, win_blocks,
                                   profile, score,
                                   {'comparativa_manos': hand, 'comparativa_fases': phase,
                                    'metricas_avanzadas': advanced},
                                   priorities),
    }


def _kpis(rows, err_t, win_t, err_blocks):
    n = len(rows)
    err = sum(r['Total_ENF_Set'] for r in rows)
    win = sum(r['Total_Aciertos_Set'] for r in rows)
    return {'partidos_analizados': len({r['ID_Partido'] for r in rows}),
            'sets_analizados': n, 'total_errores_no_forzados': err,
            'total_aciertos': win, 'balance_neto': sum(r['Balance_Set'] for r in rows),
            'media_errores_por_set': round(err / n, 2) if n else 0,
            'media_aciertos_por_set': round(win / n, 2) if n else 0}
