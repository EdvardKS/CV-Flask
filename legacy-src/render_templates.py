"""One-shot renderer: read padel_scout.py constants and bake out static HTMLs.

Replaces Flask `url_for('static', filename=...)` with Next.js public paths
(`/padel-legacy/...` for CSS/JS, `/` for favicon/manifest/pwa).
"""
import ast
import json
import os
import re
import sys
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, StrictUndefined

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / 'public' / 'padel-legacy'
OUT.mkdir(parents=True, exist_ok=True)


def extract_constants(src_path: Path) -> dict:
    """Safely eval only top-level UPPERCASE assignments from padel_scout.py."""
    src = src_path.read_text(encoding='utf-8')
    tree = ast.parse(src)
    ns: dict = {}
    for node in tree.body:
        if isinstance(node, ast.Assign) and len(node.targets) == 1:
            target = node.targets[0]
            if isinstance(target, ast.Name) and target.id.isupper():
                try:
                    ns[target.id] = ast.literal_eval(node.value)
                except Exception:
                    # Skip dict comprehensions or computed values
                    pass
    # Handle the two computed dicts used by templates:
    if 'ERROR_LABELS' in ns and 'SUCCESS_LABELS' in ns:
        ns['FIELD_LABELS'] = {**ns['ERROR_LABELS'], **ns['SUCCESS_LABELS']}
    if 'ERROR_TOOLTIPS' in ns and 'SUCCESS_TOOLTIPS' in ns:
        ns['FIELD_TOOLTIPS'] = {**ns['ERROR_TOOLTIPS'], **ns['SUCCESS_TOOLTIPS']}
    return ns


# Flask → Next.js path mapping for url_for('static', filename=...)
STATIC_MAP = {
    'favicon.ico': '/favicon.ico',
    'pwa/manifest-errores.webmanifest': '/manifest.webmanifest',
    'pwa/manifest-resumen.webmanifest': '/manifest.webmanifest',
    'pwa/icons/apple-touch-icon.png': '/pwa/icons/apple-touch-icon.png',
    'pwa/register-sw.js': '/pwa/register-sw.js',
    'css/padel-dashboard.css': '/padel-legacy/padel-dashboard.css',
    'js/errores.js': '/padel-legacy/errores.js',
    'js/resumen.js': '/padel-legacy/resumen.js',
    'js/player-session.js': '/padel-legacy/player-session.js',
}


def url_for(endpoint, filename=None):
    if endpoint == 'static':
        return STATIC_MAP.get(filename, f'/static/{filename}')
    raise RuntimeError(f'Unhandled url_for endpoint: {endpoint}')


AUTOFILL_SCRIPT = """
<script>
  // Auto-fill jugador-input and auto-submit when arriving via ?jugador=
  (function () {
    try {
      var q = new URLSearchParams(window.location.search).get('jugador');
      if (!q) return;
      var tryFill = function () {
        var inp = document.getElementById('jugador-input');
        var form = document.getElementById('player-form');
        if (!inp) return false;
        inp.value = q;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        if (form) {
          setTimeout(function () { form.requestSubmit ? form.requestSubmit() : form.submit(); }, 60);
        }
        return true;
      };
      if (!tryFill()) {
        var n = 0;
        var t = setInterval(function () { if (tryFill() || ++n > 40) clearInterval(t); }, 100);
      }
    } catch (e) { console.warn('autofill', e); }
  })();
</script>
"""


def render(template_name: str, ctx: dict, out_name: str) -> None:
    env = Environment(
        loader=FileSystemLoader(str(HERE)),
        autoescape=False,  # Same as Flask default for HTML strings we control
    )
    env.filters['tojson'] = lambda v: json.dumps(v, ensure_ascii=False)
    template = env.get_template(template_name)
    ctx = {**ctx, 'url_for': url_for}
    out = template.render(**ctx)
    # Inject autofill script right before </body>
    out = out.replace('</body>', AUTOFILL_SCRIPT + '</body>', 1)
    (OUT / out_name).write_text(out, encoding='utf-8')
    print(f'[ok] {out_name} ({len(out):,} bytes)')


def main():
    consts = extract_constants(HERE / 'padel_scout.py')
    common_ctx = {
        'counter_blocks': consts.get('COUNTER_BLOCKS', []),
        'error_labels': consts.get('ERROR_LABELS', {}),
        'success_labels': consts.get('SUCCESS_LABELS', {}),
        'error_tooltips': consts.get('FIELD_TOOLTIPS', consts.get('ERROR_TOOLTIPS', {})),
        'success_tooltips': consts.get('SUCCESS_TOOLTIPS', {}),
        'error_fields': consts.get('ERROR_FIELDS', []),
        'success_fields': consts.get('SUCCESS_FIELDS', []),
        'error_guidance': consts.get('ERROR_GUIDANCE', {}),
        'success_guidance': consts.get('SUCCESS_GUIDANCE', {}),
        'field_labels': consts.get('FIELD_LABELS', {}),
        'field_tooltips': consts.get('FIELD_TOOLTIPS', {}),
    }
    render('errores.html.j2', common_ctx, 'errores.html')
    render('resumen.html.j2', common_ctx, 'resumen.html')


if __name__ == '__main__':
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)
