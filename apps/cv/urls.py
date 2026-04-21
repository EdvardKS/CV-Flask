from django.urls import path

from . import views

app_name = 'cv'

urlpatterns = [
    path('', views.index, name='index'),
    path('summary/', views.summary, name='summary'),
    path('experience/', views.experience, name='experience'),
    path('education/', views.education, name='education'),
    path('skills/', views.skills, name='skills'),
    path('api/cv-data/', views.cv_data, name='data'),
]
