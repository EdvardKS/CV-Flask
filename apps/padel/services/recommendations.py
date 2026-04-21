"""Tactical recommendation and insights synthesis."""
from ..constants import (ERROR_FIELDS, ERROR_GUIDANCE, ERROR_LABELS,
                         FIELD_PHASE_HINTS, SUCCESS_FIELDS,
                         SUCCESS_GUIDANCE, SUCCESS_LABELS)


def build_tactical_recommendation(profile, phase_comparison, hand_comparison, priorities):
    if not phase_comparison:
        return 'No hay suficientes sets para una recomendación táctica consistente.'
    strongest = max(phase_comparison, key=lambda i: (i['balance'], i['score']))
    weakest = min(phase_comparison, key=lambda i: (i['score'], i['balance']))
    best_hand = max(hand_comparison, key=lambda i: i['balance'], default={'mano': 'Sin datos'})
    rec = (f'El patrón más rentable está en {strongest["fase"].lower()}. '
           f'Conviene proteger especialmente {weakest["fase"].lower()}.')
    if priorities:
        rec += f' La corrección inmediata: {priorities[0]["titulo"].lower()}.'
    if best_hand.get('balance', 0) > 0:
        rec += f' La mano de mayor balance: {best_hand["mano"].lower()}.'
    return rec


def _ranked(fields, totals):
    return [f for f in sorted(fields, key=lambda x: totals[x], reverse=True)
            if totals[f] > 0]


def build_insights(error_totals, success_totals, error_blocks,
                   success_blocks, profile, score_data, advanced, priorities):
    err_rank = _ranked(ERROR_FIELDS, error_totals)
    win_rank = _ranked(SUCCESS_FIELDS, success_totals)
    fuertes = [{'label': SUCCESS_LABELS[f], 'valor': success_totals[f],
                'detalle': SUCCESS_GUIDANCE[f]} for f in win_rank[:3]]
    flojos = [{'label': ERROR_LABELS[f], 'valor': error_totals[f],
               'detalle': ERROR_GUIDANCE[f]['weakness']} for f in err_rank[:3]]
    mejora = [{'label': ERROR_LABELS[f], 'valor': error_totals[f],
               'detalle': ERROR_GUIDANCE[f]['improvement']} for f in err_rank[:3]]
    rec = build_tactical_recommendation(profile, advanced['comparativa_fases'],
                                        advanced['comparativa_manos'], priorities)
    return {
        'puntos_fuertes': fuertes, 'puntos_flojos': flojos, 'areas_mejora': mejora,
        'comentario_global': _global_comment(err_rank, win_rank, profile, score_data,
                                             error_blocks, success_blocks),
        'recomendacion_tactica': rec,
        'prioridades_entrenamiento': [
            {'label': p['titulo'], 'valor': p['impacto'],
             'detalle': f'{p["detalle"]} Fase: {p["fase"]}. Mano: {p["mano"]}.'}
            for p in priorities],
    }


def _global_comment(err_rank, win_rank, profile, score_data, err_blocks, win_blocks):
    if not err_rank and not win_rank:
        return 'No hay suficientes acciones registradas para conclusiones.'
    best = max(win_blocks, key=win_blocks.get) if any(win_blocks.values()) else 'sin bloque ofensivo claro'
    risk = max(err_blocks, key=err_blocks.get) if any(err_blocks.values()) else 'sin foco dominante'
    return (f'Perfil {profile["arquetipo"].lower()} con nivel {score_data["nivel"].lower()}. '
            f'Genera más valor en {best.lower()} y mayor foco de corrección en {risk.lower()}.')
