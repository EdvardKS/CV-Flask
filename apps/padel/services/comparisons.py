"""Hand / phase / impact comparisons."""
from ..constants import (ERROR_WEIGHTS, HAND_BREAKDOWN, IMPACT_BUCKETS,
                         PROFILE_AREAS, SUCCESS_WEIGHTS)
from .scoring import calculate_area_score


def build_hand_comparison(error_totals, success_totals):
    out = []
    for hand, d in HAND_BREAKDOWN.items():
        errs = sum(error_totals[f] for f in d['negative'])
        wins = sum(success_totals[f] for f in d['positive'])
        out.append({'mano': hand, 'errores': errs, 'aciertos': wins, 'balance': wins - errs})
    return out


def build_phase_comparison(error_totals, success_totals):
    out = []
    for phase, d in PROFILE_AREAS.items():
        a = calculate_area_score(d['positive'], d['negative'], success_totals, error_totals)
        out.append({'fase': phase, 'aciertos': a['aciertos'], 'errores': a['errores'],
                    'balance': a['aciertos'] - a['errores'],
                    'impacto': a['impacto'], 'score': a['score']})
    return out


def build_impact_breakdown(error_totals, success_totals):
    weights_for = lambda fields, weights, totals: round(
        sum(totals[f] * weights[f] for f in fields), 2)
    weighted = {}
    for cat, fields in IMPACT_BUCKETS.items():
        if cat.startswith('Aciertos'):
            weighted[cat] = weights_for(fields, SUCCESS_WEIGHTS, success_totals)
        else:
            weighted[cat] = weights_for(fields, ERROR_WEIGHTS, error_totals)
    return [{'categoria': cat, 'puntos': pts,
             'tipo': 'acierto' if cat.startswith('Aciertos') else 'error'}
            for cat, pts in weighted.items()]
