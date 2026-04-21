"""CV pages and JSON data endpoint."""
from django.http import JsonResponse
from django.shortcuts import render

from .services import build_cv_context, load_cv_data


def index(request):
    return render(request, 'cv/cv.html', build_cv_context())


def summary(request):
    return render(request, 'cv/summary.html', build_cv_context())


def experience(request):
    return render(request, 'cv/experience.html', build_cv_context())


def education(request):
    return render(request, 'cv/education.html', build_cv_context())


def skills(request):
    return render(request, 'cv/skills.html', build_cv_context())


def cv_data(request):
    return JsonResponse(load_cv_data())
