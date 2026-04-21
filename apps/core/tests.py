from django.test import SimpleTestCase

from apps.core.context_processors import WINDOWS


class DesktopRoutingTests(SimpleTestCase):
    def test_home_renders_all_desktop_windows(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        for window in WINDOWS:
            self.assertContains(response, f'data-window-id="{window["id"]}"')
            self.assertContains(response, f'data-url="{window["path"]}"')

    def test_all_desktop_window_routes_are_live(self):
        for window in WINDOWS:
            with self.subTest(window=window['id']):
                response = self.client.get(window['path'])
                self.assertEqual(response.status_code, 200)

    def test_padel_landing_route_exists(self):
        response = self.client.get('/padel/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'data-window-id="padel"')

    def test_padel_subroutes_remain_live(self):
        for path in ('/padel/errores/', '/padel/resumen/'):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
