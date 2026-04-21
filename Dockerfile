FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DJANGO_SETTINGS_MODULE=config.settings.prod \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# OS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential curl \
    && rm -rf /var/lib/apt/lists/*

# Python deps (cached layer)
COPY req.txt .
RUN pip install -r req.txt

# App code
COPY . .

# Fail fast if core files didn't copy (useful debug signal)
RUN test -f manage.py || (echo "ERROR: manage.py missing in build context" && ls -la && exit 1)

# Prep runtime dirs
RUN mkdir -p /app/staticfiles /app/output

EXPOSE 8000

# collectstatic at runtime so the build never fails on missing env vars
CMD ["sh", "-c", "python manage.py collectstatic --noinput && exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --access-logfile - --error-logfile -"]
