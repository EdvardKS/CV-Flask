from flask import Flask, jsonify, render_template, request
import csv
import json
import logging
import os
import random
import re
import smtplib
import unicodedata
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv

####################################################################################################

# Configura logging
logging.basicConfig(level=logging.DEBUG)

load_dotenv()
app = Flask(__name__)

####################################################################################################

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, 'output')
CV_DATA_PATH = os.path.join(BASE_DIR, 'static', 'data', 'cv_data.json')

CSV_HEADERS = [
    'ID_Partido',
    'Numero_Set',
    'Resto_Fallado',
    'Globo_Malo',
    'Error_Fondo',
    'Volea_Red',
    'Bandeja_Error',
    'Smash_Error',
    'Doble_Falta',
    'Total_ENF_Set',
]

ERROR_FIELDS = [
    'Resto_Fallado',
    'Globo_Malo',
    'Error_Fondo',
    'Volea_Red',
    'Bandeja_Error',
    'Smash_Error',
    'Doble_Falta',
]

ERROR_LABELS = {
    'Resto_Fallado': 'Resto fallado',
    'Globo_Malo': 'Globo malo',
    'Error_Fondo': 'Error de fondo',
    'Volea_Red': 'Volea a la red',
    'Bandeja_Error': 'Bandeja/Vibora',
    'Smash_Error': 'Remate fallido',
    'Doble_Falta': 'Doble falta',
}

ERROR_TOOLTIPS = {
    'Doble_Falta': 'Se suma cuando se pierden los dos servicios. Indica falta de concentracion o tecnica de saque.',
    'Resto_Fallado': 'Error al devolver el saque rival. Es un error grave porque impide iniciar el punto.',
    'Globo_Malo': 'Globo que se queda corto o que va directo al cristal de fondo.',
    'Error_Fondo': 'Fallo en derecha o reves desde el fondo, incluida salida de pared, que muere en la red.',
    'Volea_Red': 'Error no forzado de volea de derecha o reves en zona de red.',
    'Bandeja_Error': 'Error en bandeja o vibora que va a la red o al cristal sin ser una bola comprometida.',
    'Smash_Error': 'Smash que no se trae a campo propio, no sale x4/x3 o acaba en la red o los cristales.',
}

BLOCK_FIELDS = {
    'Defensa / Fondo': ['Doble_Falta', 'Resto_Fallado', 'Globo_Malo', 'Error_Fondo'],
    'Ataque / Red': ['Volea_Red', 'Bandeja_Error', 'Smash_Error'],
}

COUNTER_BLOCKS = [
    {
        'id': 'defensa',
        'title': 'Inicio y Defensa',
        'subtitle': 'Fondo de pista',
        'fields': [
            {'key': 'Doble_Falta', 'short': 'DF', 'label': 'Doble Falta'},
            {'key': 'Resto_Fallado', 'short': 'Resto', 'label': 'Resto Fallado'},
            {'key': 'Globo_Malo', 'short': 'Globo', 'label': 'Globo Malo'},
            {'key': 'Error_Fondo', 'short': 'Fondo', 'label': 'Error Fondo'},
        ],
    },
    {
        'id': 'ataque',
        'title': 'Ataque y Transicion',
        'subtitle': 'Zona de red',
        'fields': [
            {'key': 'Volea_Red', 'short': 'Volea', 'label': 'Volea Red'},
            {'key': 'Bandeja_Error', 'short': 'Bandeja', 'label': 'Bandeja/Vibora'},
            {'key': 'Smash_Error', 'short': 'Smash', 'label': 'Remate Fallido'},
        ],
    },
]

ERROR_GUIDANCE = {
    'Doble_Falta': {
        'weakness': 'Hay demasiadas dobles faltas para el volumen analizado. El inicio del punto esta penalizando el rendimiento.',
        'improvement': 'Reforzar rutina de saque, porcentaje de primer servicio seguro y control emocional en puntos de presion.',
    },
    'Resto_Fallado': {
        'weakness': 'El resto aparece como un punto debil porque corta demasiados puntos antes de construir el intercambio.',
        'improvement': 'Trabajar lectura del saque, altura de preparacion y objetivo conservador para asegurar la devolucion.',
    },
    'Globo_Malo': {
        'weakness': 'Los globos malos estan cediendo iniciativa al rival y dejando bolas faciles de remate.',
        'improvement': 'Entrenar profundidad, margen sobre la red y eleccion del globo solo cuando haya tiempo real de preparacion.',
    },
    'Error_Fondo': {
        'weakness': 'Desde el fondo se estan acumulando errores no forzados que desgastan la fase defensiva.',
        'improvement': 'Priorizar alturas seguras, direccion cruzada y mejor gestion de tiempos en salidas de pared.',
    },
    'Volea_Red': {
        'weakness': 'La volea esta siendo inestable en zona de definicion y quita continuidad al ataque.',
        'improvement': 'Ajustar pasos previos, distancia a la bola y objetivos mas amplios antes de acelerar.',
    },
    'Bandeja_Error': {
        'weakness': 'La bandeja o vibora no esta sosteniendo la ventaja ofensiva y regala transiciones al rival.',
        'improvement': 'Trabajar contacto alto, direccion al medio o reja segura y seleccion de potencia segun balance corporal.',
    },
    'Smash_Error': {
        'weakness': 'Los remates fallidos estan desperdiciando oportunidades claras de cierre del punto.',
        'improvement': 'Mejorar seleccion de remate, lectura del viento/pared y criterio para bajar potencia cuando no haya opcion de definicion.',
    },
}

####################################################################################################

# Configurar clave secreta para la sesion
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'mysecret')

####################################################################################################

# Configurar el servidor de correo electronico
SMTP_USERNAME = os.getenv('MAIL_USERNAME')
SMTP_PASSWORD = os.getenv('MAIL_PASSWORD')
SMTP_SERVER = os.getenv('SMTP_SERVER')
SMTP_PORT = os.getenv('SMTP_PORT')

print("\n", SMTP_USERNAME, SMTP_SERVER, SMTP_PORT, "\n")

####################################################################################################


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
        raise ValueError('El nombre del jugador no es valido para generar el archivo CSV.')

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


def ensure_player_csv(player_name):
    visible_name, safe_name = normalize_player_name(player_name)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    filename = f'{safe_name}.csv'
    file_path = os.path.join(OUTPUT_DIR, filename)

    if not os.path.exists(file_path):
        with open(file_path, 'w', encoding='utf-8', newline='') as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=CSV_HEADERS)
            writer.writeheader()

    return visible_name, filename, file_path


def load_player_rows(file_path):
    if not os.path.exists(file_path):
        return []

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

            parsed_row['Total_ENF_Set'] = parse_non_negative_int(row.get('Total_ENF_Set'), 'Total_ENF_Set')
            rows.append(parsed_row)

    return rows


def get_next_match_id(file_path):
    rows = load_player_rows(file_path)
    if not rows:
        return 1
    return max(row['ID_Partido'] for row in rows) + 1


def calculate_set_total(row_data):
    return sum(row_data[field] for field in ERROR_FIELDS)


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

        row_data['Total_ENF_Set'] = calculate_set_total(row_data)
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
        match_entry = series.setdefault(row['ID_Partido'], {'total_errores': 0, 'sets': 0})
        match_entry['total_errores'] += row['Total_ENF_Set']
        match_entry['sets'] += 1

    return [
        {
            'id_partido': match_id,
            'total_errores': values['total_errores'],
            'sets': values['sets'],
            'media_por_set': round(values['total_errores'] / values['sets'], 2) if values['sets'] else 0,
        }
        for match_id, values in sorted(series.items())
    ]


def build_insights(totals_by_field, block_totals):
    ranked_fields = [
        field for field in sorted(ERROR_FIELDS, key=lambda current: totals_by_field[current], reverse=True)
        if totals_by_field[field] > 0
    ]

    weak_points = [
        {
            'label': ERROR_LABELS[field],
            'valor': totals_by_field[field],
            'detalle': ERROR_GUIDANCE[field]['weakness'],
        }
        for field in ranked_fields[:3]
    ]

    improvement_areas = [
        {
            'label': ERROR_LABELS[field],
            'detalle': ERROR_GUIDANCE[field]['improvement'],
        }
        for field in ranked_fields[:3]
    ]

    if not weak_points:
        block_comment = 'Todavia no hay suficientes datos para detectar un patron de error.'
    else:
        weaker_block = max(block_totals, key=block_totals.get)
        if all(total == 0 for total in block_totals.values()):
            block_comment = 'Los filtros activos no contienen errores registrados.'
        else:
            block_comment = f'El volumen de error se concentra mas en {weaker_block.lower()}.'

    return {
        'puntos_flojos': weak_points,
        'areas_mejora': improvement_areas,
        'comentario_bloque': block_comment,
    }


def build_summary_payload(player_name, all_rows, filtered_rows, available_sets, match_filter, set_filter):
    totals_by_field = {field: sum(row[field] for row in filtered_rows) for field in ERROR_FIELDS}
    block_totals = {
        block_name: sum(totals_by_field[field] for field in fields)
        for block_name, fields in BLOCK_FIELDS.items()
    }

    total_errors = sum(row['Total_ENF_Set'] for row in filtered_rows)
    unique_matches = sorted({row['ID_Partido'] for row in all_rows})

    if filtered_rows and total_errors > 0:
        top_error_field = max(ERROR_FIELDS, key=lambda field: totals_by_field[field])
        top_error = {
            'clave': top_error_field,
            'label': ERROR_LABELS[top_error_field],
            'valor': totals_by_field[top_error_field],
        }

        if all(total == 0 for total in block_totals.values()):
            weakest_block = {'label': 'Sin datos', 'valor': 0}
        elif len(set(block_totals.values())) == 1:
            weakest_block = {'label': 'Equilibrado', 'valor': next(iter(block_totals.values()))}
        else:
            weakest_label = max(block_totals, key=block_totals.get)
            weakest_block = {'label': weakest_label, 'valor': block_totals[weakest_label]}
    else:
        top_error = {'clave': None, 'label': 'Sin datos', 'valor': 0}
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
            'media_por_set': round(total_errors / len(filtered_rows), 2) if filtered_rows else 0,
            'error_mas_repetido': top_error,
            'bloque_mas_debil': weakest_block,
        },
        'errores_por_tipo': [
            {
                'clave': field,
                'label': ERROR_LABELS[field],
                'total': totals_by_field[field],
            }
            for field in ERROR_FIELDS
        ],
        'errores_por_bloque': [
            {'bloque': block_name, 'total': total}
            for block_name, total in block_totals.items()
        ],
        'series_por_partido': build_series_by_match(filtered_rows),
        'filas_filtradas': filtered_rows,
        'insights': build_insights(totals_by_field, block_totals),
    }


####################################################################################################
####################################################################################################
####################################################################################################

@app.route('/submit_contact', methods=['POST'])
def submit_contact():
    try:
        data = request.json
        if not data:
            return jsonify({'status': 'error', 'message': 'Invalid JSON'}), 400
        name = data.get('name')
        email = data.get('email')
        message = data.get('message')
        if not all([name, email, message]):
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
        logging.info(f"Attempting to send email from {email}")
        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = SMTP_USERNAME
        msg['Subject'] = f"New contact from {name}"
        body = f"Name: {name}\nEmail: {email}\nMessage: {message}"
        msg.attach(MIMEText(body, 'plain'))
        if SMTP_USERNAME and SMTP_PASSWORD:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.sendmail(SMTP_USERNAME, SMTP_USERNAME, msg.as_string())
            logging.info("Email sent successfully")
            return jsonify({'status': 'success', 'message': 'Your message has been sent successfully'}), 200
        else:
            logging.error("SMTP credentials not set")
            return jsonify({'status': 'error', 'message': 'SMTP credentials not set'}), 500
    except Exception as exc:
        logging.error(f"Error in submit_contact: {str(exc)}")
        return jsonify({'status': 'error', 'message': str(exc)}), 500


####################################################################################################
####################################################################################################
####################################################################################################

@app.route('/')
def index():
    return render_template('index.html')


####################################################################################################
####################################################################################################
####################################################################################################

@app.route('/errores')
def errores():
    return render_template(
        'errores.html',
        counter_blocks=COUNTER_BLOCKS,
        error_tooltips=ERROR_TOOLTIPS,
        error_labels=ERROR_LABELS,
    )


####################################################################################################
####################################################################################################
####################################################################################################

@app.route('/resumen')
def resumen():
    return render_template(
        'resumen.html',
        error_labels=ERROR_LABELS,
    )


####################################################################################################
####################################################################################################
####################################################################################################

@app.route('/ECSO')
def ecso():
    return render_template('ECSO.html')


####################################################################################################
####################################################################################################
####################################################################################################

@app.route('/AdministracionSSOO')
def administracion_ssoo():
    return render_template('AdministracionSSOO.html')


####################################################################################################
####################################################################################################
####################################################################################################

@app.route('/SSOOAvanzados')
def ssoo_avanzados():
    return render_template('SSOOAvanzados.html')


####################################################################################################
####################################################################################################
####################################################################################################

@app.route('/get_cv_data')
def get_cv_data():
    with open(CV_DATA_PATH, 'r', encoding='utf-8') as file:
        cv_data = json.load(file)
    return jsonify(cv_data)


####################################################################################################
####################################################################################################
####################################################################################################

@app.route('/api/errores/iniciar', methods=['POST'])
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
    except ValueError as exc:
        return jsonify({'message': str(exc)}), 400
    except Exception as exc:
        logging.exception('Error al iniciar la sesion de errores')
        return jsonify({'message': f'No se pudo iniciar la sesion: {exc}'}), 500


####################################################################################################
####################################################################################################
####################################################################################################

@app.route('/api/errores/finalizar', methods=['POST'])
def finalizar_errores():
    try:
        data = request.get_json(silent=True) or {}
        player_name = data.get('jugador', '')
        match_id = parse_positive_int(data.get('id_partido'), 'id_partido')
        sets_payload = data.get('sets', [])

        _, _, file_path = ensure_player_csv(player_name)
        rows_to_write = validate_sets_payload(match_id, sets_payload)
        append_rows_to_csv(file_path, rows_to_write)
        next_match_id = get_next_match_id(file_path)

        return jsonify({
            'ok': True,
            'filas_guardadas': len(rows_to_write),
            'siguiente_id_partido': next_match_id,
        })
    except ValueError as exc:
        return jsonify({'message': str(exc)}), 400
    except Exception as exc:
        logging.exception('Error al finalizar el partido')
        return jsonify({'message': f'No se pudo guardar el partido: {exc}'}), 500


####################################################################################################
####################################################################################################
####################################################################################################

@app.route('/api/resumen')
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
    except ValueError as exc:
        return jsonify({'message': str(exc)}), 400
    except Exception as exc:
        logging.exception('Error al generar el resumen del jugador')
        return jsonify({'message': f'No se pudo generar el resumen: {exc}'}), 500


####################################################################################################
####################################################################################################
####################################################################################################

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
