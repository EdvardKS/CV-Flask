"""CSV read/write/migration for player files."""
import csv
import os

from django.conf import settings

from ..constants import (CSV_HEADERS, ERROR_FIELDS, SUCCESS_FIELDS,
                         LEGACY_V1_CSV_HEADERS, LEGACY_V2_CSV_HEADERS)
from ..exceptions import SchemaMismatchError
from ..utils.parse import parse_non_negative_int, parse_positive_int
from ..utils.text import normalize_player_name
from .totals import (calculate_balance_total, calculate_error_total,
                     calculate_success_total)


def output_dir():
    path = settings.PADEL_OUTPUT_DIR
    os.makedirs(path, exist_ok=True)
    return str(path)


def get_player_csv_path(player_name):
    _, safe_name = normalize_player_name(player_name)
    filename = f'{safe_name}.csv'
    return filename, os.path.join(output_dir(), filename)


def assert_csv_schema(file_path):
    if not os.path.exists(file_path):
        return
    with open(file_path, 'r', encoding='utf-8', newline='') as fh:
        header = next(csv.reader(fh), None)
    if header == CSV_HEADERS:
        return
    if header in (LEGACY_V1_CSV_HEADERS, LEGACY_V2_CSV_HEADERS):
        migrate_player_csv(file_path)
        return
    raise SchemaMismatchError('El CSV usa un esquema antiguo no compatible.')


def _row_with_totals(parsed_row):
    parsed_row['Total_ENF_Set'] = calculate_error_total(parsed_row)
    parsed_row['Total_Aciertos_Set'] = calculate_success_total(parsed_row)
    parsed_row['Balance_Set'] = calculate_balance_total(
        parsed_row['Total_ENF_Set'], parsed_row['Total_Aciertos_Set'])
    return parsed_row


def _parse_row(row):
    parsed = {
        'ID_Partido': parse_positive_int(row.get('ID_Partido'), 'ID_Partido'),
        'Numero_Set': parse_positive_int(row.get('Numero_Set'), 'Numero_Set'),
    }
    for field in ERROR_FIELDS + SUCCESS_FIELDS:
        parsed[field] = parse_non_negative_int(row.get(field, 0), field)
    return _row_with_totals(parsed)


def migrate_player_csv(file_path):
    with open(file_path, 'r', encoding='utf-8', newline='') as fh:
        rows = [r for r in csv.DictReader(fh)
                if r and any((v or '').strip() for v in r.values())]
    rows = [_parse_row(r) for r in rows]
    with open(file_path, 'w', encoding='utf-8', newline='') as fh:
        writer = csv.DictWriter(fh, fieldnames=CSV_HEADERS)
        writer.writeheader()
        writer.writerows(rows)


def ensure_player_csv(player_name):
    visible_name, safe_name = normalize_player_name(player_name)
    file_path = os.path.join(output_dir(), f'{safe_name}.csv')
    if not os.path.exists(file_path):
        with open(file_path, 'w', encoding='utf-8', newline='') as fh:
            csv.DictWriter(fh, fieldnames=CSV_HEADERS).writeheader()
    else:
        assert_csv_schema(file_path)
    return visible_name, f'{safe_name}.csv', file_path


def load_player_rows(file_path):
    if not os.path.exists(file_path):
        return []
    assert_csv_schema(file_path)
    with open(file_path, 'r', encoding='utf-8', newline='') as fh:
        return [_parse_row(r) for r in csv.DictReader(fh)
                if r and any((v or '').strip() for v in r.values())]


def get_next_match_id(file_path):
    rows = load_player_rows(file_path)
    return max((r['ID_Partido'] for r in rows), default=0) + 1


def append_rows_to_csv(file_path, rows_to_write):
    with open(file_path, 'a', encoding='utf-8', newline='') as fh:
        csv.DictWriter(fh, fieldnames=CSV_HEADERS).writerows(rows_to_write)
