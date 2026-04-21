import json
import logging

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .forms import ContactForm
from .services import send_contact_email

logger = logging.getLogger(__name__)


def contact_page(request):
    return render(request, 'contact/page.html')


@csrf_exempt
@require_http_methods(['POST'])
def submit(request):
    try:
        payload = json.loads(request.body or b'{}')
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    form = ContactForm(payload)
    if not form.is_valid():
        return JsonResponse({'status': 'error', 'message': 'Missing or invalid fields'}, status=400)
    try:
        send_contact_email(form)
    except Exception as exc:
        logger.exception('Contact email failed')
        return JsonResponse({'status': 'error', 'message': str(exc)}, status=500)
    return JsonResponse({'status': 'success', 'message': 'Your message has been sent.'})
