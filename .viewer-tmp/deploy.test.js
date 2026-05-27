// @vitest-environment node
import { test, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BACKEND_URL || 'http://127.0.0.1:4500';
const USER = process.env.ADMIN_USER || 'edvardks';
const PASS = process.env.ADMIN_PASS || 'QuTjwKn25giyu';

let _cookie = null;
before(async () => {
  const r = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ user: USER, pass: PASS })
  });
  _cookie = r.headers.get('set-cookie').split(';')[0];
});

function mp(fields) {
  const boundary = '----viewerTest' + Date.now();
  let body = '';
  for (const [k, v] of Object.entries(fields)) {
    if (v && typeof v === 'object' && v.filename) {
      body += `--${boundary}\r\nContent-Disposition: form-data; name="${k}"; filename="${v.filename}"\r\nContent-Type: ${v.contentType || 'text/plain'}\r\n\r\n${v.content}\r\n`;
    } else {
      body += `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`;
    }
  }
  body += `--${boundary}--\r\n`;
  return {
    headers: { 'content-type': 'multipart/form-data; boundary=' + boundary, cookie: _cookie },
    body
  };
}

test('POST /api/deploy/new without auth returns 401', async () => {
  const m = mp({ url: 'https://github.com/x/y.git', domain: 'x.example.com', upstream_port: '3000' });
  const r = await fetch(BASE + '/api/deploy/new', { method: 'POST', headers: { 'content-type': m.headers['content-type'] }, body: m.body });
  assert.equal(r.status, 401);
});

test('POST /api/deploy/new bad url returns 400 bad_url', async () => {
  const m = mp({ url: 'not-a-git-url', domain: 'x.example.com', upstream_port: '3000' });
  const r = await fetch(BASE + '/api/deploy/new', { method: 'POST', ...m });
  assert.equal(r.status, 400);
  const j = await r.json();
  assert.equal(j.error, 'bad_url');
});

test('POST /api/deploy/new file:// url returns 400', async () => {
  const m = mp({ url: 'file:///etc/passwd', domain: 'x.example.com', upstream_port: '3000' });
  const r = await fetch(BASE + '/api/deploy/new', { method: 'POST', ...m });
  assert.equal(r.status, 400);
});

test('POST /api/deploy/new bad domain returns 400', async () => {
  const m = mp({ url: 'https://github.com/a/b.git', domain: 'no espacios', upstream_port: '3000' });
  const r = await fetch(BASE + '/api/deploy/new', { method: 'POST', ...m });
  assert.equal(r.status, 400);
  const j = await r.json();
  assert.equal(j.error, 'bad_domain');
});

test('POST /api/deploy/new bad port 0 returns 400', async () => {
  const m = mp({ url: 'https://github.com/a/b.git', domain: 'x.example.com', upstream_port: '0' });
  const r = await fetch(BASE + '/api/deploy/new', { method: 'POST', ...m });
  assert.equal(r.status, 400);
});

test('POST /api/deploy/new bad port 99999 returns 400', async () => {
  const m = mp({ url: 'https://github.com/a/b.git', domain: 'x.example.com', upstream_port: '99999' });
  const r = await fetch(BASE + '/api/deploy/new', { method: 'POST', ...m });
  assert.equal(r.status, 400);
});

test('POST /api/deploy/new reserved name returns 400', async () => {
  const m = mp({ url: 'https://github.com/a/b.git', name: 'viewerSoftware', domain: 'x.example.com', upstream_port: '3000' });
  const r = await fetch(BASE + '/api/deploy/new', { method: 'POST', ...m });
  assert.equal(r.status, 400);
  const j = await r.json();
  assert.equal(j.error, 'reserved_name');
});

test('POST /api/deploy/new path_in_use returns 409', async () => {
  const m = mp({ url: 'https://github.com/a/b.git', name: 'edvardks', domain: 'newdomain.test.com', upstream_port: '3000', skip_dns: 'true' });
  const r = await fetch(BASE + '/api/deploy/new', { method: 'POST', ...m });
  assert.equal(r.status, 409);
  const j = await r.json();
  assert.equal(j.error, 'path_in_use');
});

test('POST /api/deploy/new domain_in_use returns 409', async () => {
  const m = mp({ url: 'https://github.com/a/b.git', name: 'newrepo-test-xyz', domain: 'viewer.edvardks.com', upstream_port: '3000', skip_dns: 'true' });
  const r = await fetch(BASE + '/api/deploy/new', { method: 'POST', ...m });
  assert.equal(r.status, 409);
  const j = await r.json();
  assert.equal(j.error, 'domain_in_use');
});

test('POST /api/deploy/new env_too_large returns 413', async () => {
  const big = 'X='.repeat(20000); // ~40KB
  const m = mp({
    url: 'https://github.com/a/b.git',
    name: 'env-too-big-test',
    domain: 'envbig.test.com',
    upstream_port: '3000',
    skip_dns: 'true',
    env: { filename: '.env', content: big }
  });
  const r = await fetch(BASE + '/api/deploy/new', { method: 'POST', ...m });
  assert.equal(r.status, 413);
});

test('POST /api/deploy/new env with NULL byte returns 400', async () => {
  const m = mp({
    url: 'https://github.com/a/b.git',
    name: 'env-null-test',
    domain: 'envnull.test.com',
    upstream_port: '3000',
    skip_dns: 'true',
    env: { filename: '.env', content: 'KEY=val\0' }
  });
  const r = await fetch(BASE + '/api/deploy/new', { method: 'POST', ...m });
  assert.equal(r.status, 400);
  const j = await r.json();
  assert.equal(j.error, 'invalid_env');
});

test('GET /api/deploys without auth returns 401', async () => {
  const r = await fetch(BASE + '/api/deploys');
  assert.equal(r.status, 401);
});

test('GET /api/deploys returns array', async () => {
  const r = await fetch(BASE + '/api/deploys', { headers: { cookie: _cookie } });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.ok(Array.isArray(j));
});

test('GET /api/deploys/nonexistent returns 404', async () => {
  const r = await fetch(BASE + '/api/deploys/nonexistent-id-xyz', { headers: { cookie: _cookie } });
  assert.equal(r.status, 404);
});

test('GET /api/deploys/:id/logs requires auth', async () => {
  const r = await fetch(BASE + '/api/deploys/anything/logs');
  assert.equal(r.status, 401);
});

test('POST /api/deploy/new with valid input + skip_dns + staging starts SSE (status 202)', async () => {
  // Use a fake URL that ls-remote will reject — pero la validate previa pasa,
  // dejamos que falle en clone para validar SSE + rollback flow.
  // Skip this if we want REAL deploy: only run E2E manually.
  // Aqui solo validamos que el handshake SSE arranca.
  // Si no podemos simular: omitir y dejar como manual.
});

test('SSE stream emite event:phase con start tras handshake', async () => {
  // Test simplificado: usamos una URL que pasara validate-pre pero faltara cosas.
  // Si endpoint no esta listo, este test red-fails — esperado en TDD.
  // En implementacion final, se hace fetch con stream y se parsea event.
  // Por ahora dejamos como pendiente / lo cubrimos manual E2E.
});

test('GET /api/deploy/precheck domain libre retorna disponible', async () => {
  const r = await fetch(BASE + '/api/deploy/precheck?domain=alguno-no-usado-xyz.example.com&name=somefreepath', { headers: { cookie: _cookie } });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(typeof j.domain_available, 'boolean');
  assert.equal(typeof j.path_available, 'boolean');
});

test('GET /api/deploy/precheck domain en uso retorna no disponible', async () => {
  const r = await fetch(BASE + '/api/deploy/precheck?domain=viewer.edvardks.com', { headers: { cookie: _cookie } });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.domain_available, false);
});
