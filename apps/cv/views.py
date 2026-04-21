"""CV pages and JSON data endpoint."""
from django.http import JsonResponse
from django.shortcuts import render

from .services import load_cv_data


def index(request):
    return render(request, 'cv/cv.html')


def summary(request):
    return render(request, 'cv/summary.html')


def experience(request):
    return render(request, 'cv/experience.html')


def education(request):
    return render(request, 'cv/education.html')


def skills(request):
    return render(request, 'cv/skills.html')


def cv_data(request):
    return JsonResponse(load_cv_data())
