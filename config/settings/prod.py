"""Production settings."""
import os
from .base import *  # noqa: F401,F403

DEBUG = False
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('SMTP_SERVER')
EMAIL_PORT = int(os.getenv('SMTP_PORT', '587'))
EMAIL_HOST_USER = os.getenv('MAIL_USERNAME')
EMAIL_HOST_PASSWORD = os.getenv('MAIL_PASSWORD')
EMAIL_USE_TLS = True
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
CONTACT_RECIPIENT = EMAIL_HOST_USER

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedStaticFilesStorage'},
}
