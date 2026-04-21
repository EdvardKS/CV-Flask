"""Human-readable labels for each error / success field."""
ERROR_LABELS = {
    'Doble_Falta': 'Doble falta',
    'Resto_Derecha_Fallado': 'Resto derecha',
    'Resto_Reves_Fallado': 'Resto revés',
    'Globo_Malo': 'Globo malo',
    'Error_Fondo_Derecha': 'Fondo derecha',
    'Error_Fondo_Reves': 'Fondo revés',
    'Bajada_Derecha_Error': 'Bajada derecha',
    'Bajada_Reves_Error': 'Bajada revés',
    'Posicionamiento_Fondo_Error': 'Posicionamiento fondo',
    'Error_Volea_Derecha': 'Volea derecha',
    'Error_Volea_Reves': 'Volea revés',
    'Posicionamiento_Volea_Error': 'Posicionamiento volea',
    'Tirar_Ficha_Error': 'Tirar ficha',
    'Bandeja_Error': 'Bandeja/Víbora',
    'Smash_Error': 'Remate fallido',
}

SUCCESS_LABELS = {
    'Winner_Derecha': 'Winner derecha',
    'Winner_Reves': 'Winner revés',
    'Resto_Ganador_Derecha': 'Resto ganador derecha',
    'Resto_Ganador_Reves': 'Resto ganador revés',
    'Globo_De_Oro': 'Globo de oro',
    'Chiquita_Ganadora': 'Chiquita ganadora',
    'Bajada_De_Pared': 'Bajada de pared',
    'Remate_Finalizador': 'Remate finalizador',
    'Volea_Derecha_Ganadora': 'Volea derecha ganadora',
    'Volea_Reves_Ganadora': 'Volea revés ganadora',
    'Bandeja_Vibora_Definitiva': 'Bandeja/Víbora definitiva',
    'Volea_Bloqueo_Contraataque': 'Volea de bloqueo',
    'Dormilona': 'Dormilona',
}

FIELD_LABELS = {**ERROR_LABELS, **SUCCESS_LABELS}
