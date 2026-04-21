"""Inject shared template context (nav, windows meta, indexable flag)."""


WINDOWS = [
    {'id': 'cv', 'title': 'My CV', 'icon': 'cv', 'url_name': 'cv:index', 'path': '/'},
    {'id': 'projects', 'title': 'Projects', 'icon': 'folder', 'url_name': 'projects:list', 'path': '/projects/'},
    {'id': 'skills', 'title': 'Skills — cmd.exe', 'icon': 'terminal', 'url_name': 'cv:skills', 'path': '/skills/'},
    {'id': 'experience', 'title': 'Work Experience', 'icon': 'briefcase', 'url_name': 'cv:experience', 'path': '/experience/'},
    {'id': 'education', 'title': 'Education', 'icon': 'book', 'url_name': 'cv:education', 'path': '/education/'},
    {'id': 'summary', 'title': 'About me', 'icon': 'user', 'url_name': 'cv:summary', 'path': '/summary/'},
    {'id': 'contact', 'title': 'Send a message', 'icon': 'mail', 'url_name': 'contact:form', 'path': '/contact/'},
    {'id': 'padel', 'title': 'Padel Scout', 'icon': 'trophy', 'url_name': 'padel:errores', 'path': '/padel/'},
]


def page_meta(request):
    path = request.path
    active = _active_window(path)
    return {
        'page': active['id'] if active else '',
        'indexable': path == '/',
        'nav_items': [(w['id'], f'nav-{w["id"]}', w['url_name']) for w in WINDOWS],
        'windows': WINDOWS,
        'active_window': active,
    }


def _active_window(path):
    for win in WINDOWS:
        if win['path'] == '/' and path == '/':
            return win
        if win['path'] != '/' and path.startswith(win['path']):
            return win
    return None
