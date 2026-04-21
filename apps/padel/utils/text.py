"""Player name normalization."""
import re
import unicodedata


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


def clamp(value, min_value, max_value):
    return max(min_value, min(max_value, value))
