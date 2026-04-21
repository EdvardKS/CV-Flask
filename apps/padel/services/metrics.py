"""Advanced metrics computed over filtered rows."""
from ..utils.text import clamp
from .comparisons import (build_hand_comparison, build_impact_breakdown,
                          build_phase_comparison)


def _stability(balances):
    if len(balances) > 1:
        mean_b = sum(balances) / len(balances)
        avg_dev = sum(abs(v - mean_b) for v in balances) / len(balances)
        return clamp(round(100 - avg_dev * 8, 1), 0, 100), mean_b
    if balances:
        return 100.0, balances[0]
    return 0.0, 0


def _stability_label(score):
    if score >= 80:
        return 'Muy estable'
    if score >= 65:
        return 'Bastante estable'
    if score >= 45:
        return 'Irregular'
    return 'Muy variable'


def build_advanced_metrics(filtered_rows, error_totals, success_totals, score_data):
    total_errs = sum(r['Total_ENF_Set'] for r in filtered_rows)
    total_wins = sum(r['Total_Aciertos_Set'] for r in filtered_rows)
    hand = build_hand_comparison(error_totals, success_totals)
    phase = build_phase_comparison(error_totals, success_totals)
    impact = build_impact_breakdown(error_totals, success_totals)
    ratio = round(total_wins / total_errs, 2) if total_errs else round(float(total_wins), 2)
    estabilidad, mean_balance = _stability([r['Balance_Set'] for r in filtered_rows])
    err_pts = max(score_data['puntos_error'], 1)
    win_pts = max(score_data['puntos_acierto'], 1)
    pick = lambda cat: next(i['puntos'] for i in impact if i['categoria'] == cat)
    return {
        'eficiencia_global': score_data['score'],
        'ratio_aciertos_error': ratio,
        'balance_derecha': next((h['balance'] for h in hand if h['mano'] == 'Derecha'), 0),
        'balance_reves': next((h['balance'] for h in hand if h['mano'] == 'Revés'), 0),
        'estabilidad_score': estabilidad,
        'estabilidad_label': _stability_label(estabilidad),
        'media_balance_por_set': round(mean_balance, 2),
        'fase_mas_productiva': max(phase, key=lambda i: (i['balance'], i['score']), default=None),
        'fase_mas_fragil': min(phase, key=lambda i: (i['score'], i['balance']), default=None),
        'peso_errores_alto_coste': round(100 * pick('Errores alto coste') / err_pts, 1),
        'peso_errores_tecnicos': round(100 * pick('Errores técnicos') / err_pts, 1),
        'peso_errores_posicionales': round(100 * pick('Errores posicionales') / err_pts, 1),
        'peso_aciertos_definicion': round(100 * pick('Aciertos de definición') / win_pts, 1),
        'peso_aciertos_ventaja': round(100 * pick('Aciertos de ventaja') / win_pts, 1),
        'peso_aciertos_construccion': round(100 * pick('Aciertos de construcción') / win_pts, 1),
        'impacto_desglosado': impact,
    }
