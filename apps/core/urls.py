"""SEO URLs (robots, sitemap)."""
from django.urls import path

from . import views

app_name = 'core'

urlpatterns = [
    path('robots.txt', views.robots_txt, name='robots'),
    path('sitemap.xml', views.sitemap_xml, name='sitemap'),
]
