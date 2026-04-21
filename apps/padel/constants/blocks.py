"""Field-to-block grouping (defensa/ataque)."""
ERROR_BLOCK_FIELDS = {
    'Defensa / Fondo': [
        'Doble_Falta',
        'Resto_Derecha_Fallado', 'Resto_Reves_Fallado',
        'Globo_Malo',
        'Error_Fondo_Derecha', 'Error_Fondo_Reves',
        'Bajada_Derecha_Error', 'Bajada_Reves_Error',
        'Posicionamiento_Fondo_Error',
    ],
    'Ataque / Red': [
        'Error_Volea_Derecha', 'Error_Volea_Reves',
        'Posicionamiento_Volea_Error', 'Tirar_Ficha_Error',
        'Bandeja_Error', 'Smash_Error',
    ],
}

SUCCESS_BLOCK_FIELDS = {
    'Defensa / Fondo': [
        'Winner_Derecha', 'Winner_Reves',
        'Resto_Ganador_Derecha', 'Resto_Ganador_Reves',
        'Globo_De_Oro', 'Chiquita_Ganadora', 'Bajada_De_Pared',
    ],
    'Ataque / Red': [
        'Remate_Finalizador',
        'Volea_Derecha_Ganadora', 'Volea_Reves_Ganadora',
        'Bandeja_Vibora_Definitiva', 'Volea_Bloqueo_Contraataque', 'Dormilona',
    ],
}

from .counter_blocks import COUNTER_BLOCKS  # noqa: E402,F401
