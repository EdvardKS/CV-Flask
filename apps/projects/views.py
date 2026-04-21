from django.shortcuts import render

from apps.cv.services import build_cv_context


def project_list(request):
    return render(request, 'projects/list.html', build_cv_context())
