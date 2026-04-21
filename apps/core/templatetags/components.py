"""Reusable UI components as inclusion tags."""
from django import template

register = template.Library()


@register.inclusion_tag('core/components/page_hero.html')
def page_hero(title_key, lead=''):
    return {'title_key': title_key, 'lead': lead}


@register.inclusion_tag('core/components/section_header.html')
def section_header(title_key):
    return {'title_key': title_key}


@register.inclusion_tag('core/components/social_links.html')
def social_links(size='lg'):
    return {'size': size}


@register.inclusion_tag('core/components/grid.html', takes_context=True)
def grid(context, container_id, min_width='280px'):
    return {'container_id': container_id, 'min_width': min_width}


@register.inclusion_tag('core/components/empty_state.html')
def empty_state(message='No data yet.'):
    return {'message': message}


@register.inclusion_tag('core/components/desktop/window_chrome_open.html')
def window_open(win_id, title='', icon='app', initial='closed'):
    return {'win_id': win_id, 'title': title, 'icon': icon, 'initial': initial}


@register.inclusion_tag('core/components/desktop/window_chrome_close.html')
def window_close():
    return {}


@register.inclusion_tag('core/components/desktop/icon_svg.html')
def win_icon(name, size=32):
    return {'name': name, 'size': size}
