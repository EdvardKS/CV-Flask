from django.urls import path

from .views import api, pages

app_name = 'padel'

urlpatterns = [
    path('errores/', pages.errores_page, name='errores'),
    path('resumen/', pages.resumen_page, name='resumen'),
    path('api/errores/iniciar/', api.iniciar, name='api_iniciar'),
    path('api/errores/finalizar/', api.finalizar, name='api_finalizar'),
    path('api/resumen/', api.resumen, name='api_resumen'),
]
