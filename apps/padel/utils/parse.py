"""Numeric parsers shared by IO and validation modules."""


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
