import csv
import logging
import os
import re
import unicodedata

from flask import Blueprint, jsonify, render_template, request, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, 'output')

LEGACY_V1_CSV_HEADERS = [
    'ID_Partido',
    'Numero_Set',
    'Doble_Falta',
    'Resto_Derecha_Fallado',
    'Resto_Reves_Fallado',
    'Globo_Malo',
    'Error_Fondo_Derecha',
    'Error_Fondo_Reves',
    'Error_Volea_Derecha',
    'Error_Volea_Reves',
    'Bandeja_Error',
    'Smash_Error',
    'Total_ENF_Set',
]

LEGACY_V2_CSV_HEADERS = [
    'ID_Partido',
    'Numero_Set',
    'Doble_Falta',
    'Resto_Derecha_Fallado',
    'Resto_Reves_Fallado',
    'Globo_Malo',
    'Error_Fondo_Derecha',
    'Error_Fondo_Reves',
    'Bajada_Derecha_Error',
    'Bajada_Reves_Error',
    'Posicionamiento_Fondo_Error',
    'Error_Volea_Derecha',
    'Error_Volea_Reves',
    'Posicionamiento_Volea_Error',
    'Tirar_Ficha_Error',
    'Bandeja_Error',
    'Smash_Error',
    'Total_ENF_Set',
]

CSV_HEADERS = [
    'ID_Partido',
    'Numero_Set',
    'Doble_Falta',
    'Resto_Derecha_Fallado',
    'Resto_Reves_Fallado',
    'Globo_Malo',
    'Error_Fondo_Derecha',
    'Error_Fondo_Reves',
    'Bajada_Derecha_Error',
    'Bajada_Reves_Error',
    'Posicionamiento_Fondo_Error',
    'Error_Volea_Derecha',
    'Error_Volea_Reves',
    'Posicionamiento_Volea_Error',
    'Tirar_Ficha_Error',
    'Bandeja_Error',
    'Smash_Error',
    'Winner_Derecha',
    'Winner_Reves',
    'Resto_Ganador_Derecha',
    'Resto_Ganador_Reves',
    'Globo_De_Oro',
    'Chiquita_Ganadora',
    'Bajada_De_Pared',
    'Remate_Finalizador',
    'Volea_Derecha_Ganadora',
    'Volea_Reves_Ganadora',
    'Bandeja_Vibora_Definitiva',
    'Volea_Bloqueo_Contraataque',
    'Dormilona',
    'Total_ENF_Set',
    'Total_Aciertos_Set',
    'Balance_Set',
]

ERROR_FIELDS = [
    'Doble_Falta',
    'Resto_Derecha_Fallado',
    'Resto_Reves_Fallado',
    'Globo_Malo',
    'Error_Fondo_Derecha',
    'Error_Fondo_Reves',
    'Bajada_Derecha_Error',
    'Bajada_Reves_Error',
    'Posicionamiento_Fondo_Error',
    'Error_Volea_Derecha',
    'Error_Volea_Reves',
    'Posicionamiento_Volea_Error',
    'Tirar_Ficha_Error',
    'Bandeja_Error',
    'Smash_Error',
]

SUCCESS_FIELDS = [
    'Winner_Derecha',
    'Winner_Reves',
    'Resto_Ganador_Derecha',
    'Resto_Ganador_Reves',
    'Globo_De_Oro',
    'Chiquita_Ganadora',
    'Bajada_De_Pared',
    'Remate_Finalizador',
    'Volea_Derecha_Ganadora',
    'Volea_Reves_Ganadora',
    'Bandeja_Vibora_Definitiva',
    'Volea_Bloqueo_Contraataque',
    'Dormilona',
]

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

ERROR_TOOLTIPS = {
    'Doble_Falta': 'Se suma cuando se pierden los dos servicios. Indica falta de concentración o técnica de saque.',
    'Resto_Derecha_Fallado': 'Error al devolver el saque con la derecha. Corta el punto antes de construir el intercambio.',
    'Resto_Reves_Fallado': 'Error al devolver el saque con el revés. Penaliza el inicio del punto y la lectura del servicio rival.',
    'Globo_Malo': 'Globo que se queda corto o que va directo al cristal de fondo.',
    'Error_Fondo_Derecha': 'Fallo no forzado de derecha desde el fondo, incluida salida de pared, que no supera la red o cede el punto.',
    'Error_Fondo_Reves': 'Fallo no forzado de revés desde el fondo, incluida salida de pared, que no supera la red o cede el punto.',
    'Bajada_Derecha_Error': 'Error en una bajada de pared o bajada de bola con la derecha que termina en fallo no forzado.',
    'Bajada_Reves_Error': 'Error en una bajada de pared o bajada de bola con el revés que termina en fallo no forzado.',
    'Posicionamiento_Fondo_Error': 'Mala colocación en el fondo que provoca distancia incorrecta a la bola, mala lectura o pérdida del punto.',
    'Error_Volea_Derecha': 'Error no forzado de volea de derecha en transición o en zona de definición.',
    'Error_Volea_Reves': 'Error no forzado de volea de revés en transición o en zona de definición.',
    'Posicionamiento_Volea_Error': 'Mala colocación o ajuste en zona de volea que genera el error no forzado.',
    'Tirar_Ficha_Error': 'Acción táctica aleatoria o precipitada al tirar ficha que rompe la estructura del punto y acaba en fallo.',
    'Bandeja_Error': 'Error en bandeja o víbora que va a la red o al cristal sin ser una bola comprometida.',
    'Smash_Error': 'Smash que no se trae a campo propio, no sale x4/x3 o acaba en la red o los cristales.',
}

SUCCESS_TOOLTIPS = {
    'Winner_Derecha': 'Golpe de fondo potente o angulado con la mano dominante que el rival no puede tocar.',
    'Winner_Reves': 'Punto directo de revés, plano o cortado, que supera al rival por velocidad o colocación.',
    'Resto_Ganador_Derecha': 'Devolución de saque con la derecha que termina en punto o deja una bola muerta.',
    'Resto_Ganador_Reves': 'Resto agresivo de revés que descoloca totalmente a la pareja que saca.',
    'Globo_De_Oro': 'Globo preciso que sobrepasa a los rivales y bota profundo para tomar la red con ventaja total.',
    'Chiquita_Ganadora': 'Bola suave a los pies del rival que fuerza el error o habilita el contraataque definitivo.',
    'Bajada_De_Pared': 'Ataque agresivo tras rebote en pared de fondo que termina en punto directo.',
    'Remate_Finalizador': 'Remate por arriba que saca la bola de la pista o la trae al campo propio para cerrar.',
    'Volea_Derecha_Ganadora': 'Volea de derecha firme, profunda o con ángulo que no vuelve.',
    'Volea_Reves_Ganadora': 'Volea de revés cruzada o al cuerpo que define el punto en la red.',
    'Bandeja_Vibora_Definitiva': 'Bandeja o víbora ejecutada con agresividad o efecto suficiente para cerrar el punto.',
    'Volea_Bloqueo_Contraataque': 'Punto ganado al bloquear un golpe fuerte rival y usar su potencia para abrir espacio.',
    'Dormilona': 'Volea con retroceso y mucho efecto que se queda pegada a la red tras el remate rival.',
}

ERROR_BLOCK_FIELDS = {
    'Defensa / Fondo': [
        'Doble_Falta',
        'Resto_Derecha_Fallado',
        'Resto_Reves_Fallado',
        'Globo_Malo',
        'Error_Fondo_Derecha',
        'Error_Fondo_Reves',
        'Bajada_Derecha_Error',
        'Bajada_Reves_Error',
        'Posicionamiento_Fondo_Error',
    ],
    'Ataque / Red': [
        'Error_Volea_Derecha',
        'Error_Volea_Reves',
        'Posicionamiento_Volea_Error',
        'Tirar_Ficha_Error',
        'Bandeja_Error',
        'Smash_Error',
    ],
}

SUCCESS_BLOCK_FIELDS = {
    'Defensa / Fondo': [
        'Winner_Derecha',
        'Winner_Reves',
        'Resto_Ganador_Derecha',
        'Resto_Ganador_Reves',
        'Globo_De_Oro',
        'Chiquita_Ganadora',
        'Bajada_De_Pared',
    ],
    'Ataque / Red': [
        'Remate_Finalizador',
        'Volea_Derecha_Ganadora',
        'Volea_Reves_Ganadora',
        'Bandeja_Vibora_Definitiva',
        'Volea_Bloqueo_Contraataque',
        'Dormilona',
    ],
}

COUNTER_BLOCKS = [
    {
        'id': 'errores-defensa',
        'title': 'Errores no forzados',
        'subtitle': 'Fondo de pista',
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
        'id': 'errores-ataque',
        'title': 'Errores no forzados',
        'subtitle': 'Zona de red',
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
        'id': 'aciertos-defensa',
        'title': 'Aciertos',
        'subtitle': 'Fondo de pista',
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
        'id': 'aciertos-ataque',
        'title': 'Aciertos',
        'subtitle': 'Zona de red',
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

ERROR_GUIDANCE = {
    'Doble_Falta': {
        'weakness': 'Las dobles faltas están penalizando demasiado el arranque del punto.',
        'improvement': 'Trabajar una rutina estable de saque y un segundo servicio con más margen y menos tensión.',
    },
    'Resto_Derecha_Fallado': {
        'weakness': 'El resto de derecha está fallando más de lo deseable y limita la construcción desde el primer golpe.',
        'improvement': 'Ajustar la preparación temprana y priorizar un resto profundo y seguro con la derecha.',
    },
    'Resto_Reves_Fallado': {
        'weakness': 'El resto de revés aparece como foco de error y corta demasiados puntos al inicio.',
        'improvement': 'Entrenar lectura del saque al revés y simplificar objetivos para asegurar la devolución.',
    },
    'Globo_Malo': {
        'weakness': 'Los globos malos están devolviendo la iniciativa al rival y dejando remates cómodos.',
        'improvement': 'Subir margen sobre la red y trabajar más profundidad para que el globo vuelva a ser defensivo de verdad.',
    },
    'Error_Fondo_Derecha': {
        'weakness': 'La derecha desde el fondo está generando una pérdida constante de estabilidad defensiva.',
        'improvement': 'Priorizar trayectorias más seguras y mejor selección de altura y dirección con la derecha.',
    },
    'Error_Fondo_Reves': {
        'weakness': 'El revés de fondo está dejando errores no forzados que dañan la consistencia del set.',
        'improvement': 'Trabajar control de revés, tiempos de impacto y decisiones más conservadoras desde el fondo.',
    },
    'Bajada_Derecha_Error': {
        'weakness': 'La bajada de derecha está apareciendo como un foco claro de error y corta puntos ganables.',
        'improvement': 'Trabajar lectura de rebote, distancia al impacto y una terminación más simple en la bajada de derecha.',
    },
    'Bajada_Reves_Error': {
        'weakness': 'La bajada de revés está generando fallos no forzados que impiden capitalizar bolas jugables.',
        'improvement': 'Entrenar la bajada de revés con objetivos amplios, mejor apoyo de pies y control del plano de golpeo.',
    },
    'Posicionamiento_Fondo_Error': {
        'weakness': 'El posicionamiento en fondo está provocando errores por mala distancia y lectura tardía del punto.',
        'improvement': 'Ajustar recuperaciones al centro, profundidad de base y timing de colocación antes del impacto.',
    },
    'Error_Volea_Derecha': {
        'weakness': 'La volea de derecha no está consolidando la ventaja ofensiva en la red.',
        'improvement': 'Ajustar pasos previos, distancia al impacto y objetivos más amplios antes de acelerar la volea de derecha.',
    },
    'Error_Volea_Reves': {
        'weakness': 'La volea de revés está siendo un punto vulnerable en fase de definición o transición.',
        'improvement': 'Reforzar la estabilidad de muñeca y el control direccional en la volea de revés.',
    },
    'Posicionamiento_Volea_Error': {
        'weakness': 'El posicionamiento en volea no está sosteniendo bien la red y desemboca en errores evitables.',
        'improvement': 'Trabajar distancia a la red, orientación corporal y pasos de ajuste previos al golpe de volea.',
    },
    'Tirar_Ficha_Error': {
        'weakness': 'La toma de decisión al tirar ficha está siendo demasiado aleatoria y regala iniciativa o punto.',
        'improvement': 'Reducir decisiones de alto riesgo y entrenar patrones tácticos más claros antes de improvisar.',
    },
    'Bandeja_Error': {
        'weakness': 'La bandeja o víbora no está sosteniendo la ventaja de red y devuelve demasiadas opciones al rival.',
        'improvement': 'Trabajar contacto alto, dirección segura y una elección más fina de potencia en bandeja o víbora.',
    },
    'Smash_Error': {
        'weakness': 'Los remates fallidos están desperdiciando oportunidades claras de cierre.',
        'improvement': 'Mejorar la selección del smash y bajar potencia cuando no haya una opción clara de definición.',
    },
}

SUCCESS_GUIDANCE = {
    'Winner_Derecha': 'La derecha ganadora está siendo un recurso claro para cerrar puntos desde el fondo.',
    'Winner_Reves': 'El revés ganador aporta desequilibrio y resolución cuando se acelera con criterio.',
    'Resto_Ganador_Derecha': 'El resto ganador de derecha está generando ventaja inmediata desde la devolución.',
    'Resto_Ganador_Reves': 'El resto ganador de revés está castigando muy bien el servicio rival.',
    'Globo_De_Oro': 'El globo de oro está permitiendo recuperar la red con ventaja táctica total.',
    'Chiquita_Ganadora': 'La chiquita ganadora está marcando diferencias en gestión de alturas y pies del rival.',
    'Bajada_De_Pared': 'La bajada de pared está convirtiendo defensa en ataque directo con mucho valor.',
    'Remate_Finalizador': 'El remate finalizador está cerrando los puntos con autoridad en situaciones altas.',
    'Volea_Derecha_Ganadora': 'La volea de derecha ganadora está consolidando dominio claro en la red.',
    'Volea_Reves_Ganadora': 'La volea de revés ganadora está sumando definición y control ofensivo.',
    'Bandeja_Vibora_Definitiva': 'La bandeja o víbora definitiva está siendo un arma real para romper el punto.',
    'Volea_Bloqueo_Contraataque': 'La volea de bloqueo está aprovechando bien la potencia rival para contraatacar.',
    'Dormilona': 'La dormilona está aportando variedad y mucha calidad en la resolución cerca de red.',
}

FIELD_LABELS = {**ERROR_LABELS, **SUCCESS_LABELS}
FIELD_TOOLTIPS = {**ERROR_TOOLTIPS, **SUCCESS_TOOLTIPS}

SUCCESS_WEIGHTS = {
    'Winner_Derecha': 3.0,
    'Winner_Reves': 3.0,
    'Resto_Ganador_Derecha': 2.5,
    'Resto_Ganador_Reves': 2.5,
    'Globo_De_Oro': 2.0,
    'Chiquita_Ganadora': 2.0,
    'Bajada_De_Pared': 2.5,
    'Remate_Finalizador': 3.0,
    'Volea_Derecha_Ganadora': 3.0,
    'Volea_Reves_Ganadora': 3.0,
    'Bandeja_Vibora_Definitiva': 3.0,
    'Volea_Bloqueo_Contraataque': 2.5,
    'Dormilona': 2.5,
}

ERROR_WEIGHTS = {
    'Doble_Falta': 2.5,
    'Resto_Derecha_Fallado': 2.5,
    'Resto_Reves_Fallado': 2.5,
    'Globo_Malo': 2.0,
    'Error_Fondo_Derecha': 2.0,
    'Error_Fondo_Reves': 2.0,
    'Bajada_Derecha_Error': 2.0,
    'Bajada_Reves_Error': 2.0,
    'Posicionamiento_Fondo_Error': 1.5,
    'Error_Volea_Derecha': 2.0,
    'Error_Volea_Reves': 2.0,
    'Posicionamiento_Volea_Error': 1.5,
    'Tirar_Ficha_Error': 2.5,
    'Bandeja_Error': 2.0,
    'Smash_Error': 2.0,
}

PROFILE_AREAS = {
    'Inicio/Resto': {
        'positive': ['Resto_Ganador_Derecha', 'Resto_Ganador_Reves'],
        'negative': ['Doble_Falta', 'Resto_Derecha_Fallado', 'Resto_Reves_Fallado'],
    },
    'Defensa/Fondo': {
        'positive': ['Winner_Derecha', 'Winner_Reves', 'Globo_De_Oro', 'Chiquita_Ganadora', 'Bajada_De_Pared'],
        'negative': ['Globo_Malo', 'Error_Fondo_Derecha', 'Error_Fondo_Reves', 'Bajada_Derecha_Error', 'Bajada_Reves_Error', 'Posicionamiento_Fondo_Error'],
    },
    'Transición/Red': {
        'positive': ['Volea_Derecha_Ganadora', 'Volea_Reves_Ganadora', 'Bandeja_Vibora_Definitiva', 'Volea_Bloqueo_Contraataque', 'Dormilona'],
        'negative': ['Error_Volea_Derecha', 'Error_Volea_Reves', 'Posicionamiento_Volea_Error', 'Bandeja_Error'],
    },
    'Definición': {
        'positive': ['Winner_Derecha', 'Winner_Reves', 'Remate_Finalizador', 'Volea_Derecha_Ganadora', 'Volea_Reves_Ganadora', 'Bandeja_Vibora_Definitiva'],
        'negative': ['Smash_Error', 'Bandeja_Error', 'Error_Volea_Derecha', 'Error_Volea_Reves'],
    },
    'Táctica/Posicionamiento': {
        'positive': ['Globo_De_Oro', 'Chiquita_Ganadora', 'Volea_Bloqueo_Contraataque', 'Dormilona'],
        'negative': ['Posicionamiento_Fondo_Error', 'Posicionamiento_Volea_Error', 'Tirar_Ficha_Error'],
    },
}


class SchemaMismatchError(ValueError):
    pass


padel_scout_bp = Blueprint('padel_scout', __name__)


def sanitize_player_name(player_name):
    normalized = unicodedata.normalize('NFKD', player_name)
    ascii_name = normalized.encode('ascii', 'ignore').decode('ascii')
    return re.sub(r'[^a-zA-Z0-9]+', '_', ascii_name.lower()).strip('_')


def normalize_player_name(player_name):
    if not isinstance(player_name, str):
        raise ValueError('El nombre del jugador es obligatorio.')

    visible_name = re.sub(r'\s+', ' ', player_name).strip()
    if not visible_name:
        raise ValueError('El nombre del jugador es obligatorio.')

    safe_name = sanitize_player_name(visible_name)
    if not safe_name:
        raise ValueError('El nombre del jugador no es válido para generar el archivo CSV.')

    return visible_name, safe_name


def parse_non_negative_int(value, field_name):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValueError(f'El campo "{field_name}" debe ser un entero.')

    if parsed < 0:
        raise ValueError(f'El campo "{field_name}" no puede ser negativo.')

    return parsed


def parse_positive_int(value, field_name):
    parsed = parse_non_negative_int(value, field_name)
    if parsed < 1:
        raise ValueError(f'El campo "{field_name}" debe ser mayor que 0.')
    return parsed


def get_player_csv_path(player_name):
    _, safe_name = normalize_player_name(player_name)
    filename = f'{safe_name}.csv'
    return filename, os.path.join(OUTPUT_DIR, filename)


def assert_csv_schema(file_path):
    if not os.path.exists(file_path):
        return

    with open(file_path, 'r', encoding='utf-8', newline='') as csv_file:
        reader = csv.reader(csv_file)
        header = next(reader, None)

    if header == CSV_HEADERS:
        return

    if header in (LEGACY_V1_CSV_HEADERS, LEGACY_V2_CSV_HEADERS):
        migrate_player_csv(file_path)
        return

    raise SchemaMismatchError(
        'El CSV de este jugador usa un esquema antiguo y no es compatible con la versión actual.'
    )


def calculate_error_total(row_data):
    return sum(row_data[field] for field in ERROR_FIELDS)


def calculate_success_total(row_data):
    return sum(row_data[field] for field in SUCCESS_FIELDS)


def calculate_balance_total(total_errors, total_successes):
    return total_successes - total_errors


def migrate_player_csv(file_path):
    migrated_rows = []

    with open(file_path, 'r', encoding='utf-8', newline='') as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            if not row or not any((value or '').strip() for value in row.values()):
                continue

            migrated_row = {
                'ID_Partido': parse_positive_int(row.get('ID_Partido'), 'ID_Partido'),
                'Numero_Set': parse_positive_int(row.get('Numero_Set'), 'Numero_Set'),
            }

            for field in ERROR_FIELDS:
                migrated_row[field] = parse_non_negative_int(row.get(field, 0), field)
            for field in SUCCESS_FIELDS:
                migrated_row[field] = parse_non_negative_int(row.get(field, 0), field)

            migrated_row['Total_ENF_Set'] = calculate_error_total(migrated_row)
            migrated_row['Total_Aciertos_Set'] = calculate_success_total(migrated_row)
            migrated_row['Balance_Set'] = calculate_balance_total(
                migrated_row['Total_ENF_Set'],
                migrated_row['Total_Aciertos_Set'],
            )
            migrated_rows.append(migrated_row)

    with open(file_path, 'w', encoding='utf-8', newline='') as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=CSV_HEADERS)
        writer.writeheader()
        writer.writerows(migrated_rows)


def ensure_player_csv(player_name):
    visible_name, safe_name = normalize_player_name(player_name)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    filename = f'{safe_name}.csv'
    file_path = os.path.join(OUTPUT_DIR, filename)

    if not os.path.exists(file_path):
        with open(file_path, 'w', encoding='utf-8', newline='') as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=CSV_HEADERS)
            writer.writeheader()
    else:
        assert_csv_schema(file_path)

    return visible_name, filename, file_path


def load_player_rows(file_path):
    if not os.path.exists(file_path):
        return []

    assert_csv_schema(file_path)

    rows = []
    with open(file_path, 'r', encoding='utf-8', newline='') as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            if not row or not any((value or '').strip() for value in row.values()):
                continue

            parsed_row = {
                'ID_Partido': parse_positive_int(row.get('ID_Partido'), 'ID_Partido'),
                'Numero_Set': parse_positive_int(row.get('Numero_Set'), 'Numero_Set'),
            }

            for field in ERROR_FIELDS:
                parsed_row[field] = parse_non_negative_int(row.get(field), field)
            for field in SUCCESS_FIELDS:
                parsed_row[field] = parse_non_negative_int(row.get(field, 0), field)

            parse_non_negative_int(row.get('Total_ENF_Set'), 'Total_ENF_Set')
            parsed_row['Total_ENF_Set'] = calculate_error_total(parsed_row)
            parsed_row['Total_Aciertos_Set'] = calculate_success_total(parsed_row)
            parsed_row['Balance_Set'] = calculate_balance_total(
                parsed_row['Total_ENF_Set'],
                parsed_row['Total_Aciertos_Set'],
            )
            rows.append(parsed_row)

    return rows


def get_next_match_id(file_path):
    rows = load_player_rows(file_path)
    if not rows:
        return 1
    return max(row['ID_Partido'] for row in rows) + 1


def clamp(value, min_value, max_value):
    return max(min_value, min(max_value, value))


def calculate_score_data(error_totals, success_totals):
    puntos_acierto = round(sum(success_totals[field] * SUCCESS_WEIGHTS[field] for field in SUCCESS_FIELDS), 2)
    puntos_error = round(sum(error_totals[field] * ERROR_WEIGHTS[field] for field in ERROR_FIELDS), 2)
    score = clamp(round(100 * puntos_acierto / max(1, puntos_acierto + puntos_error), 1), 0, 100)
    impacto_neto = round(puntos_acierto - puntos_error, 2)

    if score >= 80:
        nivel = 'Alto rendimiento'
    elif score >= 65:
        nivel = 'Competitivo'
    elif score >= 50:
        nivel = 'Inestable'
    else:
        nivel = 'En desarrollo'

    return {
        'score': score,
        'puntos_acierto': puntos_acierto,
        'puntos_error': puntos_error,
        'impacto_neto': impacto_neto,
        'nivel': nivel,
    }


def calculate_area_score(positive_fields, negative_fields, success_totals, error_totals):
    puntos_acierto = round(sum(success_totals[field] * SUCCESS_WEIGHTS[field] for field in positive_fields), 2)
    puntos_error = round(sum(error_totals[field] * ERROR_WEIGHTS[field] for field in negative_fields), 2)
    return {
        'score': clamp(round(100 * puntos_acierto / max(1, puntos_acierto + puntos_error), 1), 0, 100),
        'aciertos': sum(success_totals[field] for field in positive_fields),
        'errores': sum(error_totals[field] for field in negative_fields),
        'impacto': round(puntos_acierto - puntos_error, 2),
    }


def build_player_profile(success_totals, error_totals, score_data):
    areas = []
    for area_name, definition in PROFILE_AREAS.items():
        area_score = calculate_area_score(definition['positive'], definition['negative'], success_totals, error_totals)
        areas.append({
            'area': area_name,
            **area_score,
        })

    total_activity = sum(success_totals.values()) + sum(error_totals.values())
    if total_activity == 0:
        return {
            'arquetipo': 'Sin datos',
            'descripcion': 'Todavía no hay suficientes acciones registradas para definir el perfil del jugador.',
            'area_dominante': 'Sin datos',
            'areas': areas,
        }

    archetype_sources = {
        'Definidor de red': sum(success_totals[field] for field in [
            'Remate_Finalizador',
            'Volea_Derecha_Ganadora',
            'Volea_Reves_Ganadora',
            'Bandeja_Vibora_Definitiva',
        ]),
        'Constructor de fondo': sum(success_totals[field] for field in [
            'Winner_Derecha',
            'Winner_Reves',
            'Globo_De_Oro',
            'Chiquita_Ganadora',
            'Bajada_De_Pared',
        ]),
        'Restador agresivo': sum(success_totals[field] for field in [
            'Resto_Ganador_Derecha',
            'Resto_Ganador_Reves',
        ]),
        'Perfil táctico/posicional': sum(success_totals[field] for field in [
            'Globo_De_Oro',
            'Chiquita_Ganadora',
            'Volea_Bloqueo_Contraataque',
            'Dormilona',
        ]),
    }

    dominant_source = max(archetype_sources, key=archetype_sources.get)
    dominant_source_value = archetype_sources[dominant_source]
    sorted_sources = sorted(archetype_sources.values(), reverse=True)

    if dominant_source_value == 0:
        arquetipo = 'Perfil equilibrado'
    elif len(sorted_sources) > 1 and dominant_source_value - sorted_sources[1] <= 1:
        arquetipo = 'Perfil equilibrado'
    else:
        arquetipo = dominant_source

    area_dominante = max(
        areas,
        key=lambda item: (item['score'], item['aciertos'] + item['errores'], item['impacto']),
    )['area']
    descriptions = {
        'Definidor de red': 'Jugador con más valor en la red y capacidad clara para cerrar puntos por arriba o con volea.',
        'Constructor de fondo': 'Perfil que construye ventaja desde el fondo con variedad, profundidad y cambios de ritmo.',
        'Restador agresivo': 'Jugador que castiga mucho el saque rival y genera iniciativa desde la devolución.',
        'Perfil táctico/posicional': 'Destaca en lectura táctica, elección de alturas y gestión de espacios clave del punto.',
        'Perfil equilibrado': 'Reparte el impacto entre varias fases del juego sin una única especialización dominante.',
    }

    return {
        'arquetipo': arquetipo,
        'descripcion': descriptions[arquetipo],
        'area_dominante': area_dominante,
        'areas': areas,
        'nivel': score_data['nivel'],
    }


def validate_sets_payload(match_id, sets_payload):
    if not isinstance(sets_payload, list) or not sets_payload:
        raise ValueError('No hay sets para guardar.')

    rows_to_write = []
    expected_set_number = 1

    for raw_set in sets_payload:
        if not isinstance(raw_set, dict):
            raise ValueError('Cada set debe enviarse como un objeto JSON.')

        set_number = parse_positive_int(raw_set.get('Numero_Set'), 'Numero_Set')
        if set_number != expected_set_number:
            raise ValueError('Los sets deben enviarse en orden correlativo comenzando en 1.')

        row_data = {
            'ID_Partido': match_id,
            'Numero_Set': set_number,
        }

        for field in ERROR_FIELDS:
            row_data[field] = parse_non_negative_int(raw_set.get(field, 0), field)
        for field in SUCCESS_FIELDS:
            row_data[field] = parse_non_negative_int(raw_set.get(field, 0), field)

        row_data['Total_ENF_Set'] = calculate_error_total(row_data)
        row_data['Total_Aciertos_Set'] = calculate_success_total(row_data)
        row_data['Balance_Set'] = calculate_balance_total(
            row_data['Total_ENF_Set'],
            row_data['Total_Aciertos_Set'],
        )
        rows_to_write.append(row_data)
        expected_set_number += 1

    return rows_to_write


def append_rows_to_csv(file_path, rows_to_write):
    with open(file_path, 'a', encoding='utf-8', newline='') as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=CSV_HEADERS)
        writer.writerows(rows_to_write)


def filter_rows(rows, match_filter, set_filter):
    filtered_by_match = rows
    if match_filter != 'all':
        match_id = parse_positive_int(match_filter, 'id_partido')
        filtered_by_match = [row for row in rows if row['ID_Partido'] == match_id]

    available_sets = sorted({row['Numero_Set'] for row in filtered_by_match})

    filtered_rows = filtered_by_match
    if set_filter != 'all':
        set_number = parse_positive_int(set_filter, 'numero_set')
        filtered_rows = [row for row in filtered_by_match if row['Numero_Set'] == set_number]

    return filtered_by_match, filtered_rows, available_sets


def build_series_by_match(rows):
    series = {}
    for row in rows:
        match_entry = series.setdefault(row['ID_Partido'], {
            'total_errores': 0,
            'total_aciertos': 0,
            'balance_neto': 0,
            'sets': 0,
        })
        match_entry['total_errores'] += row['Total_ENF_Set']
        match_entry['total_aciertos'] += row['Total_Aciertos_Set']
        match_entry['balance_neto'] += row['Balance_Set']
        match_entry['sets'] += 1

    payload = []
    for match_id, values in sorted(series.items()):
        score_data = calculate_score_data(
            {field: sum(row[field] for row in rows if row['ID_Partido'] == match_id) for field in ERROR_FIELDS},
            {field: sum(row[field] for row in rows if row['ID_Partido'] == match_id) for field in SUCCESS_FIELDS},
        )
        payload.append({
            'id_partido': match_id,
            'total_errores': values['total_errores'],
            'total_aciertos': values['total_aciertos'],
            'balance_neto': values['balance_neto'],
            'sets': values['sets'],
            'score': score_data['score'],
            'media_errores_por_set': round(values['total_errores'] / values['sets'], 2) if values['sets'] else 0,
            'media_aciertos_por_set': round(values['total_aciertos'] / values['sets'], 2) if values['sets'] else 0,
        })

    return payload


def build_insights(error_totals, success_totals, error_block_totals, success_block_totals, profile, score_data):
    ranked_errors = [
        field for field in sorted(ERROR_FIELDS, key=lambda current: error_totals[current], reverse=True)
        if error_totals[field] > 0
    ]
    ranked_successes = [
        field for field in sorted(SUCCESS_FIELDS, key=lambda current: success_totals[current], reverse=True)
        if success_totals[field] > 0
    ]

    puntos_fuertes = [
        {
            'label': SUCCESS_LABELS[field],
            'valor': success_totals[field],
            'detalle': SUCCESS_GUIDANCE[field],
        }
        for field in ranked_successes[:3]
    ]

    puntos_flojos = [
        {
            'label': ERROR_LABELS[field],
            'valor': error_totals[field],
            'detalle': ERROR_GUIDANCE[field]['weakness'],
        }
        for field in ranked_errors[:3]
    ]

    areas_mejora = [
        {
            'label': ERROR_LABELS[field],
            'valor': error_totals[field],
            'detalle': ERROR_GUIDANCE[field]['improvement'],
        }
        for field in ranked_errors[:3]
    ]

    if not ranked_errors and not ranked_successes:
        comentario_global = 'Todavía no hay suficientes acciones registradas para generar conclusiones del jugador.'
    else:
        best_block = (
            max(success_block_totals, key=success_block_totals.get)
            if any(success_block_totals.values())
            else 'sin un bloque de producción ofensiva claro'
        )
        risk_block = (
            max(error_block_totals, key=error_block_totals.get)
            if any(error_block_totals.values())
            else 'sin un foco dominante de error'
        )
        comentario_global = (
            f'Perfil {profile["arquetipo"].lower()} con nivel {score_data["nivel"].lower()}. '
            f'Genera más valor en {best_block.lower()} y el mayor foco de corrección aparece en {risk_block.lower()}.'
        )

    return {
        'puntos_fuertes': puntos_fuertes,
        'puntos_flojos': puntos_flojos,
        'areas_mejora': areas_mejora,
        'comentario_global': comentario_global,
    }


def build_summary_payload(player_name, all_rows, filtered_rows, available_sets, match_filter, set_filter):
    error_totals = {field: sum(row[field] for row in filtered_rows) for field in ERROR_FIELDS}
    success_totals = {field: sum(row[field] for row in filtered_rows) for field in SUCCESS_FIELDS}
    error_block_totals = {
        block_name: sum(error_totals[field] for field in fields)
        for block_name, fields in ERROR_BLOCK_FIELDS.items()
    }
    success_block_totals = {
        block_name: sum(success_totals[field] for field in fields)
        for block_name, fields in SUCCESS_BLOCK_FIELDS.items()
    }
    balance_block_totals = {
        block_name: success_block_totals[block_name] - error_block_totals[block_name]
        for block_name in error_block_totals
    }

    total_errors = sum(row['Total_ENF_Set'] for row in filtered_rows)
    total_successes = sum(row['Total_Aciertos_Set'] for row in filtered_rows)
    balance_neto = sum(row['Balance_Set'] for row in filtered_rows)
    unique_matches = sorted({row['ID_Partido'] for row in all_rows})
    score_data = calculate_score_data(error_totals, success_totals)
    profile = build_player_profile(success_totals, error_totals, score_data)

    if filtered_rows and total_errors > 0:
        top_error_field = max(ERROR_FIELDS, key=lambda field: error_totals[field])
        top_error = {
            'clave': top_error_field,
            'label': ERROR_LABELS[top_error_field],
            'valor': error_totals[top_error_field],
        }
    else:
        top_error = {'clave': None, 'label': 'Sin datos', 'valor': 0}

    if filtered_rows and total_successes > 0:
        top_success_field = max(SUCCESS_FIELDS, key=lambda field: success_totals[field])
        top_success = {
            'clave': top_success_field,
            'label': SUCCESS_LABELS[top_success_field],
            'valor': success_totals[top_success_field],
        }
    else:
        top_success = {'clave': None, 'label': 'Sin datos', 'valor': 0}

    if filtered_rows and any(error_block_totals.values()):
        weakest_label = max(error_block_totals, key=error_block_totals.get)
        weakest_block = {'label': weakest_label, 'valor': error_block_totals[weakest_label]}
    else:
        weakest_block = {'label': 'Sin datos', 'valor': 0}

    return {
        'jugador': player_name,
        'filtros_aplicados': {
            'id_partido': match_filter,
            'numero_set': set_filter,
        },
        'filtros_disponibles': {
            'partidos': unique_matches,
            'sets': available_sets,
        },
        'kpis': {
            'partidos_analizados': len({row['ID_Partido'] for row in filtered_rows}),
            'sets_analizados': len(filtered_rows),
            'total_errores_no_forzados': total_errors,
            'total_aciertos': total_successes,
            'balance_neto': balance_neto,
            'media_errores_por_set': round(total_errors / len(filtered_rows), 2) if filtered_rows else 0,
            'media_aciertos_por_set': round(total_successes / len(filtered_rows), 2) if filtered_rows else 0,
            'error_mas_repetido': top_error,
            'acierto_mas_repetido': top_success,
            'bloque_mas_debil': weakest_block,
        },
        'errores_por_tipo': [
            {
                'clave': field,
                'label': ERROR_LABELS[field],
                'total': error_totals[field],
            }
            for field in ERROR_FIELDS
        ],
        'aciertos_por_tipo': [
            {
                'clave': field,
                'label': SUCCESS_LABELS[field],
                'total': success_totals[field],
            }
            for field in SUCCESS_FIELDS
        ],
        'errores_por_bloque': [
            {'bloque': block_name, 'total': total}
            for block_name, total in error_block_totals.items()
        ],
        'aciertos_por_bloque': [
            {'bloque': block_name, 'total': total}
            for block_name, total in success_block_totals.items()
        ],
        'balance_por_bloque': [
            {
                'bloque': block_name,
                'errores': error_block_totals[block_name],
                'aciertos': success_block_totals[block_name],
                'balance': balance_block_totals[block_name],
            }
            for block_name in balance_block_totals
        ],
        'series_por_partido': build_series_by_match(filtered_rows),
        'filas_filtradas': filtered_rows,
        'score_jugador': score_data,
        'perfil_jugador': profile,
        'insights': build_insights(error_totals, success_totals, error_block_totals, success_block_totals, profile, score_data),
    }


@padel_scout_bp.route('/errores')
def errores():
    return render_template(
        'errores.html',
        counter_blocks=COUNTER_BLOCKS,
        error_tooltips=FIELD_TOOLTIPS,
        error_labels=FIELD_LABELS,
        error_fields=ERROR_FIELDS,
        success_fields=SUCCESS_FIELDS,
    )


@padel_scout_bp.route('/resumen')
def resumen():
    return render_template(
        'resumen.html',
        error_labels=FIELD_LABELS,
    )


@padel_scout_bp.route('/sw.js')
def service_worker():
    return send_from_directory(
        os.path.join(BASE_DIR, 'static', 'pwa'),
        'sw.js',
        mimetype='application/javascript',
        max_age=0,
    )


@padel_scout_bp.route('/api/errores/iniciar', methods=['POST'])
def iniciar_errores():
    try:
        data = request.get_json(silent=True) or {}
        player_name = data.get('jugador', '')
        visible_name, filename, file_path = ensure_player_csv(player_name)
        next_match_id = get_next_match_id(file_path)

        return jsonify({
            'jugador': visible_name,
            'archivo': filename,
            'id_partido': next_match_id,
        })
    except SchemaMismatchError as exc:
        return jsonify({'message': str(exc)}), 409
    except ValueError as exc:
        return jsonify({'message': str(exc)}), 400
    except Exception as exc:
        logging.exception('Error al iniciar la sesión de errores')
        return jsonify({'message': f'No se pudo iniciar la sesión: {exc}'}), 500


@padel_scout_bp.route('/api/errores/finalizar', methods=['POST'])
def finalizar_errores():
    try:
        data = request.get_json(silent=True) or {}
        player_name = data.get('jugador', '')
        match_id = parse_positive_int(data.get('id_partido'), 'id_partido')
        sets_payload = data.get('sets', [])

        _, _, file_path = ensure_player_csv(player_name)
        expected_match_id = get_next_match_id(file_path)
        if match_id != expected_match_id:
            raise ValueError(
                f'El ID_Partido esperado para este jugador es {expected_match_id}. Reinicia la sesión para continuar.'
            )

        rows_to_write = validate_sets_payload(match_id, sets_payload)
        append_rows_to_csv(file_path, rows_to_write)
        next_match_id = get_next_match_id(file_path)

        return jsonify({
            'ok': True,
            'filas_guardadas': len(rows_to_write),
            'siguiente_id_partido': next_match_id,
        })
    except SchemaMismatchError as exc:
        return jsonify({'message': str(exc)}), 409
    except ValueError as exc:
        return jsonify({'message': str(exc)}), 400
    except Exception as exc:
        logging.exception('Error al finalizar el partido')
        return jsonify({'message': f'No se pudo guardar el partido: {exc}'}), 500


@padel_scout_bp.route('/api/resumen')
def api_resumen():
    try:
        player_name = request.args.get('jugador', '')
        visible_name, _ = normalize_player_name(player_name)
        _, file_path = get_player_csv_path(visible_name)

        if not os.path.exists(file_path):
            return jsonify({'message': 'No existe historial para ese jugador.'}), 404

        all_rows = load_player_rows(file_path)
        match_filter = (request.args.get('id_partido') or 'all').strip() or 'all'
        set_filter = (request.args.get('numero_set') or 'all').strip() or 'all'

        filtered_by_match, filtered_rows, available_sets = filter_rows(all_rows, match_filter, set_filter)
        if match_filter == 'all':
            available_sets = sorted({row['Numero_Set'] for row in all_rows})
        else:
            available_sets = sorted({row['Numero_Set'] for row in filtered_by_match})

        payload = build_summary_payload(
            player_name=visible_name,
            all_rows=all_rows,
            filtered_rows=filtered_rows,
            available_sets=available_sets,
            match_filter=match_filter,
            set_filter=set_filter,
        )
        return jsonify(payload)
    except SchemaMismatchError as exc:
        return jsonify({'message': str(exc)}), 409
    except ValueError as exc:
        return jsonify({'message': str(exc)}), 400
    except Exception as exc:
        logging.exception('Error al generar el resumen del jugador')
        return jsonify({'message': f'No se pudo generar el resumen: {exc}'}), 500
