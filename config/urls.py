"""Root URL conf."""
from django.urls import include, path

urlpatterns = [
    path('', include('apps.cv.urls')),
    path('projects/', include('apps.projects.urls')),
    path('contact/', include('apps.contact.urls')),
    path('courses/', include('apps.courses.urls')),
    path('padel/', include('apps.padel.urls')),
    path('', include('apps.core.urls')),
]
