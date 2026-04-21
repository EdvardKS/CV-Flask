"""HTML pages for the padel scout dashboard."""
from django.shortcuts import render

from apps.cv.services import build_cv_context

from ..constants import (COUNTER_BLOCKS, ERROR_FIELDS, FIELD_LABELS,
                         FIELD_TOOLTIPS, SUCCESS_FIELDS)


def _base_context():
    return {
        'counter_blocks': COUNTER_BLOCKS,
        'error_tooltips': FIELD_TOOLTIPS,
        'error_labels': FIELD_LABELS,
        'error_fields': ERROR_FIELDS,
        'success_fields': SUCCESS_FIELDS,
    }


def index(request):
    ctx = build_cv_context()
    ctx.update(_base_context())
    return render(request, 'padel/errores.html', ctx)


def errores_page(request):
    ctx = build_cv_context()
    ctx.update(_base_context())
    return render(request, 'padel/errores.html', ctx)


def resumen_page(request):
    ctx = build_cv_context()
    ctx.update({'error_labels': FIELD_LABELS})
    return render(request, 'padel/resumen.html', ctx)
