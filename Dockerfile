ARG BASE_IMAGE=iaconedu-db:latest
FROM ${BASE_IMAGE}

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    DJANGO_SETTINGS_MODULE=config.settings.prod \
    PORT=8000 \
    VIRTUAL_ENV=/opt/venv \
    PATH=/opt/venv/bin:$PATH

WORKDIR /app

RUN apk add --no-cache python3 py3-pip ca-certificates \
    && python3 -m venv /opt/venv \
    && adduser -D -g "" appuser

COPY req.txt /app/req.txt
RUN pip install --upgrade pip \
    && pip install -r /app/req.txt

COPY . /app

RUN mkdir -p /app/staticfiles /app/output /app/data \
    && python manage.py collectstatic --noinput \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT} --workers ${GUNICORN_WORKERS:-3} --timeout ${GUNICORN_TIMEOUT:-60} --access-logfile - --error-logfile -"]
