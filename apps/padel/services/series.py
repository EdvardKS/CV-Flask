"""Series payload builders (per match / per set)."""
from ..constants import ERROR_FIELDS, SUCCESS_FIELDS
from .scoring import calculate_score_data


def build_series_by_match(rows):
    by_match = {}
    for row in rows:
        entry = by_match.setdefault(row['ID_Partido'],
                                    {'total_errores': 0, 'total_aciertos': 0,
                                     'balance_neto': 0, 'sets': 0})
        entry['total_errores'] += row['Total_ENF_Set']
        entry['total_aciertos'] += row['Total_Aciertos_Set']
        entry['balance_neto'] += row['Balance_Set']
        entry['sets'] += 1

    payload = []
    for match_id, values in sorted(by_match.items()):
        match_rows = [r for r in rows if r['ID_Partido'] == match_id]
        score = calculate_score_data(
            {f: sum(r[f] for r in match_rows) for f in ERROR_FIELDS},
            {f: sum(r[f] for r in match_rows) for f in SUCCESS_FIELDS},
        )
        payload.append({
            'id_partido': match_id, **values,
            'score': score['score'],
            'media_errores_por_set': round(values['total_errores'] / values['sets'], 2) if values['sets'] else 0,
            'media_aciertos_por_set': round(values['total_aciertos'] / values['sets'], 2) if values['sets'] else 0,
        })
    return payload


def build_series_by_set(rows):
    sorted_rows = sorted(rows, key=lambda r: (r['ID_Partido'], r['Numero_Set']))
    payload = []
    for order, row in enumerate(sorted_rows, start=1):
        score = calculate_score_data(
            {f: row[f] for f in ERROR_FIELDS},
            {f: row[f] for f in SUCCESS_FIELDS},
        )
        payload.append({
            'orden': order,
            'clave': f'P{row["ID_Partido"]}-S{row["Numero_Set"]}',
            'id_partido': row['ID_Partido'], 'numero_set': row['Numero_Set'],
            'errores': row['Total_ENF_Set'], 'aciertos': row['Total_Aciertos_Set'],
            'balance': row['Balance_Set'], 'score': score['score'],
        })
    return payload
