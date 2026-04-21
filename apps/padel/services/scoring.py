"""Score and area-score calculations."""
from ..constants import (ERROR_FIELDS, ERROR_WEIGHTS,
                         SUCCESS_FIELDS, SUCCESS_WEIGHTS)
from ..utils.text import clamp


def calculate_score_data(error_totals, success_totals):
    aciertos = round(sum(success_totals[f] * SUCCESS_WEIGHTS[f] for f in SUCCESS_FIELDS), 2)
    errores = round(sum(error_totals[f] * ERROR_WEIGHTS[f] for f in ERROR_FIELDS), 2)
    score = clamp(round(100 * aciertos / max(1, aciertos + errores), 1), 0, 100)
    return {
        'score': score,
        'puntos_acierto': aciertos,
        'puntos_error': errores,
        'impacto_neto': round(aciertos - errores, 2),
        'nivel': _level(score),
    }


def _level(score):
    if score >= 80:
        return 'Alto rendimiento'
    if score >= 65:
        return 'Competitivo'
    if score >= 50:
        return 'Inestable'
    return 'En desarrollo'


def calculate_area_score(positive_fields, negative_fields, success_totals, error_totals):
    aciertos = round(sum(success_totals[f] * SUCCESS_WEIGHTS[f] for f in positive_fields), 2)
    errores = round(sum(error_totals[f] * ERROR_WEIGHTS[f] for f in negative_fields), 2)
    return {
        'score': clamp(round(100 * aciertos / max(1, aciertos + errores), 1), 0, 100),
        'aciertos': sum(success_totals[f] for f in positive_fields),
        'errores': sum(error_totals[f] for f in negative_fields),
        'impacto': round(aciertos - errores, 2),
    }
