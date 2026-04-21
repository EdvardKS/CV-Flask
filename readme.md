# Edvard K. — Personal Site

Django + Tailwind. Componentes pequeños (todo ≤100 líneas).

## Estructura

```
config/                      # settings (base/dev/prod), urls, wsgi/asgi
apps/
  core/                      # base template, componentes UI, robots, sitemap
  cv/                        # CV (datos JSON + páginas + componentes)
  projects/                  # listado de proyectos
  contact/                   # formulario + envío de email
  courses/                   # ECSO / SSOO (páginas educativas)
  padel/                     # padel scout (constantes, utils, services, views)
static/
  js/                        # módulos ESM (lib, data, ui, render, forms)
__old/                       # versión Flask anterior (referencia)
```

## Desarrollo

```bash
pip install -r req.txt
python manage.py runserver
```

## Producción

```bash
docker compose up -d --build
```

Variables de entorno (.env): `SECRET_KEY`, `ALLOWED_HOSTS`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `SMTP_SERVER`, `SMTP_PORT`.

## SEO

- Solo `/` se indexa. El resto de páginas envían `noindex,nofollow`.
- `/robots.txt` y `/sitemap.xml` autogenerados por `apps.core`.
