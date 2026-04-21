"""Training priority ranking."""
from ..constants import (ERROR_FIELDS, ERROR_GUIDANCE, ERROR_LABELS,
                         ERROR_WEIGHTS, FIELD_HAND_HINTS, FIELD_PHASE_HINTS)


def build_training_priorities(error_totals):
    ranked = [f for f in sorted(
        ERROR_FIELDS,
        key=lambda f: (error_totals[f] * ERROR_WEIGHTS[f], error_totals[f]),
        reverse=True,
    ) if error_totals[f] > 0]
    return [{
        'titulo': ERROR_LABELS[f],
        'valor': error_totals[f],
        'impacto': round(error_totals[f] * ERROR_WEIGHTS[f], 1),
        'fase': FIELD_PHASE_HINTS.get(f, 'Sin definir'),
        'mano': FIELD_HAND_HINTS.get(f, 'Neutral'),
        'detalle': ERROR_GUIDANCE[f]['improvement'],
    } for f in ranked[:3]]
