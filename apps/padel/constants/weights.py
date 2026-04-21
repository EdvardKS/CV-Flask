"""Scoring weights per field."""
SUCCESS_WEIGHTS = {
    'Winner_Derecha': 3.0, 'Winner_Reves': 3.0,
    'Resto_Ganador_Derecha': 2.5, 'Resto_Ganador_Reves': 2.5,
    'Globo_De_Oro': 2.0, 'Chiquita_Ganadora': 2.0, 'Bajada_De_Pared': 2.5,
    'Remate_Finalizador': 3.0,
    'Volea_Derecha_Ganadora': 3.0, 'Volea_Reves_Ganadora': 3.0,
    'Bandeja_Vibora_Definitiva': 3.0, 'Volea_Bloqueo_Contraataque': 2.5,
    'Dormilona': 2.5,
}

ERROR_WEIGHTS = {
    'Doble_Falta': 2.5,
    'Resto_Derecha_Fallado': 2.5, 'Resto_Reves_Fallado': 2.5,
    'Globo_Malo': 2.0,
    'Error_Fondo_Derecha': 2.0, 'Error_Fondo_Reves': 2.0,
    'Bajada_Derecha_Error': 2.0, 'Bajada_Reves_Error': 2.0,
    'Posicionamiento_Fondo_Error': 1.5,
    'Error_Volea_Derecha': 2.0, 'Error_Volea_Reves': 2.0,
    'Posicionamiento_Volea_Error': 1.5, 'Tirar_Ficha_Error': 2.5,
    'Bandeja_Error': 2.0, 'Smash_Error': 2.0,
}
