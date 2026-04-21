from django.urls import path

from . import views

app_name = 'courses'

urlpatterns = [
    path('ecso/', views.ecso, name='ecso'),
    path('administracion-ssoo/', views.admin_ssoo, name='admin_ssoo'),
    path('ssoo-avanzados/', views.ssoo_avanzados, name='ssoo_avanzados'),
]
