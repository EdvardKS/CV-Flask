"""HTML pages for the padel scout dashboard."""
from django.shortcuts import render

from ..constants import (COUNTER_BLOCKS, ERROR_FIELDS, FIELD_LABELS,
                         FIELD_TOOLTIPS, SUCCESS_FIELDS)


def errores_page(request):
    return render(request, 'padel/errores.html', {
        'counter_blocks': COUNTER_BLOCKS,
        'error_tooltips': FIELD_TOOLTIPS,
        'error_labels': FIELD_LABELS,
        'error_fields': ERROR_FIELDS,
        'success_fields': SUCCESS_FIELDS,
    })


def resumen_page(request):
    return render(request, 'padel/resumen.html', {
        'error_labels': FIELD_LABELS,
    })
