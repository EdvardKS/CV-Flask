"""Live counter blocks shown on the /errores page."""
COUNTER_BLOCKS = [
    {
        'id': 'errores-defensa', 'title': 'Errores no forzados', 'subtitle': 'Fondo de pista',
        'fields': [
            {'key': 'Doble_Falta', 'short': 'DF', 'label': 'Doble falta'},
            {'key': 'Resto_Derecha_Fallado', 'short': 'RD', 'label': 'Resto derecha'},
            {'key': 'Resto_Reves_Fallado', 'short': 'RR', 'label': 'Resto revés'},
            {'key': 'Globo_Malo', 'short': 'GL', 'label': 'Globo malo'},
            {'key': 'Error_Fondo_Derecha', 'short': 'FD', 'label': 'Fondo derecha'},
            {'key': 'Error_Fondo_Reves', 'short': 'FR', 'label': 'Fondo revés'},
            {'key': 'Bajada_Derecha_Error', 'short': 'BD', 'label': 'Bajada derecha'},
            {'key': 'Bajada_Reves_Error', 'short': 'BR', 'label': 'Bajada revés'},
            {'key': 'Posicionamiento_Fondo_Error', 'short': 'PF', 'label': 'Pos. fondo'},
        ],
    },
    {
        'id': 'errores-ataque', 'title': 'Errores no forzados', 'subtitle': 'Zona de red',
        'fields': [
            {'key': 'Error_Volea_Derecha', 'short': 'VD', 'label': 'Volea derecha'},
            {'key': 'Error_Volea_Reves', 'short': 'VR', 'label': 'Volea revés'},
            {'key': 'Posicionamiento_Volea_Error', 'short': 'PV', 'label': 'Pos. volea'},
            {'key': 'Tirar_Ficha_Error', 'short': 'TF', 'label': 'Tirar ficha'},
            {'key': 'Bandeja_Error', 'short': 'BV', 'label': 'Bandeja/Víbora'},
            {'key': 'Smash_Error', 'short': 'SM', 'label': 'Remate fallido'},
        ],
    },
    {
        'id': 'aciertos-defensa', 'title': 'Aciertos', 'subtitle': 'Fondo de pista',
        'fields': [
            {'key': 'Winner_Derecha', 'short': 'WD', 'label': 'Winner derecha'},
            {'key': 'Winner_Reves', 'short': 'WR', 'label': 'Winner revés'},
            {'key': 'Resto_Ganador_Derecha', 'short': 'RGD', 'label': 'Resto ganador derecha'},
            {'key': 'Resto_Ganador_Reves', 'short': 'RGR', 'label': 'Resto ganador revés'},
            {'key': 'Globo_De_Oro', 'short': 'GO', 'label': 'Globo de oro'},
            {'key': 'Chiquita_Ganadora', 'short': 'CH', 'label': 'Chiquita ganadora'},
            {'key': 'Bajada_De_Pared', 'short': 'BP', 'label': 'Bajada de pared'},
        ],
    },
    {
        'id': 'aciertos-ataque', 'title': 'Aciertos', 'subtitle': 'Zona de red',
        'fields': [
            {'key': 'Remate_Finalizador', 'short': 'RF', 'label': 'Remate finalizador'},
            {'key': 'Volea_Derecha_Ganadora', 'short': 'VGD', 'label': 'Volea derecha ganadora'},
            {'key': 'Volea_Reves_Ganadora', 'short': 'VGR', 'label': 'Volea revés ganadora'},
            {'key': 'Bandeja_Vibora_Definitiva', 'short': 'BVD', 'label': 'Bandeja/Víbora definitiva'},
            {'key': 'Volea_Bloqueo_Contraataque', 'short': 'VB', 'label': 'Volea de bloqueo'},
            {'key': 'Dormilona', 'short': 'DR', 'label': 'Dormilona'},
        ],
    },
]
