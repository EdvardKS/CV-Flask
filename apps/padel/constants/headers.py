"""CSV headers (current and legacy schemas)."""
LEGACY_V1_CSV_HEADERS = [
    'ID_Partido', 'Numero_Set', 'Doble_Falta',
    'Resto_Derecha_Fallado', 'Resto_Reves_Fallado', 'Globo_Malo',
    'Error_Fondo_Derecha', 'Error_Fondo_Reves',
    'Error_Volea_Derecha', 'Error_Volea_Reves',
    'Bandeja_Error', 'Smash_Error', 'Total_ENF_Set',
]

LEGACY_V2_CSV_HEADERS = [
    'ID_Partido', 'Numero_Set', 'Doble_Falta',
    'Resto_Derecha_Fallado', 'Resto_Reves_Fallado', 'Globo_Malo',
    'Error_Fondo_Derecha', 'Error_Fondo_Reves',
    'Bajada_Derecha_Error', 'Bajada_Reves_Error', 'Posicionamiento_Fondo_Error',
    'Error_Volea_Derecha', 'Error_Volea_Reves',
    'Posicionamiento_Volea_Error', 'Tirar_Ficha_Error',
    'Bandeja_Error', 'Smash_Error', 'Total_ENF_Set',
]

CSV_HEADERS = [
    'ID_Partido', 'Numero_Set', 'Doble_Falta',
    'Resto_Derecha_Fallado', 'Resto_Reves_Fallado', 'Globo_Malo',
    'Error_Fondo_Derecha', 'Error_Fondo_Reves',
    'Bajada_Derecha_Error', 'Bajada_Reves_Error', 'Posicionamiento_Fondo_Error',
    'Error_Volea_Derecha', 'Error_Volea_Reves',
    'Posicionamiento_Volea_Error', 'Tirar_Ficha_Error',
    'Bandeja_Error', 'Smash_Error',
    'Winner_Derecha', 'Winner_Reves',
    'Resto_Ganador_Derecha', 'Resto_Ganador_Reves',
    'Globo_De_Oro', 'Chiquita_Ganadora', 'Bajada_De_Pared',
    'Remate_Finalizador',
    'Volea_Derecha_Ganadora', 'Volea_Reves_Ganadora',
    'Bandeja_Vibora_Definitiva', 'Volea_Bloqueo_Contraataque', 'Dormilona',
    'Total_ENF_Set', 'Total_Aciertos_Set', 'Balance_Set',
]
