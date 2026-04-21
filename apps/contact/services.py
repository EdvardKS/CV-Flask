"""Outbound email sending."""
import logging

from django.conf import settings
from django.core.mail import EmailMessage

logger = logging.getLogger(__name__)


def send_contact_email(form):
    recipient = getattr(settings, 'CONTACT_RECIPIENT', None) or getattr(settings, 'EMAIL_HOST_USER', None)
    if not recipient:
        raise RuntimeError('No recipient configured for contact form.')
    msg = EmailMessage(
        subject=form.subject(),
        body=form.body(),
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', recipient),
        to=[recipient],
        reply_to=[form.cleaned_data['email']],
    )
    msg.send(fail_silently=False)
    logger.info('Contact email queued for %s', recipient)
