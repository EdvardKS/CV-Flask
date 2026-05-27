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

test('/api/containers each item has Labels object + StartedAt string', async () => {
  const r = await fetch(BASE + '/api/containers', { headers: { cookie: _cookie } });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.ok(Array.isArray(j));
  assert.ok(j.length > 0, 'expected at least 1 container in test env');
  for (const c of j) {
    assert.equal(typeof c.Labels, 'object', 'Labels must be object on ' + c.Names);
    assert.ok(c.Labels !== null);
    assert.equal(typeof c.StartedAt, 'string', 'StartedAt must be string on ' + c.Names);
  }
});

test('/api/sites each entry has issuedAt and expiresAt (when cert exists)', async () => {
  const r = await fetch(BASE + '/api/sites', { headers: { cookie: _cookie } });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.ok(Array.isArray(j));
  const withCert = j.filter(s => s.expiresAt);
  assert.ok(withCert.length > 0, 'expected at least 1 site with cert');
  for (const s of withCert) {
    assert.equal(typeof s.issuedAt, 'string', 'issuedAt must be ISO string on ' + s.domain);
    assert.equal(typeof s.expiresAt, 'string', 'expiresAt must be ISO string on ' + s.domain);
    assert.ok(new Date(s.issuedAt).getTime() < new Date(s.expiresAt).getTime());
  }
});

test('/api/sites/traffic/summary returns {since,total,domains} shape', async () => {
  const r = await fetch(BASE + '/api/sites/traffic/summary?since=1h', { headers: { cookie: _cookie } });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(typeof j.since, 'string');
  assert.equal(typeof j.total, 'number');
  assert.ok(Array.isArray(j.domains));
  // Sum of pct ~= 100 (allow 1% slop for rounding)
  if (j.domains.length > 0) {
    const sumPct = j.domains.reduce((a, b) => a + b.pct, 0);
    assert.ok(Math.abs(sumPct - 100) < 2 || j.total === 0, 'pct sum = ' + sumPct);
    for (const d of j.domains) {
      assert.equal(typeof d.domain, 'string');
      assert.equal(typeof d.count, 'number');
      assert.equal(typeof d.pct, 'number');
    }
  }
});

test('/api/logs/tail source=stack:viewersoftware combines logs', async () => {
  const r = await fetch(BASE + '/api/logs/tail?source=stack:viewersoftware&limit=20', { headers: { cookie: _cookie } });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.source, 'stack:viewersoftware');
  assert.ok(Array.isArray(j.lines));
});

test('/api/logs/tail source=stack:noexiste-xyz returns empty lines (200)', async () => {
  const r = await fetch(BASE + '/api/logs/tail?source=stack:noexiste-xyz', { headers: { cookie: _cookie } });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.ok(Array.isArray(j.lines));
  assert.equal(j.count, 0);
});

test('/api/deploys?status=failed only returns failed', async () => {
  const r = await fetch(BASE + '/api/deploys?status=failed&limit=20', { headers: { cookie: _cookie } });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.ok(Array.isArray(j));
  for (const d of j) assert.equal(d.status, 'failed');
});

test('GET /api/deploy/compose-quality detects host_ports', async () => {
  const yaml = `services:
  app:
    image: nginx
    ports:
      - "3000:3000"
  db:
    image: postgres
`;
  const r = await fetch(BASE + '/api/deploy/compose-quality', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: _cookie },
    body: JSON.stringify({ yaml })
  });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.ok(Array.isArray(j.issues));
  assert.ok(j.issues.find(i => i.rule === 'host_ports'), 'expected host_ports issue');
});

test('GET /api/deploy/compose-quality detects no_reverse_proxy', async () => {
  const yaml = `services:
  app:
    image: nginx
    expose:
      - "80"
networks:
  default:
    driver: bridge
`;
  const r = await fetch(BASE + '/api/deploy/compose-quality', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: _cookie },
    body: JSON.stringify({ yaml })
  });
  const j = await r.json();
  assert.ok(j.issues.find(i => i.rule === 'no_reverse_proxy'));
});

test('GET /api/deploy/compose-quality detects no_healthcheck on frontal', async () => {
  const yaml = `services:
  frontend:
    image: nginx
    networks: [reverse_proxy]
networks:
  reverse_proxy:
    external: true
`;
  const r = await fetch(BASE + '/api/deploy/compose-quality', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: _cookie },
    body: JSON.stringify({ yaml })
  });
  const j = await r.json();
  assert.ok(j.issues.find(i => i.rule === 'no_healthcheck'));
});

test('GET /api/deploy/compose-quality returns [] on conforming yaml', async () => {
  const yaml = `services:
  app:
    build: .
    container_name: myapp
    restart: always
    networks: [internal, reverse_proxy]
    expose:
      - "3000"
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/ || exit 1"]
      interval: 15s
networks:
  internal: { driver: bridge }
  reverse_proxy: { external: true }
`;
  const r = await fetch(BASE + '/api/deploy/compose-quality', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: _cookie },
    body: JSON.stringify({ yaml })
  });
  const j = await r.json();
  assert.equal(j.issues.length, 0, 'expected zero issues, got: ' + JSON.stringify(j.issues));
});

test('GET /api/deploy/compose-quality returns override yaml with fixes', async () => {
  const yaml = `services:
  app:
    image: nginx
    ports:
      - "3000:3000"
`;
  const r = await fetch(BASE + '/api/deploy/compose-quality', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: _cookie },
    body: JSON.stringify({ yaml })
  });
  const j = await r.json();
  assert.equal(typeof j.override_yaml, 'string');
  assert.ok(/!reset \[\]/.test(j.override_yaml) || /ports: \[\]/.test(j.override_yaml), 'override should reset ports');
});
