"""Serve static course pages (vendored HTML documents)."""
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404

PAGES_DIR = Path(settings.BASE_DIR) / 'static' / 'pages'


def _serve(name):
    path = PAGES_DIR / f'{name}.html'
    if not path.exists():
        raise Http404(name)
    return FileResponse(path.open('rb'), content_type='text/html; charset=utf-8')


def ecso(request):
    return _serve('ecso')


def admin_ssoo(request):
    return _serve('admin_ssoo')


def ssoo_avanzados(request):
    return _serve('ssoo_avanzados')
