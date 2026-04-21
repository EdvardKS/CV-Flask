"""Core views: robots.txt, sitemap.xml."""
from django.http import HttpResponse

DISALLOWED = (
    '/summary', '/experience', '/education', '/skills',
    '/projects', '/contact', '/courses/', '/padel/',
)


def robots_txt(request):
    lines = ['User-agent: *', 'Allow: /$']
    lines += [f'Disallow: {p}' for p in DISALLOWED]
    lines += ['', f'Sitemap: {request.build_absolute_uri("/sitemap.xml")}']
    return HttpResponse('\n'.join(lines), content_type='text/plain')


def sitemap_xml(request):
    home = request.build_absolute_uri('/')
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f'  <url><loc>{home}</loc>'
        '<changefreq>monthly</changefreq><priority>1.0</priority></url>\n'
        '</urlset>\n'
    )
    return HttpResponse(body, content_type='application/xml')
