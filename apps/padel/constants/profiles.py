"""Profile areas, hand and phase mappings, impact buckets."""
PROFILE_AREAS = {
    'Inicio/Resto': {
        'positive': ['Resto_Ganador_Derecha', 'Resto_Ganador_Reves'],
        'negative': ['Doble_Falta', 'Resto_Derecha_Fallado', 'Resto_Reves_Fallado'],
    },
    'Defensa/Fondo': {
        'positive': ['Winner_Derecha', 'Winner_Reves', 'Globo_De_Oro', 'Chiquita_Ganadora', 'Bajada_De_Pared'],
        'negative': ['Globo_Malo', 'Error_Fondo_Derecha', 'Error_Fondo_Reves',
                     'Bajada_Derecha_Error', 'Bajada_Reves_Error', 'Posicionamiento_Fondo_Error'],
    },
    'Transición/Red': {
        'positive': ['Volea_Derecha_Ganadora', 'Volea_Reves_Ganadora',
                     'Bandeja_Vibora_Definitiva', 'Volea_Bloqueo_Contraataque', 'Dormilona'],
        'negative': ['Error_Volea_Derecha', 'Error_Volea_Reves',
                     'Posicionamiento_Volea_Error', 'Bandeja_Error'],
    },
    'Definición': {
        'positive': ['Winner_Derecha', 'Winner_Reves', 'Remate_Finalizador',
                     'Volea_Derecha_Ganadora', 'Volea_Reves_Ganadora', 'Bandeja_Vibora_Definitiva'],
        'negative': ['Smash_Error', 'Bandeja_Error', 'Error_Volea_Derecha', 'Error_Volea_Reves'],
    },
    'Táctica/Posicionamiento': {
        'positive': ['Globo_De_Oro', 'Chiquita_Ganadora', 'Volea_Bloqueo_Contraataque', 'Dormilona'],
        'negative': ['Posicionamiento_Fondo_Error', 'Posicionamiento_Volea_Error', 'Tirar_Ficha_Error'],
    },
}

HAND_BREAKDOWN = {
    'Derecha': {
        'positive': ['Winner_Derecha', 'Resto_Ganador_Derecha', 'Volea_Derecha_Ganadora'],
        'negative': ['Resto_Derecha_Fallado', 'Error_Fondo_Derecha',
                     'Bajada_Derecha_Error', 'Error_Volea_Derecha'],
    },
    'Revés': {
        'positive': ['Winner_Reves', 'Resto_Ganador_Reves', 'Volea_Reves_Ganadora'],
        'negative': ['Resto_Reves_Fallado', 'Error_Fondo_Reves',
                     'Bajada_Reves_Error', 'Error_Volea_Reves'],
    },
}

FIELD_PHASE_HINTS = {
    'Doble_Falta': 'Inicio/Resto', 'Resto_Derecha_Fallado': 'Inicio/Resto',
    'Resto_Reves_Fallado': 'Inicio/Resto', 'Globo_Malo': 'Defensa/Fondo',
    'Error_Fondo_Derecha': 'Defensa/Fondo', 'Error_Fondo_Reves': 'Defensa/Fondo',
    'Bajada_Derecha_Error': 'Defensa/Fondo', 'Bajada_Reves_Error': 'Defensa/Fondo',
    'Posicionamiento_Fondo_Error': 'Táctica/Posicionamiento',
    'Error_Volea_Derecha': 'Transición/Red', 'Error_Volea_Reves': 'Transición/Red',
    'Posicionamiento_Volea_Error': 'Táctica/Posicionamiento',
    'Tirar_Ficha_Error': 'Táctica/Posicionamiento',
    'Bandeja_Error': 'Transición/Red', 'Smash_Error': 'Definición',
    'Winner_Derecha': 'Definición', 'Winner_Reves': 'Definición',
    'Resto_Ganador_Derecha': 'Inicio/Resto', 'Resto_Ganador_Reves': 'Inicio/Resto',
    'Globo_De_Oro': 'Defensa/Fondo', 'Chiquita_Ganadora': 'Táctica/Posicionamiento',
    'Bajada_De_Pared': 'Defensa/Fondo', 'Remate_Finalizador': 'Definición',
    'Volea_Derecha_Ganadora': 'Transición/Red', 'Volea_Reves_Ganadora': 'Transición/Red',
    'Bandeja_Vibora_Definitiva': 'Transición/Red',
    'Volea_Bloqueo_Contraataque': 'Táctica/Posicionamiento',
    'Dormilona': 'Táctica/Posicionamiento',
}

FIELD_HAND_HINTS = {
    'Resto_Derecha_Fallado': 'Derecha', 'Error_Fondo_Derecha': 'Derecha',
    'Bajada_Derecha_Error': 'Derecha', 'Error_Volea_Derecha': 'Derecha',
    'Winner_Derecha': 'Derecha', 'Resto_Ganador_Derecha': 'Derecha',
    'Volea_Derecha_Ganadora': 'Derecha',
    'Resto_Reves_Fallado': 'Revés', 'Error_Fondo_Reves': 'Revés',
    'Bajada_Reves_Error': 'Revés', 'Error_Volea_Reves': 'Revés',
    'Winner_Reves': 'Revés', 'Resto_Ganador_Reves': 'Revés',
    'Volea_Reves_Ganadora': 'Revés',
}

IMPACT_BUCKETS = {
    'Aciertos de definición': ['Winner_Derecha', 'Winner_Reves', 'Remate_Finalizador',
                               'Volea_Derecha_Ganadora', 'Volea_Reves_Ganadora', 'Bandeja_Vibora_Definitiva'],
    'Aciertos de ventaja': ['Resto_Ganador_Derecha', 'Resto_Ganador_Reves',
                            'Bajada_De_Pared', 'Volea_Bloqueo_Contraataque', 'Dormilona'],
    'Aciertos de construcción': ['Globo_De_Oro', 'Chiquita_Ganadora'],
    'Errores alto coste': ['Doble_Falta', 'Resto_Derecha_Fallado',
                           'Resto_Reves_Fallado', 'Tirar_Ficha_Error'],
    'Errores técnicos': ['Globo_Malo', 'Error_Fondo_Derecha', 'Error_Fondo_Reves',
                         'Bajada_Derecha_Error', 'Bajada_Reves_Error',
                         'Error_Volea_Derecha', 'Error_Volea_Reves',
                         'Bandeja_Error', 'Smash_Error'],
    'Errores posicionales': ['Posicionamiento_Fondo_Error', 'Posicionamiento_Volea_Error'],
}
