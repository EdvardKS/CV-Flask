"""Player archetype / profile builder."""
from ..constants import PROFILE_AREAS
from .scoring import calculate_area_score

ARCHETYPE_DESCRIPTIONS = {
    'Definidor de red': 'Jugador con más valor en la red y capacidad clara para cerrar puntos.',
    'Constructor de fondo': 'Construye ventaja desde el fondo con variedad y profundidad.',
    'Restador agresivo': 'Castiga el saque rival y genera iniciativa desde la devolución.',
    'Perfil táctico/posicional': 'Destaca en lectura táctica y gestión de espacios clave.',
    'Perfil equilibrado': 'Reparte el impacto entre varias fases sin única especialización.',
}

ARCHETYPE_SOURCES = {
    'Definidor de red': ['Remate_Finalizador', 'Volea_Derecha_Ganadora',
                         'Volea_Reves_Ganadora', 'Bandeja_Vibora_Definitiva'],
    'Constructor de fondo': ['Winner_Derecha', 'Winner_Reves', 'Globo_De_Oro',
                             'Chiquita_Ganadora', 'Bajada_De_Pared'],
    'Restador agresivo': ['Resto_Ganador_Derecha', 'Resto_Ganador_Reves'],
    'Perfil táctico/posicional': ['Globo_De_Oro', 'Chiquita_Ganadora',
                                  'Volea_Bloqueo_Contraataque', 'Dormilona'],
}


def build_player_profile(success_totals, error_totals, score_data):
    areas = [{'area': name, **calculate_area_score(d['positive'], d['negative'],
                                                   success_totals, error_totals)}
             for name, d in PROFILE_AREAS.items()]
    if sum(success_totals.values()) + sum(error_totals.values()) == 0:
        return {'arquetipo': 'Sin datos',
                'descripcion': 'No hay suficientes acciones registradas.',
                'area_dominante': 'Sin datos', 'areas': areas}

    sources = {name: sum(success_totals[f] for f in fields)
               for name, fields in ARCHETYPE_SOURCES.items()}
    arquetipo = _pick_archetype(sources)
    area_dominante = max(areas,
                         key=lambda a: (a['score'], a['aciertos'] + a['errores'], a['impacto']))['area']
    return {'arquetipo': arquetipo, 'descripcion': ARCHETYPE_DESCRIPTIONS[arquetipo],
            'area_dominante': area_dominante, 'areas': areas, 'nivel': score_data['nivel']}


def _pick_archetype(sources):
    dominant = max(sources, key=sources.get)
    top = sources[dominant]
    others = sorted(sources.values(), reverse=True)
    if top == 0 or (len(others) > 1 and top - others[1] <= 1):
        return 'Perfil equilibrado'
    return dominant
