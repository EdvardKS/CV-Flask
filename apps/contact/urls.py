from django.urls import path

from . import views

app_name = 'contact'

urlpatterns = [
    path('', views.contact_page, name='form'),
    path('submit/', views.submit, name='submit'),
]
