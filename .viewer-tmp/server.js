import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';
import Database from 'better-sqlite3';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { randomBytes, randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import Busboy from 'busboy';

// Estabilidad: no morir por errores no capturados
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason && (reason.stack || reason.message || reason));
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err.stack || err.message);
});

const exec = promisify(execFile);
const sh = (cmd, args = [], opts = {}) => exec(cmd, args, { timeout: 30000, maxBuffer: 10 * 1024 * 1024, ...opts });

const PORT = process.env.PORT || 4500;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const DEFAULT_CERT_EMAIL = process.env.DEFAULT_CERT_EMAIL || 'admin@example.com';
const ADMIN_FILE = '/app/data/admin.json';
const USERS_FILE = '/app/data/users.json';
const ROLES = new Set(['admin', 'operator', 'viewer']);

async function loadJson(p) {
  try { return JSON.parse(await readFile(p, 'utf8')); } catch { return null; }
}
async function saveJson(p, obj) {
  await writeFile(p, JSON.stringify({ ...obj, updated: new Date().toISOString() }, null, 2), { mode: 0o600 });
}

// Migrate admin.json -> users.json if needed
let usersState = await loadJson(USERS_FILE);
if (!usersState) {
  const admin = await loadJson(ADMIN_FILE) || {};
  const u0 = {
    user: ADMIN_USER,
    role: 'admin',
    hash: admin.hash || bcrypt.hashSync(process.env.ADMIN_PASS || 'admin', 10),
    totp_secret: admin.totp_secret || null,
    backup_codes: admin.backup_codes || null
  };
  usersState = { users: [u0] };
  await saveJson(USERS_FILE, usersState);
}

function findUser(name) { return usersState.users.find(u => u.user === name); }
async function persistUsers() { await saveJson(USERS_FILE, usersState); }

// Re-seed admin: if .env has ADMIN_USER and stored single user has different name
if (usersState.users.length === 1 && process.env.ADMIN_USER && usersState.users[0].user !== process.env.ADMIN_USER) {
  const u = usersState.users[0];
  console.log(`[reseed] renaming user ${u.user} -> ${process.env.ADMIN_USER}`);
  u.user = process.env.ADMIN_USER;
  if (process.env.ADMIN_PASS) u.hash = bcrypt.hashSync(process.env.ADMIN_PASS, 12);
  delete u.recovery_token;
  delete u.recovery_expires;
  await persistUsers();
}

function genBackupCode() {
  return randomBytes(5).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase();
}

// SMTP transporter (hoist for checkAlerts)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

// SQLite metrics
const db = new Database('/app/data/metrics.db');
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS samples (
    ts INTEGER PRIMARY KEY,
    cpu_load REAL,
    mem_pct REAL,
    disk_pct REAL
  );
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    kind TEXT NOT NULL,
    value REAL,
    message TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_alerts_ts ON alerts(ts);
  CREATE TABLE IF NOT EXISTS audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    user TEXT,
    action TEXT,
    target TEXT,
    ok INTEGER,
    detail TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit(ts);
  CREATE TABLE IF NOT EXISTS access_ips (
    ip TEXT PRIMARY KEY,
    label TEXT,
    added_by TEXT,
    ts INTEGER
  );
  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    user TEXT,
    approved INTEGER NOT NULL DEFAULT 1,
    label TEXT,
    first_ip TEXT,
    last_ip TEXT,
    ua TEXT,
    first_seen INTEGER,
    last_seen INTEGER
  );
  CREATE TABLE IF NOT EXISTS repos_config (
    name TEXT PRIMARY KEY,
    webhook_enabled INTEGER NOT NULL DEFAULT 1,
    webhook_secret TEXT,
    last_status TEXT,
    last_status_ts INTEGER,
    last_commit_before TEXT,
    last_log TEXT
  );
  CREATE TABLE IF NOT EXISTS deploys (
    id TEXT PRIMARY KEY,
    ts INTEGER NOT NULL,
    finished_ts INTEGER,
    user TEXT NOT NULL,
    url TEXT NOT NULL,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    upstream_port INTEGER NOT NULL,
    email TEXT,
    skip_dns INTEGER NOT NULL DEFAULT 0,
    staging_cert INTEGER NOT NULL DEFAULT 0,
    phase TEXT NOT NULL,
    status TEXT NOT NULL,
    error TEXT,
    rollback_done INTEGER DEFAULT 0,
    webhook_secret TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_deploys_ts ON deploys(ts);
  CREATE INDEX IF NOT EXISTS idx_deploys_status ON deploys(status);
  CREATE TABLE IF NOT EXISTS deploy_logs (
    deploy_id TEXT NOT NULL,
    seq INTEGER NOT NULL,
    ts_ms INTEGER NOT NULL,
    phase TEXT NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    PRIMARY KEY (deploy_id, seq)
  );
`);
// Boot cleanup: deploys que quedaron running por restart se marcan failed
try {
  const r = db.prepare("UPDATE deploys SET status='failed', error='backend_restart', finished_ts=? WHERE status='running'").run(Math.floor(Date.now() / 1000));
  if (r.changes > 0) console.log('[boot] cleared', r.changes, 'stuck deploys');
} catch {}
// Seed initial allowed IP if empty
const ipCount = db.prepare('SELECT COUNT(*) AS n FROM access_ips').get().n;
if (ipCount === 0) {
  db.prepare('INSERT INTO access_ips (ip, label, added_by, ts) VALUES (?, ?, ?, ?)').run('45.136.32.3', 'seed', 'system', Math.floor(Date.now() / 1000));
}
const stmtInsertSample = db.prepare('INSERT OR REPLACE INTO samples (ts, cpu_load, mem_pct, disk_pct) VALUES (?, ?, ?, ?)');
const stmtCleanupSamples = db.prepare('DELETE FROM samples WHERE ts < ?');
const stmtInsertAudit = db.prepare('INSERT INTO audit (ts, user, action, target, ok, detail) VALUES (?, ?, ?, ?, ?, ?)');
const stmtCleanupAudit = db.prepare('DELETE FROM audit WHERE ts < ?');
const stmtRecentAudit = db.prepare('SELECT * FROM audit ORDER BY ts DESC LIMIT ?');
const stmtInsertAlert = db.prepare('INSERT INTO alerts (ts, kind, value, message) VALUES (?, ?, ?, ?)');
const stmtCleanupAlerts = db.prepare('DELETE FROM alerts WHERE ts < ?');
const stmtRecentAlerts = db.prepare('SELECT * FROM alerts ORDER BY ts DESC LIMIT ?');

const alertCooldownMs = 60 * 60 * 1000;
const alertLastSent = new Map();
const activeAlerts = new Map();

async function sampleMetrics() {
  try {
    const [meminfo, loadavg, cpuinfo] = await Promise.all([
      readFile('/host/proc/meminfo', 'utf8'),
      readFile('/host/proc/loadavg', 'utf8'),
      readFile('/host/proc/cpuinfo', 'utf8').catch(() => '')
    ]);
    const memKv = Object.fromEntries(meminfo.split('\n').filter(Boolean).map(l => {
      const [k, v] = l.split(':'); return [k.trim(), parseInt((v || '').trim().split(' ')[0]) || 0];
    }));
    const memPct = ((memKv.MemTotal - memKv.MemAvailable) / memKv.MemTotal) * 100;
    const load = parseFloat(loadavg.trim().split(/\s+/)[0]);
    const cpus = (cpuinfo.match(/^processor\s*:/gm) || []).length || 1;

    let diskPct = 0;
    try {
      const mounts = await readFile('/host/proc/mounts', 'utf8');
      const root = mounts.split('\n').find(l => {
        const parts = l.split(/\s+/);
        return parts[0].startsWith('/dev/') && parts[1] === '/';
      });
      if (root) {
        const { stdout } = await sh('df', ['-B1', '/']);
        const data = stdout.trim().split('\n').slice(1)[0];
        diskPct = parseInt(data.split(/\s+/)[4]) || 0;
      }
    } catch {}

    const ts = Math.floor(Date.now() / 1000);
    stmtInsertSample.run(ts, load, memPct, diskPct);
    stmtCleanupSamples.run(ts - 86400);

    checkAlerts({ cpus, load, memPct, diskPct, ts });
  } catch (e) { console.error('sample err:', e.message); }
}

function checkAlerts({ cpus, load, memPct, diskPct, ts }) {
  const triggers = [];
  if (diskPct > 85) triggers.push({ kind: 'disk', value: diskPct, message: `Disk root al ${diskPct}%` });
  if (memPct > 90) triggers.push({ kind: 'mem', value: memPct, message: `Memoria al ${memPct.toFixed(1)}%` });
  if (load > cpus * 2) triggers.push({ kind: 'load', value: load, message: `Load ${load.toFixed(2)} > 2x cpus (${cpus})` });

  // Anomaly: load spike vs 60min baseline
  try {
    const baselineSince = ts - 3600;
    const baseline = db.prepare('SELECT AVG(cpu_load) AS avg FROM samples WHERE ts >= ? AND ts < ?').get(baselineSince, ts - 300);
    if (baseline?.avg && baseline.avg > 0.1 && load > baseline.avg * 2 && load > 1) {
      triggers.push({ kind: 'load_spike', value: load, message: `Load ${load.toFixed(2)} > 2x baseline ${baseline.avg.toFixed(2)} (60min)` });
    }
  } catch {}

  for (const t of triggers) {
    activeAlerts.set(t.kind, { ...t, ts });
    stmtInsertAlert.run(ts, t.kind, t.value, t.message);
    const last = alertLastSent.get(t.kind) || 0;
    if (Date.now() - last > alertCooldownMs) {
      alertLastSent.set(t.kind, Date.now());
      transporter.sendMail({
        from: process.env.SMTP_FROM, to: process.env.NOTIFY_TO,
        subject: `[ALERT] ViewerSoftware - ${t.kind}`,
        text: `${t.message}\n\nHora: ${new Date(ts * 1000).toISOString()}`
      }).catch(e => console.error('alert mail:', e.message));
      if (process.env.WEBHOOK_URL) {
        const payload = { text: `[ALERT] ${t.kind}: ${t.message}`, content: `[ALERT] ${t.kind}: ${t.message}` };
        fetch(process.env.WEBHOOK_URL, {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload)
        }).catch(e => console.error('webhook:', e.message));
      }
    }
  }
  for (const kind of ['disk', 'mem', 'load', 'load_spike']) {
    if (!triggers.find(t => t.kind === kind)) activeAlerts.delete(kind);
  }
  stmtCleanupAlerts.run(ts - 7 * 86400);
}

const SELF_NAMES = new Set(['viewer_backend', 'viewer_frontend']);
const SCRIPT_ALLOWLIST = new Set([
  '/var/www/.nginx/renew_certs.sh',
  '/var/www/.nginx/backup_www.sh'
]);

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb', verify: (req, _, buf) => { req.rawBody = buf; } }));
app.use(cookieParser());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Audit middleware (registra POST/PUT/DELETE/PATCH solo)
app.use((req, res, next) => {
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) return next();
  const t = req.cookies && req.cookies.token;
  let user = '-';
  if (t) { try { user = jwt.verify(t, JWT_SECRET).u; } catch {} }
  res.on('finish', () => {
    try {
      const ts = Math.floor(Date.now() / 1000);
      stmtInsertAudit.run(ts, user, req.method + ' ' + req.path, req.params?.name || req.params?.domain || '', res.statusCode < 400 ? 1 : 0, '');
      stmtCleanupAudit.run(ts - 30 * 86400);
    } catch {}
  });
  next();
});

function realIp(req) {
  const cf = req.headers['cf-connecting-ip'];
  if (cf && typeof cf === 'string') return cf.trim();
  const xr = req.headers['x-real-ip'];
  if (xr && typeof xr === 'string') return xr.trim();
  const xf = req.headers['x-forwarded-for'];
  if (xf && typeof xf === 'string') return xf.split(',')[0].trim();
  return req.ip;
}

const stmtIpExists = db.prepare('SELECT 1 AS x FROM access_ips WHERE ip = ?');
const stmtGetDevice = db.prepare('SELECT * FROM devices WHERE id = ?');
const stmtUpsertDeviceAuto = db.prepare(`INSERT INTO devices (id, user, approved, label, first_ip, last_ip, ua, first_seen, last_seen)
  VALUES (?, NULL, 1, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET approved=1, last_ip=excluded.last_ip, last_seen=excluded.last_seen, ua=excluded.ua`);
const stmtTouchDevice = db.prepare('UPDATE devices SET last_ip = ?, last_seen = ?, ua = COALESCE(?, ua) WHERE id = ?');

const ACCESS_PUBLIC_PATHS = new Set(['/api/health', '/api/config/public']);
function isWebhookPath(p) { return p.startsWith('/api/webhooks/'); }
function requireAccess(req, res, next) {
  if (ACCESS_PUBLIC_PATHS.has(req.path) || isWebhookPath(req.path)) return next();
  const ip = realIp(req);
  // Loopback and Docker bridge IPs bypass (frontend container reaches backend via bridge)
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.') || ip.startsWith('172.')) {
    req.accessIp = ip; req.ipAllowed = true; req.deviceApproved = true;
    return next();
  }
  const ipAllowed = !!stmtIpExists.get(ip);
  let deviceId = req.cookies && req.cookies.viewer_device;
  let device = deviceId ? stmtGetDevice.get(deviceId) : null;
  const ua = (req.headers['user-agent'] || '').slice(0, 256);
  const now = Math.floor(Date.now() / 1000);
  if (ipAllowed) {
    if (!device) {
      const newId = randomUUID();
      stmtUpsertDeviceAuto.run(newId, 'auto:' + ip, ip, ip, ua, now, now);
      res.cookie('viewer_device', newId, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
      req.deviceId = newId;
    } else {
      stmtTouchDevice.run(ip, now, ua, deviceId);
      req.deviceId = deviceId;
    }
    req.accessIp = ip; req.ipAllowed = true; req.deviceApproved = true;
    return next();
  }
  if (device && device.approved === 1) {
    stmtTouchDevice.run(ip, now, ua, deviceId);
    req.deviceId = deviceId; req.accessIp = ip; req.ipAllowed = false; req.deviceApproved = true;
    return next();
  }
  return res.status(403).json({ error: 'access_denied', ip, device_id: deviceId || null });
}

async function verifyTurnstile(token, ip) {
  if (process.env.TURNSTILE_TEST_BYPASS === '1') return true;
  // Loopback / Docker bridge: skip Turnstile (internal tests, container-to-container)
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.') || ip.startsWith('172.')) return true;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: ip || '' });
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const j = await r.json();
    return !!j.success;
  } catch (e) { console.error('turnstile:', e.message); return false; }
}

const requireAuth = (req, res, next) => {
  const t = req.cookies && req.cookies.token;
  if (!t) return res.status(401).json({ error: 'unauth' });
  try {
    const decoded = jwt.verify(t, JWT_SECRET);
    const u = findUser(decoded.u);
    if (!u) return res.status(401).json({ error: 'user gone' });
    req.user = { u: decoded.u, role: u.role };
    next();
  } catch { res.status(401).json({ error: 'unauth' }); }
};
const requireRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
  next();
};
const requireAdmin = [requireAuth, requireRole(['admin'])];
const requireOp = [requireAuth, requireRole(['admin', 'operator'])];

app.get('/api/health', (_, res) => res.json({ ok: true, ts: Date.now() }));

// Apply access gating to everything except /api/health (and login redirects below — login itself is gated too)
app.use(requireAccess);

const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, skipSuccessfulRequests: true });
app.post('/api/auth/login', loginLimit, async (req, res) => {
  const { user, pass, token, turnstile_token } = req.body || {};
  const tsOk = await verifyTurnstile(turnstile_token, realIp(req));
  if (!tsOk) return res.status(401).json({ error: 'bad_turnstile' });
  const u = findUser(user);
  if (!u || !bcrypt.compareSync(pass || '', u.hash))
    return res.status(401).json({ error: 'bad credentials' });
  const ip = realIp(req);
  const isLoopback = ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.') || ip.startsWith('172.');
  if (u.totp_secret && !isLoopback) {
    if (!token) return res.status(401).json({ error: '2fa_required' });
    const tStr = String(token).trim();
    let ok = false;
    if (/^\d{6}$/.test(tStr)) {
      ok = authenticator.check(tStr, u.totp_secret);
    } else if (/^[A-Z0-9]{8}$/.test(tStr.toUpperCase()) && Array.isArray(u.backup_codes)) {
      const upper = tStr.toUpperCase();
      const idx = u.backup_codes.findIndex(c => !c.used && bcrypt.compareSync(upper, c.hash));
      if (idx >= 0) {
        u.backup_codes[idx].used = true;
        ok = true;
        persistUsers().catch(() => {});
        const remaining = u.backup_codes.filter(c => !c.used).length;
        if (remaining === 0) {
          transporter.sendMail({
            from: process.env.SMTP_FROM, to: process.env.NOTIFY_TO,
            subject: '[ViewerSoftware] Todos backup codes usados',
            text: `Usuario ${user}: ultimo backup code 2FA usado. Genera nuevos.`
          }).catch(() => {});
        }
      }
    }
    if (!ok) return res.status(401).json({ error: 'bad 2fa token' });
  }
  const tok = jwt.sign({ u: user }, JWT_SECRET, { expiresIn: '8h' });
  res.cookie('token', tok, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 8 * 3600 * 1000 });
  // Associate device cookie (set by requireAccess) with this user
  if (req.deviceId) {
    try { db.prepare('UPDATE devices SET user = ? WHERE id = ?').run(user, req.deviceId); } catch {}
  }
  res.json({ ok: true, user, role: u.role });
});
app.post('/api/auth/logout', (_, res) => { res.clearCookie('token'); res.json({ ok: true }); });
app.get('/api/me', requireAuth, (req, res) => res.json({ user: req.user.u, role: req.user.role }));

app.get('/api/auth/2fa/status', requireAuth, (req, res) => {
  const u = findUser(req.user.u);
  res.json({ enabled: !!u.totp_secret });
});

app.get('/api/auth/2fa/setup', requireAuth, async (req, res) => {
  try {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(req.user.u, 'ViewerSoftware', secret);
    let qrDataUrl = null;
    try { qrDataUrl = await QRCode.toDataURL(otpauth); } catch {}
    res.json({ secret, otpauth, qrDataUrl });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/2fa/enable', requireAuth, async (req, res) => {
  const { secret, token } = req.body || {};
  if (typeof secret !== 'string' || !/^[A-Z2-7]{16,}$/i.test(secret))
    return res.status(400).json({ error: 'bad secret' });
  if (typeof token !== 'string' || !/^\d{6}$/.test(token))
    return res.status(400).json({ error: 'token must be 6 digits' });
  if (!authenticator.check(token, secret))
    return res.status(400).json({ error: 'token invalido' });
  try {
    const u = findUser(req.user.u);
    const plain = Array.from({ length: 10 }, () => genBackupCode());
    u.totp_secret = secret;
    u.backup_codes = plain.map(p => ({ hash: bcrypt.hashSync(p, 10), used: false }));
    await persistUsers();
    res.json({ ok: true, backup_codes: plain });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/2fa/regen-backup', requireAuth, async (req, res) => {
  const { pass } = req.body || {};
  const u = findUser(req.user.u);
  if (!bcrypt.compareSync(pass || '', u.hash)) return res.status(401).json({ error: 'bad pass' });
  if (!u.totp_secret) return res.status(400).json({ error: '2fa not enabled' });
  try {
    const plain = Array.from({ length: 10 }, () => genBackupCode());
    u.backup_codes = plain.map(p => ({ hash: bcrypt.hashSync(p, 10), used: false }));
    await persistUsers();
    res.json({ ok: true, backup_codes: plain });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/2fa/backup-codes/remaining', requireAuth, (req, res) => {
  const u = findUser(req.user.u);
  if (!u.totp_secret || !Array.isArray(u.backup_codes)) return res.json({ remaining: 0 });
  res.json({ remaining: u.backup_codes.filter(c => !c.used).length, total: u.backup_codes.length });
});

app.post('/api/auth/2fa/disable', requireAuth, async (req, res) => {
  const { pass } = req.body || {};
  const u = findUser(req.user.u);
  if (!bcrypt.compareSync(pass || '', u.hash)) return res.status(401).json({ error: 'bad pass' });
  try {
    u.totp_secret = null;
    u.backup_codes = null;
    await persistUsers();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const { oldPass, newPass } = req.body || {};
  if (typeof newPass !== 'string' || newPass.length < 12) return res.status(400).json({ error: 'newPass min 12 chars' });
  const u = findUser(req.user.u);
  if (!bcrypt.compareSync(oldPass || '', u.hash)) return res.status(401).json({ error: 'bad oldPass' });
  try {
    u.hash = bcrypt.hashSync(newPass, 12);
    await persistUsers();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Password recovery
const recoveryLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true });
app.post('/api/auth/recovery/request', recoveryLimit, async (req, res) => {
  const { user, turnstile_token } = req.body || {};
  const tsOk = await verifyTurnstile(turnstile_token, realIp(req));
  if (!tsOk) return res.status(401).json({ error: 'bad_turnstile' });
  // Always return 200 to avoid user enumeration
  res.json({ ok: true, message: 'Si el usuario existe, se ha enviado un email al admin.' });
  if (typeof user !== 'string' || !/^[a-z0-9_.-]{1,32}$/i.test(user)) return;
  const u = findUser(user);
  if (!u) return;
  try {
    const token = randomBytes(32).toString('hex');
    u.recovery_token = bcrypt.hashSync(token, 8);
    u.recovery_expires = Date.now() + 3600 * 1000;
    await persistUsers();
    const link = 'https://viewer.edvardks.com/recovery?token=' + encodeURIComponent(user + ':' + token);
    transporter.sendMail({
      from: process.env.SMTP_FROM, to: process.env.NOTIFY_TO,
      subject: `[ViewerSoftware] Reset password ${user}`,
      text: `Recovery requested para usuario ${user}.\n\nLink (expira 1h): ${link}\n\nSi no fuiste tu, ignora.`
    }).catch(e => console.error('recovery mail:', e.message));
  } catch (e) { console.error('recovery:', e.message); }
});

app.post('/api/auth/recovery/redeem', recoveryLimit, async (req, res) => {
  const { token, newPass } = req.body || {};
  if (typeof token !== 'string' || !token.includes(':')) return res.status(400).json({ error: 'bad token' });
  if (typeof newPass !== 'string' || newPass.length < 12) return res.status(400).json({ error: 'newPass min 12 chars' });
  const [user, raw] = token.split(':', 2);
  const u = findUser(user);
  if (!u || !u.recovery_token || !u.recovery_expires) return res.status(400).json({ error: 'invalid' });
  if (Date.now() > u.recovery_expires) return res.status(400).json({ error: 'expired' });
  if (!bcrypt.compareSync(raw, u.recovery_token)) return res.status(400).json({ error: 'invalid' });
  try {
    u.hash = bcrypt.hashSync(newPass, 12);
    delete u.recovery_token;
    delete u.recovery_expires;
    await persistUsers();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/docker/events', requireAuth, async (req, res) => {
  const since = String(req.query.since || '1h');
  if (!/^\d+[smhd]?$|^\d{4}-\d{2}-\d{2}/.test(since)) return res.status(400).json({ error: 'bad since' });
  try {
    const { stdout } = await sh('docker', ['events', '--since', since, '--until', '0s', '--format', '{{json .}}'], { timeout: 8000 });
    const lines = stdout.trim().split('\n').filter(Boolean).slice(-200);
    const events = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    res.json({ since, count: events.length, events });
  } catch (e) {
    if (e.signal === 'SIGTERM' || /timed?out|timeout/i.test(e.message)) {
      const lines = (e.stdout || '').trim().split('\n').filter(Boolean).slice(-200);
      const events = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      return res.json({ since, count: events.length, events, partial: true });
    }
    res.status(500).json({ error: e.message });
  }
});

// Public config (site key only)
app.get('/api/config/public', (_, res) => res.json({ turnstile_site_key: process.env.TURNSTILE_SITE_KEY || null }));

// Access control endpoints
app.get('/api/access/me', requireAuth, (req, res) => {
  res.json({ ip: req.accessIp, device_id: req.deviceId || null, ip_allowed: !!req.ipAllowed, device_approved: !!req.deviceApproved });
});

app.get('/api/access/ips', ...requireAdmin, (_, res) => {
  try { res.json(db.prepare('SELECT * FROM access_ips ORDER BY ts DESC').all()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/access/ips', ...requireAdmin, (req, res) => {
  const { ip, label } = req.body || {};
  if (typeof ip !== 'string' || !/^([0-9.]{7,15}|[0-9a-f:]{2,39})$/i.test(ip)) return res.status(400).json({ error: 'bad_ip' });
  const lbl = typeof label === 'string' ? label.slice(0, 64) : '';
  try {
    db.prepare('INSERT INTO access_ips (ip,label,added_by,ts) VALUES (?,?,?,?) ON CONFLICT(ip) DO UPDATE SET label=excluded.label')
      .run(ip, lbl, req.user.u, Math.floor(Date.now() / 1000));
    res.status(201).json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/access/ips/:ip', ...requireAdmin, (req, res) => {
  const ip = req.params.ip;
  try {
    const ipCount = db.prepare('SELECT COUNT(*) AS n FROM access_ips').get().n;
    const devCount = db.prepare('SELECT COUNT(*) AS n FROM devices WHERE approved = 1').get().n;
    if (ipCount <= 1 && devCount < 1) return res.status(400).json({ error: 'last_ip_guard' });
    const r = db.prepare('DELETE FROM access_ips WHERE ip = ?').run(ip);
    if (r.changes === 0) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/access/devices', ...requireAdmin, (_, res) => {
  try { res.json(db.prepare('SELECT * FROM devices ORDER BY last_seen DESC').all()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.patch('/api/access/devices/:id', ...requireAdmin, (req, res) => {
  const id = req.params.id;
  const { label, approved } = req.body || {};
  const d = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
  if (!d) return res.status(404).json({ error: 'not_found' });
  // Guard: cannot revoke last approved device if no IPs in allowlist
  if (approved === false || approved === 0) {
    const ipCount = db.prepare('SELECT COUNT(*) AS n FROM access_ips').get().n;
    const approvedCount = db.prepare('SELECT COUNT(*) AS n FROM devices WHERE approved = 1').get().n;
    if (ipCount === 0 && approvedCount <= 1) return res.status(400).json({ error: 'last_device_guard' });
  }
  try {
    const newLabel = (typeof label === 'string') ? label.slice(0, 64) : d.label;
    const newApproved = (approved === true || approved === false) ? (approved ? 1 : 0) : d.approved;
    db.prepare('UPDATE devices SET label = ?, approved = ? WHERE id = ?').run(newLabel, newApproved, id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/access/devices/:id', ...requireAdmin, (req, res) => {
  const id = req.params.id;
  const d = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
  if (!d) return res.status(404).json({ error: 'not_found' });
  const ipCount = db.prepare('SELECT COUNT(*) AS n FROM access_ips').get().n;
  const approvedCount = db.prepare('SELECT COUNT(*) AS n FROM devices WHERE approved = 1').get().n;
  if (d.approved === 1 && ipCount === 0 && approvedCount <= 1) return res.status(400).json({ error: 'last_device_guard' });
  try { db.prepare('DELETE FROM devices WHERE id = ?').run(id); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Repositorios git
const REPO_BASE = '/host/www';  // backend monta /var/www como /host/www (añadir mount en compose)
const REPO_SKIP = new Set(['viewerSoftware', '.nginx', 'certbot', 'html']);

function validRepoName(n) { return /^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$/.test(n); }
function validGitUrl(u) { return /^(https?:\/\/[^\s]+\.git|git@[^\s]+:[^\s]+\.git)$/.test(u); }

async function repoStatus(name) {
  const path = REPO_BASE + '/' + name;
  try {
    const [branchR, statusR, logR] = await Promise.all([
      sh('git', ['-C', path, 'rev-parse', '--abbrev-ref', 'HEAD']).catch(e => ({ stdout: '', stderr: e.stderr || e.message })),
      sh('git', ['-C', path, 'status', '--porcelain=v1', '-b']).catch(e => ({ stdout: '', stderr: e.stderr || e.message })),
      sh('git', ['-C', path, 'log', '-1', '--pretty=format:%h%x00%ai%x00%an%x00%s']).catch(e => ({ stdout: '', stderr: e.stderr || e.message }))
    ]);
    const branch = branchR.stdout.trim() || null;
    const lines = statusR.stdout.split('\n');
    const head = lines[0] || '';
    const ahead = parseInt((head.match(/ahead (\d+)/) || [])[1]) || 0;
    const behind = parseInt((head.match(/behind (\d+)/) || [])[1]) || 0;
    const dirty = lines.slice(1).filter(Boolean).length;
    const [hash, date, author, msg] = (logR.stdout || '').split('\0');
    // Last pull: mtime de FETCH_HEAD si existe
    let last_pull = null;
    try {
      const s = await stat(path + '/.git/FETCH_HEAD');
      last_pull = s.mtime.toISOString();
    } catch {}
    const gitErr = branchR.stderr || logR.stderr || statusR.stderr || null;
    return { name, path, branch, ahead, behind, dirty, last_commit: hash ? { hash, date, author, msg } : null, last_pull, git_error: gitErr && /dubious|not a git|permission/i.test(gitErr) ? gitErr.split('\n')[0] : null };
  } catch (e) { return { name, path, error: e.message }; }
}

let reposCache = { ts: 0, data: null };
const REPOS_CACHE_MS = 20000;
app.get('/api/repos', requireAuth, async (_, res) => {
  try {
    if (reposCache.data && (Date.now() - reposCache.ts) < REPOS_CACHE_MS) {
      return res.json(reposCache.data);
    }
    const entries = await readdir(REPO_BASE, { withFileTypes: true });
    const repos = entries.filter(e => e.isDirectory() && !REPO_SKIP.has(e.name) && validRepoName(e.name));
    const out = [];
    for (const r of repos) {
      try {
        await stat(REPO_BASE + '/' + r.name + '/.git');
        const status = await repoStatus(r.name);
        const cfg = ensureRepoCfg(r.name);
        status.config = {
          webhook_enabled: cfg.webhook_enabled === 1,
          last_status: cfg.last_status || 'idle',
          last_status_ts: cfg.last_status_ts
        };
        out.push(status);
      } catch {}
    }
    reposCache = { ts: Date.now(), data: out };
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/repos/:name/log', requireAuth, async (req, res) => {
  const name = req.params.name;
  if (!validRepoName(name) || REPO_SKIP.has(name)) return res.status(400).json({ error: 'bad_name' });
  const path = REPO_BASE + '/' + name;
  try { await stat(path + '/.git'); } catch { return res.status(404).json({ error: 'not_found' }); }
  try {
    const { stdout } = await sh('git', ['-C', path, 'log', '-20', '--pretty=format:%h%x09%ai%x09%an%x09%s']);
    const commits = stdout.split('\n').filter(Boolean).map(l => {
      const [hash, date, author, ...msgParts] = l.split('\t');
      return { hash, date, author, msg: msgParts.join('\t') };
    });
    res.json(commits);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/repos/:name/pull', ...requireOp, async (req, res) => {
  const name = req.params.name;
  if (!validRepoName(name) || REPO_SKIP.has(name)) return res.status(400).json({ error: 'bad_name' });
  const path = REPO_BASE + '/' + name;
  try { await stat(path + '/.git'); } catch { return res.status(404).json({ error: 'not_found' }); }
  try {
    const { stdout, stderr } = await sh('git', ['-C', path, 'pull', '--ff-only'], { timeout: 60000 });
    res.json({ ok: true, output: stdout + stderr });
  } catch (e) { res.status(500).json({ error: e.message, stdout: e.stdout || '', stderr: e.stderr || '' }); }
});

app.post('/api/repos/clone', ...requireOp, async (req, res) => {
  const { url, dir } = req.body || {};
  if (!validGitUrl(url || '')) return res.status(400).json({ error: 'bad_url' });
  if (typeof dir !== 'string' || !/^\/var\/www\/[a-zA-Z][a-zA-Z0-9_.-]{0,63}$/.test(dir)) return res.status(400).json({ error: 'bad_dir' });
  const name = dir.split('/').pop();
  if (REPO_SKIP.has(name)) return res.status(400).json({ error: 'reserved' });
  const targetHost = REPO_BASE + '/' + name;
  try { await stat(targetHost); return res.status(409).json({ error: 'exists' }); } catch {}
  try {
    const { stdout, stderr } = await sh('git', ['clone', url, targetHost], { timeout: 300000 });
    res.json({ ok: true, output: stdout + stderr });
  } catch (e) { res.status(500).json({ error: e.message, stdout: e.stdout || '', stderr: e.stderr || '' }); }
});

// --- Webhook auto-deploy ---
const stmtRepoCfgGet = db.prepare('SELECT * FROM repos_config WHERE name = ?');
const stmtRepoCfgUpsert = db.prepare(`INSERT INTO repos_config (name, webhook_enabled, webhook_secret) VALUES (?, 1, ?)
  ON CONFLICT(name) DO UPDATE SET webhook_secret = COALESCE(webhook_secret, excluded.webhook_secret)`);
const stmtRepoCfgUpdateStatus = db.prepare('UPDATE repos_config SET last_status = ?, last_status_ts = ?, last_log = ?, last_commit_before = COALESCE(?, last_commit_before) WHERE name = ?');
const stmtRepoCfgUpdateEnabled = db.prepare('UPDATE repos_config SET webhook_enabled = ? WHERE name = ?');
const stmtRepoCfgRegenSecret = db.prepare('UPDATE repos_config SET webhook_secret = ? WHERE name = ?');

function ensureRepoCfg(name) {
  let cfg = stmtRepoCfgGet.get(name);
  if (!cfg || !cfg.webhook_secret) {
    const secret = randomBytes(32).toString('hex');
    stmtRepoCfgUpsert.run(name, secret);
    cfg = stmtRepoCfgGet.get(name);
  }
  return cfg;
}

const runningDeploys = new Map();

// Boot cleanup: if backend died mid-deploy, status quedaria "running" forever
try {
  const stuck = db.prepare("UPDATE repos_config SET last_status = 'idle', last_status_ts = ? WHERE last_status = 'running'").run(Math.floor(Date.now() / 1000));
  if (stuck.changes > 0) console.log('[boot] cleared', stuck.changes, 'stuck running deploy(s)');
} catch (e) { console.error('[boot] clear stuck:', e.message); }

async function deployRepo(name) {
  if (runningDeploys.has(name)) return runningDeploys.get(name);
  const p = (async () => {
    const path = REPO_BASE + '/' + name;
    const log = [];
    const append = (s) => { log.push(s); if (log.join('\n').length > 64 * 1024) log.shift(); };
    let status = 'running';
    let lastCommit = null;
    try {
      const ts = Math.floor(Date.now() / 1000);
      // Save current commit hash for rollback
      try {
        const { stdout } = await sh('git', ['-C', path, 'rev-parse', 'HEAD']);
        lastCommit = stdout.trim();
      } catch {}
      stmtRepoCfgUpdateStatus.run('running', ts, log.join('\n'), lastCommit, name);

      append('[1/4] git pull --ff-only');
      try {
        const { stdout, stderr } = await sh('git', ['-C', path, 'pull', '--ff-only'], { timeout: 60000 });
        append(stdout + stderr);
        append('PULL OK');
      } catch (e) {
        append('PULL FAILED: ' + e.message + '\n' + (e.stderr || ''));
        status = 'pull_failed';
        throw e;
      }

      const composePath = path + '/docker-compose.yml';
      try { await stat(composePath); } catch {
        append('Sin docker-compose.yml, solo pull. Deploy considerado OK.');
        status = 'deployed';
        return;
      }

      append('[2/6] docker compose build (sin tocar prod)');
      try {
        const { stdout, stderr } = await sh('docker', ['compose', 'build'], { cwd: path, timeout: 300000, maxBuffer: 20 * 1024 * 1024 });
        append((stdout + stderr).slice(-3000));
        append('BUILD OK');
      } catch (e) {
        append('BUILD FAILED: ' + e.message + '\n' + (e.stderr || '').slice(-2000));
        status = 'build_failed';
        throw e;
      }

      // === BLUE-GREEN: test stack aislado ===
      const testProject = ('canary-' + name).toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
      const overridePath = '/tmp/compose-canary-' + name + '.yml';
      append('[3/6] generando override para test stack aislado (proyecto: ' + testProject + ')');
      let testServices = [];
      try {
        const { stdout } = await sh('docker', ['compose', 'config', '--services'], { cwd: path, timeout: 30000 });
        testServices = stdout.trim().split('\n').filter(Boolean);
        let yaml = 'services:\n';
        for (const svc of testServices) {
          yaml += '  ' + svc + ':\n';
          yaml += '    container_name: ' + testProject + '-' + svc + '\n';
          yaml += '    ports: !reset []\n';
        }
        await writeFile(overridePath, yaml);
        append('override services: ' + testServices.join(', '));
      } catch (e) {
        append('config failed: ' + e.message);
        status = 'build_failed';
        throw e;
      }

      append('[4/6] levantando test stack aislado');
      let testStackUp = false;
      try {
        try {
          const { stdout, stderr } = await sh('docker', ['compose', '-p', testProject, '-f', composePath, '-f', overridePath, 'up', '-d'], { cwd: path, timeout: 180000 });
          testStackUp = true;
          append((stdout + stderr).slice(-2000));
        } catch (e) {
          append('TEST UP FAILED: ' + e.message + '\n' + (e.stderr || '').slice(-2000));
          status = 'test_failed';
          throw e;
        }

        append('[5/6] esperando healthcheck test stack (90s)');
        const deadline = Date.now() + 90000;
        let testOk = false;
        while (Date.now() < deadline) {
          await new Promise(r => setTimeout(r, 5000));
          try {
            const { stdout } = await sh('docker', ['compose', '-p', testProject, '-f', composePath, '-f', overridePath, 'ps', '--format', 'json'], { cwd: path });
            const services = stdout.trim().split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
            if (!services.length) continue;
            const states = services.map(s => s.Name + '=' + s.State + (s.Health ? ('/' + s.Health) : ''));
            append('  test: ' + states.join(', '));
            if (services.find(s => s.Health === 'unhealthy')) { append('TEST UNHEALTHY'); break; }
            const bad = services.find(s => s.State !== 'running');
            if (!bad && services.every(s => !s.Health || s.Health === 'healthy')) { testOk = true; break; }
          } catch (e) { append('test ps err: ' + e.message); }
        }
        if (!testOk) { status = 'test_failed'; throw new Error('test stack unhealthy/timeout'); }
        append('TEST OK');
      } finally {
        // Siempre tirar test stack (haya pasado o fallado)
        if (testStackUp) {
          try {
            await sh('docker', ['compose', '-p', testProject, '-f', composePath, '-f', overridePath, 'down', '-t', '5'], { cwd: path, timeout: 60000 });
            append('test stack down OK');
          } catch (e) { append('test stack down err: ' + e.message); }
        }
        try { await import('node:fs/promises').then(m => m.unlink(overridePath)); } catch {}
      }

      // === SWAP PROD (rápido porque imagenes ya buildadas) ===
      append('[6/6] deploy producción: docker compose up -d');
      try {
        const { stdout, stderr } = await sh('docker', ['compose', 'up', '-d'], { cwd: path, timeout: 120000 });
        append(stdout + stderr);
      } catch (e) {
        append('PROD UP FAILED: ' + e.message + '\n' + (e.stderr || ''));
        status = 'test_failed';
        throw e;
      }

      // Esperar healthcheck prod rápido (test ya pasó)
      const prodDeadline = Date.now() + 60000;
      let prodOk = false;
      while (Date.now() < prodDeadline) {
        await new Promise(r => setTimeout(r, 3000));
        try {
          const { stdout } = await sh('docker', ['compose', 'ps', '--format', 'json'], { cwd: path });
          const services = stdout.trim().split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
          if (!services.length) continue;
          if (services.find(s => s.Health === 'unhealthy')) break;
          const bad = services.find(s => s.State !== 'running');
          if (!bad && services.every(s => !s.Health || s.Health === 'healthy')) { prodOk = true; break; }
        } catch {}
      }
      if (!prodOk) { status = 'test_failed'; throw new Error('prod healthcheck timeout'); }

      // Reload nginx para refrescar DNS de containers reiniciados
      try {
        await sh('docker', ['exec', 'nginx_reverse_proxy', 'nginx', '-s', 'reload'], { timeout: 10000 });
        append('nginx -s reload OK');
      } catch (e) { append('nginx reload warn: ' + e.message); }

      status = 'deployed';
      append('DEPLOY OK (zero/near-zero downtime)');
    } catch (e) {
      append('ERROR: ' + e.message);
      // Rollback if we know previous commit and we got past pull
      if (lastCommit && (status === 'test_failed' || status === 'build_failed')) {
        append('Rollback git reset --hard ' + lastCommit);
        try {
          await sh('git', ['-C', path, 'reset', '--hard', lastCommit], { timeout: 30000 });
          const composePath = path + '/docker-compose.yml';
          try {
            await stat(composePath);
            await sh('docker', ['compose', 'up', '-d', '--build'], { cwd: path, timeout: 300000 });
            append('Rollback up OK con commit anterior.');
          } catch {}
        } catch (re) { append('Rollback error: ' + re.message); }
      }
    } finally {
      const ts = Math.floor(Date.now() / 1000);
      stmtRepoCfgUpdateStatus.run(status, ts, log.join('\n'), null, name);
      runningDeploys.delete(name);
      // notify by email on test/build failure
      if (status === 'test_failed' || status === 'build_failed' || status === 'pull_failed') {
        transporter.sendMail({
          from: process.env.SMTP_FROM, to: process.env.NOTIFY_TO,
          subject: `[ViewerSoftware] Deploy ${status}: ${name}`,
          text: `Repo ${name} deploy fallo (${status}).\nLog (últimas líneas):\n` + log.slice(-30).join('\n')
        }).catch(() => {});
      }
    }
  })();
  runningDeploys.set(name, p);
  return p;
}

// Public webhook endpoint (HMAC-verified)
app.post('/api/webhooks/git/:name', async (req, res) => {
  const name = req.params.name;
  if (!validRepoName(name) || REPO_SKIP.has(name)) return res.status(404).json({ error: 'not_found' });
  const path = REPO_BASE + '/' + name;
  try { await stat(path + '/.git'); } catch { return res.status(404).json({ error: 'not_found' }); }
  const cfg = ensureRepoCfg(name);
  if (cfg.webhook_enabled !== 1) return res.json({ ok: true, ignored: 'webhook_disabled' });
  const sigHeader = req.headers['x-hub-signature-256'] || req.headers['x-gitlab-token'] || req.headers['x-gitea-signature'] || '';
  if (!sigHeader) return res.status(401).json({ error: 'missing_signature' });
  const raw = req.rawBody || Buffer.from('');
  // GitHub: "sha256=HEX". GitLab: token plain. Try sha256 first.
  const expectedHmac = 'sha256=' + createHmac('sha256', cfg.webhook_secret).update(raw).digest('hex');
  let ok = false;
  try {
    const a = Buffer.from(String(sigHeader));
    const b = Buffer.from(expectedHmac);
    if (a.length === b.length) ok = timingSafeEqual(a, b);
  } catch {}
  // Fallback: plain token equality (GitLab style)
  if (!ok && String(sigHeader) === cfg.webhook_secret) ok = true;
  if (!ok) return res.status(401).json({ error: 'bad_signature' });

  // Determine branch
  const body = req.body || {};
  const ref = body.ref || '';
  const pushedBranch = ref.startsWith('refs/heads/') ? ref.slice('refs/heads/'.length) : null;
  let repoBranch = null;
  try {
    const { stdout } = await sh('git', ['-C', path, 'rev-parse', '--abbrev-ref', 'HEAD']);
    repoBranch = stdout.trim();
  } catch {}
  if (pushedBranch && repoBranch && pushedBranch !== repoBranch) {
    return res.json({ ok: true, ignored: 'branch_mismatch', pushed: pushedBranch, current: repoBranch });
  }
  if (runningDeploys.has(name)) return res.status(409).json({ error: 'already_running' });
  // Fire-and-forget deploy
  deployRepo(name).catch(() => {});
  res.status(202).json({ ok: true, status: 'queued', repo: name });
});

// Repo config endpoints
app.get('/api/repos/:name/config', requireAuth, async (req, res) => {
  const name = req.params.name;
  if (!validRepoName(name) || REPO_SKIP.has(name)) return res.status(400).json({ error: 'bad_name' });
  const path = REPO_BASE + '/' + name;
  try { await stat(path + '/.git'); } catch { return res.status(404).json({ error: 'not_found' }); }
  const cfg = ensureRepoCfg(name);
  res.json({
    name,
    webhook_enabled: cfg.webhook_enabled === 1,
    has_secret: !!cfg.webhook_secret,
    webhook_url: 'https://viewer.edvardks.com/api/webhooks/git/' + name,
    last_status: cfg.last_status,
    last_status_ts: cfg.last_status_ts
  });
});

app.get('/api/repos/:name/config/secret', requireAdmin[0], requireAdmin[1], async (req, res) => {
  const name = req.params.name;
  if (!validRepoName(name) || REPO_SKIP.has(name)) return res.status(400).json({ error: 'bad_name' });
  const cfg = ensureRepoCfg(name);
  res.json({ secret: cfg.webhook_secret });
});

app.patch('/api/repos/:name/config', ...requireOp, async (req, res) => {
  const name = req.params.name;
  if (!validRepoName(name) || REPO_SKIP.has(name)) return res.status(400).json({ error: 'bad_name' });
  ensureRepoCfg(name);
  const { webhook_enabled, regen_secret } = req.body || {};
  if (typeof webhook_enabled === 'boolean') {
    stmtRepoCfgUpdateEnabled.run(webhook_enabled ? 1 : 0, name);
  }
  if (regen_secret === true) {
    const newSecret = randomBytes(32).toString('hex');
    stmtRepoCfgRegenSecret.run(newSecret, name);
  }
  const cfg = stmtRepoCfgGet.get(name);
  res.json({ ok: true, webhook_enabled: cfg.webhook_enabled === 1 });
});

app.get('/api/repos/:name/deploy-log', requireAuth, async (req, res) => {
  const name = req.params.name;
  if (!validRepoName(name) || REPO_SKIP.has(name)) return res.status(400).json({ error: 'bad_name' });
  const cfg = stmtRepoCfgGet.get(name);
  if (!cfg) return res.status(404).json({ error: 'no_log' });
  res.type('text/plain').send(cfg.last_log || '(sin deploy aún)');
});

// Manual deploy trigger (op+)
app.post('/api/repos/:name/deploy', ...requireOp, async (req, res) => {
  const name = req.params.name;
  if (!validRepoName(name) || REPO_SKIP.has(name)) return res.status(400).json({ error: 'bad_name' });
  const path = REPO_BASE + '/' + name;
  try { await stat(path + '/.git'); } catch { return res.status(404).json({ error: 'not_found' }); }
  if (runningDeploys.has(name)) return res.status(409).json({ error: 'already_running' });
  ensureRepoCfg(name);
  deployRepo(name).catch(() => {});
  res.status(202).json({ ok: true, status: 'queued' });
});

app.delete('/api/repos/:name', ...requireAdmin, async (req, res) => {
  const name = req.params.name;
  if (!validRepoName(name) || REPO_SKIP.has(name)) return res.status(400).json({ error: 'bad_name' });
  const path = REPO_BASE + '/' + name;
  if (!path.startsWith(REPO_BASE + '/')) return res.status(400).json({ error: 'bad_path' });
  try {
    await sh('rm', ['-rf', path], { timeout: 60000 });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Archivos: explorador + editor
const FILES_BLOCKED = new Set(['viewerSoftware', '.nginx', 'certbot', 'html', '.ollama']);
const FILE_NAME_RX = /^[a-zA-Z0-9_.@\-][a-zA-Z0-9_.@ \-]{0,254}$/;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function safePath(p) {
  if (typeof p !== 'string' || p.includes('\0')) return null;
  let clean = p;
  if (clean.startsWith('/var/www/')) clean = clean.slice('/var/www/'.length);
  else if (clean.startsWith('/host/www/')) clean = clean.slice('/host/www/'.length);
  else if (clean === '/var/www' || clean === '/host/www') clean = '';
  if (clean.startsWith('/')) clean = clean.slice(1);
  const resolved = path.resolve('/host/www', clean);
  if (resolved !== '/host/www' && !resolved.startsWith('/host/www/')) return null;
  const rel = resolved === '/host/www' ? '' : resolved.slice('/host/www/'.length);
  if (rel) {
    const first = rel.split('/')[0];
    if (FILES_BLOCKED.has(first)) return null;
  }
  return resolved;
}
function toPublicPath(realPath) {
  if (realPath === '/host/www') return '/var/www';
  return '/var/www/' + realPath.slice('/host/www/'.length);
}
async function isBinary(filePath) {
  try {
    const fd = await import('node:fs/promises').then(m => m.open(filePath, 'r'));
    const buf = Buffer.alloc(8192);
    const { bytesRead } = await fd.read(buf, 0, 8192, 0);
    await fd.close();
    return buf.slice(0, bytesRead).includes(0);
  } catch { return false; }
}

app.get('/api/files/ls', requireAuth, async (req, res) => {
  const real = safePath(req.query.path || '/var/www');
  if (!real) return res.status(400).json({ error: 'bad_path' });
  try {
    const entries = await readdir(real, { withFileTypes: true });
    const out = [];
    for (const e of entries) {
      if (real === '/host/www' && FILES_BLOCKED.has(e.name)) continue;
      try {
        const s = await stat(path.join(real, e.name));
        out.push({
          name: e.name,
          type: e.isDirectory() ? 'dir' : (e.isFile() ? 'file' : 'other'),
          size: s.size,
          mtime: s.mtime.toISOString(),
          mode: '0' + (s.mode & 0o777).toString(8)
        });
      } catch {}
    }
    out.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : (a.type === 'dir' ? -1 : 1)));
    res.json({ path: toPublicPath(real), entries: out, parent: real === '/host/www' ? null : toPublicPath(path.dirname(real)) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/files/read', requireAuth, async (req, res) => {
  const real = safePath(req.query.path || '');
  if (!real || real === '/host/www') return res.status(400).json({ error: 'bad_path' });
  try {
    const s = await stat(real);
    if (!s.isFile()) return res.status(400).json({ error: 'not_a_file' });
    if (s.size > MAX_FILE_BYTES) return res.status(413).json({ error: 'too_large', size: s.size, limit: MAX_FILE_BYTES });
    const bin = await isBinary(real);
    if (bin) return res.status(415).json({ error: 'binary', size: s.size });
    const content = await readFile(real, 'utf8');
    res.json({ path: toPublicPath(real), content, size: s.size, mtime: s.mtime.toISOString(), binary: false });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/files/write', ...requireOp, async (req, res) => {
  const { path: p, content } = req.body || {};
  const real = safePath(p || '');
  if (!real || real === '/host/www') return res.status(400).json({ error: 'bad_path' });
  if (typeof content !== 'string') return res.status(400).json({ error: 'content_must_be_string' });
  if (Buffer.byteLength(content, 'utf8') > MAX_FILE_BYTES) return res.status(413).json({ error: 'too_large' });
  // Validate filename
  const name = path.basename(real);
  if (!FILE_NAME_RX.test(name)) return res.status(400).json({ error: 'bad_name' });
  try {
    await writeFile(real, content, 'utf8');
    const s = await stat(real);
    res.json({ ok: true, path: toPublicPath(real), size: s.size });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/files/mkdir', ...requireOp, async (req, res) => {
  const real = safePath((req.body || {}).path || '');
  if (!real || real === '/host/www') return res.status(400).json({ error: 'bad_path' });
  const name = path.basename(real);
  if (!FILE_NAME_RX.test(name)) return res.status(400).json({ error: 'bad_name' });
  try {
    const { mkdir } = await import('node:fs/promises');
    await mkdir(real, { recursive: false });
    res.status(201).json({ ok: true, path: toPublicPath(real) });
  } catch (e) {
    if (e.code === 'EEXIST') return res.status(409).json({ error: 'exists' });
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/files/rename', ...requireOp, async (req, res) => {
  const { from, to } = req.body || {};
  const fromReal = safePath(from || '');
  const toReal = safePath(to || '');
  if (!fromReal || !toReal || fromReal === '/host/www' || toReal === '/host/www') return res.status(400).json({ error: 'bad_path' });
  const toName = path.basename(toReal);
  if (!FILE_NAME_RX.test(toName)) return res.status(400).json({ error: 'bad_name' });
  try {
    const { rename } = await import('node:fs/promises');
    await rename(fromReal, toReal);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/files', ...requireOp, async (req, res) => {
  const real = safePath((req.body && req.body.path) || req.query.path || '');
  if (!real || real === '/host/www') return res.status(400).json({ error: 'bad_path' });
  try {
    const s = await stat(real);
    const { rm } = await import('node:fs/promises');
    await rm(real, { recursive: s.isDirectory(), force: false });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// === Deploy Wizard (Spec 06) ===
const DEPLOY_RESERVED_NAMES = new Set(['viewerSoftware', '.nginx', 'certbot', 'html', '.ollama', 'backups', '.git']);
const DEPLOY_PHASES = ['validate', 'clone', 'env', 'detect', 'build', 'test', 'up', 'nginx', 'cert', 'webhook'];
const deployLocks = new Map(); // key: name OR domain -> deployId

const stmtDeployInsert = db.prepare('INSERT INTO deploys (id,ts,user,url,name,domain,upstream_port,email,skip_dns,staging_cert,phase,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
const stmtDeployUpdate = db.prepare('UPDATE deploys SET phase=?,status=?,error=?,finished_ts=?,webhook_secret=COALESCE(?,webhook_secret),rollback_done=COALESCE(?,rollback_done) WHERE id=?');
const stmtDeployGet = db.prepare('SELECT * FROM deploys WHERE id=?');
const stmtDeployList = db.prepare('SELECT id,ts,finished_ts,user,name,domain,phase,status,error FROM deploys ORDER BY ts DESC LIMIT ?');
const stmtLogInsert = db.prepare('INSERT INTO deploy_logs (deploy_id,seq,ts_ms,phase,level,message) VALUES (?,?,?,?,?,?)');
const stmtLogGet = db.prepare('SELECT seq,ts_ms,phase,level,message FROM deploy_logs WHERE deploy_id=? AND seq>? ORDER BY seq ASC LIMIT ?');

function deriveName(url) {
  const m = url.match(/\/([^/]+?)(?:\.git)?\/?$/);
  if (!m) return null;
  let n = m[1].toLowerCase().replace(/[^a-z0-9_.-]/g, '-').replace(/-+/g, '-').replace(/^[-_.]+|[-_.]+$/g, '');
  if (!/^[a-z]/.test(n)) n = 'app-' + n;
  return n.slice(0, 60);
}
function isReservedName(n) { return DEPLOY_RESERVED_NAMES.has(n); }
async function pathExistsAsync(p) { try { await stat(p); return true; } catch { return false; } }

async function parseMultipart(req, opts = {}) {
  const maxFile = opts.maxFile || 32 * 1024;
  return new Promise((resolve, reject) => {
    let bb;
    try { bb = Busboy({ headers: req.headers, limits: { fileSize: maxFile, files: 1, fields: 30, fieldNameSize: 64, fieldSize: 1024 } }); }
    catch (e) { return reject(e); }
    const fields = {};
    let fileContent = null;
    let fileTruncated = false;
    bb.on('field', (name, val) => { fields[name] = val; });
    bb.on('file', (name, stream, info) => {
      const chunks = [];
      let total = 0;
      stream.on('data', c => { total += c.length; if (total <= maxFile) chunks.push(c); });
      stream.on('limit', () => { fileTruncated = true; });
      stream.on('end', () => { fileContent = Buffer.concat(chunks).toString('utf8'); });
    });
    bb.on('finish', () => resolve({ fields, fileContent, fileTruncated }));
    bb.on('error', reject);
    req.pipe(bb);
  });
}

function sseSetup(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
}
function sseSend(res, event, data) {
  try {
    res.write('event: ' + event + '\n');
    res.write('data: ' + JSON.stringify(data) + '\n\n');
  } catch {}
}

async function runDeployPipeline(deployId, input, res) {
  const seq = { n: 0 };
  const append = (phase, level, message) => {
    seq.n++;
    try { stmtLogInsert.run(deployId, seq.n, Date.now(), phase, level, message.slice(0, 8000)); } catch {}
    if (res) sseSend(res, 'log', { phase, level, message, seq: seq.n });
  };
  const setPhase = (phase, status) => {
    stmtDeployUpdate.run(phase, status, null, null, null, null, deployId);
    if (res) sseSend(res, 'phase', { phase, status });
  };
  const fail = async (phase, error, rollbackHint) => {
    append(phase, 'error', error + (rollbackHint ? ' | rollback: ' + rollbackHint : ''));
    stmtDeployUpdate.run(phase, 'failed', error, Math.floor(Date.now() / 1000), null, null, deployId);
    if (res) sseSend(res, 'fail', { id: deployId, phase, error });
  };

  const { url, name, domain, upstream_port, email, skip_dns, staging_cert, env_content } = input;
  const path = '/host/www/' + name;
  const sitePath = '/host/nginx/sites-generated/' + domain + '.conf';
  const composePath = path + '/docker-compose.yml';
  let envWritten = false;
  let cloneDone = false;
  let nginxConfWritten = false;
  let containersUp = false;
  let canaryUp = false;
  const canaryProject = ('canary-' + name).toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
  const overridePath = '/tmp/compose-canary-' + deployId + '.yml';

  try {
    if (res) sseSend(res, 'start', { id: deployId, phases: DEPLOY_PHASES });

    // === validate (deep) ===
    setPhase('validate', 'running');
    append('validate', 'info', 'check git ls-remote');
    try {
      await sh('git', ['ls-remote', '--heads', '--quiet', url], { timeout: 30000 });
    } catch (e) { await fail('validate', 'url_unreachable: ' + (e.stderr || e.message).slice(-300)); return; }

    // Disk check
    try {
      const { stdout } = await sh('df', ['-B1', '/host/www']);
      const data = stdout.trim().split('\n').slice(1)[0];
      const avail = parseInt(data.split(/\s+/)[3]) || 0;
      if (avail < 2 * 1024 * 1024 * 1024) { await fail('validate', 'disk_full: <2GB free'); return; }
    } catch {}

    // DNS check
    if (!skip_dns) {
      try {
        const { stdout: dnsOut } = await sh('getent', ['ahostsv4', domain]);
        const resolved = dnsOut.trim().split(/\s+/)[0];
        const { stdout: selfIp } = await sh('curl', ['-s4', '--max-time', '5', 'ifconfig.me']).catch(() => ({ stdout: '' }));
        if (resolved && selfIp.trim() && resolved !== selfIp.trim()) {
          append('validate', 'warn', `DNS ${domain} -> ${resolved} != server ${selfIp.trim()}`);
          await fail('validate', 'dns_mismatch: ' + resolved + ' != ' + selfIp.trim()); return;
        }
        append('validate', 'info', 'DNS OK -> ' + resolved);
      } catch (e) { await fail('validate', 'dns_resolve_failed: ' + e.message); return; }
    }
    setPhase('validate', 'ok');

    // === clone ===
    setPhase('clone', 'running');
    try {
      const { stdout, stderr } = await sh('git', ['clone', '--depth', '1', '--single-branch', url, path], { timeout: 300000, maxBuffer: 10 * 1024 * 1024 });
      append('clone', 'info', (stdout + stderr).slice(-1500));
      cloneDone = true;
      try { await sh('chown', ['-R', '1000:1000', path]).catch(() => {}); } catch {}
    } catch (e) { await fail('clone', 'clone_failed: ' + (e.stderr || e.message).slice(-300)); return; }
    setPhase('clone', 'ok');

    // === env ===
    setPhase('env', 'running');
    let envSource = 'none';
    if (env_content && env_content.length > 0) {
      await writeFile(path + '/.env', env_content, { mode: 0o600 });
      envWritten = true; envSource = 'upload';
    } else if (await pathExistsAsync(path + '/.env.example')) {
      const ex = await readFile(path + '/.env.example', 'utf8');
      await writeFile(path + '/.env', ex, { mode: 0o600 });
      envWritten = true; envSource = 'example';
    } else if (await pathExistsAsync(composePath)) {
      try {
        const yaml = await readFile(composePath, 'utf8');
        const vars = Array.from(new Set([...yaml.matchAll(/\$\{([A-Z_][A-Z0-9_]*)\}/g)].map(m => m[1])));
        if (vars.length > 0) {
          const tpl = '# auto-generated, complete values\n' + vars.map(v => v + '=').join('\n') + '\n';
          await writeFile(path + '/.env', tpl, { mode: 0o600 });
          envWritten = true; envSource = 'generated';
        }
      } catch {}
    }
    append('env', 'info', 'source=' + envSource);
    setPhase('env', 'ok');

    // === detect ===
    setPhase('detect', 'running');
    let stack = null;
    if (await pathExistsAsync(composePath)) stack = 'compose';
    else if (await pathExistsAsync(path + '/compose.yml')) {
      stack = 'compose';
      // normalizar
      try { await sh('mv', [path + '/compose.yml', composePath]); } catch {}
    } else if (await pathExistsAsync(path + '/Dockerfile')) {
      stack = 'dockerfile_only';
      const tpl = `services:
  app:
    build: .
    container_name: ${name}_app
    restart: always
    env_file: [.env]
    expose:
      - "${upstream_port}"
    networks: [${name}_net, reverse_proxy]
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:${upstream_port}/ >/dev/null 2>&1 || curl -fsS http://127.0.0.1:${upstream_port}/ >/dev/null 2>&1 || exit 1"]
      interval: 15s
      timeout: 5s
      start_period: 30s
      retries: 5
networks:
  ${name}_net: { driver: bridge }
  reverse_proxy: { external: true }
`;
      await writeFile(composePath, tpl);
      append('detect', 'info', 'compose generado para Dockerfile-only');
    }
    if (!stack) { await fail('detect', 'no_stack: ni docker-compose.yml ni Dockerfile encontrado'); return; }
    try { await sh('docker', ['compose', 'config', '-q'], { cwd: path, timeout: 15000 }); }
    catch (e) { await fail('detect', 'compose_invalid: ' + (e.stderr || '').slice(-300)); return; }
    append('detect', 'info', 'stack=' + stack);
    setPhase('detect', 'ok');

    // === build ===
    setPhase('build', 'running');
    try {
      const { stdout, stderr } = await sh('docker', ['compose', 'build', '--pull'], { cwd: path, timeout: 600000, maxBuffer: 20 * 1024 * 1024 });
      append('build', 'info', (stdout + stderr).slice(-2000));
    } catch (e) { await fail('build', 'build_failed: ' + (e.stderr || e.message).slice(-500)); return; }
    setPhase('build', 'ok');

    // === test (canary blue-green) ===
    setPhase('test', 'running');
    try {
      const { stdout: svcOut } = await sh('docker', ['compose', 'config', '--services'], { cwd: path });
      const services = svcOut.trim().split('\n').filter(Boolean);
      let yaml = 'services:\n';
      for (const s of services) yaml += '  ' + s + ':\n    container_name: ' + canaryProject + '-' + s + '\n    ports: !reset []\n';
      await writeFile(overridePath, yaml);
      await sh('docker', ['compose', '-p', canaryProject, '-f', composePath, '-f', overridePath, 'up', '-d'], { cwd: path, timeout: 180000 });
      canaryUp = true;
      // Wait health
      const deadline = Date.now() + 90000;
      let testOk = false;
      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 5000));
        try {
          const { stdout } = await sh('docker', ['compose', '-p', canaryProject, '-f', composePath, '-f', overridePath, 'ps', '--format', 'json'], { cwd: path });
          const ss = stdout.trim().split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
          if (!ss.length) continue;
          append('test', 'info', ss.map(x => x.Name + '=' + x.State + (x.Health ? '/' + x.Health : '')).join(', '));
          if (ss.find(x => x.Health === 'unhealthy')) break;
          if (!ss.find(x => x.State !== 'running') && ss.every(x => !x.Health || x.Health === 'healthy')) { testOk = true; break; }
        } catch {}
      }
      if (!testOk) { await fail('test', 'test_unhealthy'); return; }
    } catch (e) { await fail('test', 'test_setup_failed: ' + (e.stderr || e.message).slice(-300)); return; }
    finally {
      if (canaryUp) {
        try { await sh('docker', ['compose', '-p', canaryProject, '-f', composePath, '-f', overridePath, 'down', '-t', '5', '-v'], { cwd: path, timeout: 60000 }); } catch {}
        try { await import('node:fs/promises').then(m => m.unlink(overridePath)); } catch {}
      }
    }
    setPhase('test', 'ok');

    // === up (prod real) ===
    setPhase('up', 'running');
    try {
      const { stdout, stderr } = await sh('docker', ['compose', 'up', '-d'], { cwd: path, timeout: 120000 });
      containersUp = true;
      append('up', 'info', (stdout + stderr).slice(-1500));
      // Wait health 60s
      const dl = Date.now() + 60000;
      let ok = false;
      while (Date.now() < dl) {
        await new Promise(r => setTimeout(r, 3000));
        try {
          const { stdout } = await sh('docker', ['compose', 'ps', '--format', 'json'], { cwd: path });
          const ss = stdout.trim().split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
          if (!ss.length) continue;
          if (!ss.find(x => x.State !== 'running') && ss.every(x => !x.Health || x.Health === 'healthy')) { ok = true; break; }
        } catch {}
      }
      if (!ok) { await fail('up', 'prod_unhealthy'); return; }
    } catch (e) { await fail('up', 'up_failed: ' + (e.stderr || e.message).slice(-300)); return; }
    setPhase('up', 'ok');

    // === nginx site ===
    setPhase('nginx', 'running');
    let targetContainer = `${name}_app`; // default para dockerfile_only
    if (stack === 'compose') {
      try {
        const { stdout: psOut } = await sh('docker', ['compose', 'ps', '--format', 'json'], { cwd: path });
        const ss = psOut.trim().split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
        if (ss.length === 1) targetContainer = ss[0].Name;
        else {
          // Heurística: primer servicio no db/redis
          const main = ss.find(x => !/db|redis|postgres|mysql|mariadb/i.test(x.Service || x.Name));
          if (main) targetContainer = main.Name;
        }
      } catch {}
    }
    append('nginx', 'info', 'upstream=' + targetContainer + ':' + upstream_port);

    const httpOnlyConf = `server {
    listen 80;
    listen [::]:80;
    server_name ${domain};
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
        default_type "text/plain";
    }
    location / { return 200 "pending-cert\\n"; default_type text/plain; }
}
`;
    try {
      await writeFile(sitePath, httpOnlyConf);
      nginxConfWritten = true;
      await sh('docker', ['exec', 'nginx_reverse_proxy', 'nginx', '-t']);
      await sh('docker', ['exec', 'nginx_reverse_proxy', 'nginx', '-s', 'reload']);
    } catch (e) { await fail('nginx', 'nginx_invalid: ' + (e.stderr || e.message).slice(-300)); return; }
    setPhase('nginx', 'ok');

    // === cert ===
    setPhase('cert', 'running');
    try {
      const certbotArgs = ['run', '--rm', '-v', '/etc/letsencrypt:/etc/letsencrypt', '-v', '/var/www/certbot:/var/www/certbot', 'certbot/certbot', 'certonly', '--webroot', '-w', '/var/www/certbot', '-d', domain, '--email', email, '--agree-tos', '--no-eff-email', '--non-interactive'];
      if (staging_cert) certbotArgs.push('--staging');
      const { stdout, stderr } = await sh('docker', certbotArgs, { timeout: 180000 });
      append('cert', 'info', (stdout + stderr).slice(-1500));
      try { await stat('/host/letsencrypt/live/' + domain + '/fullchain.pem'); }
      catch { await fail('cert', 'cert_not_created'); return; }
    } catch (e) { await fail('cert', 'cert_failed: ' + (e.stderr || e.message).slice(-500)); return; }

    // Write HTTPS conf
    const httpsConf = `server {
    listen 80;
    listen [::]:80;
    server_name ${domain};
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
        default_type "text/plain";
    }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name ${domain};

    ssl_certificate     /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    client_max_body_size 10m;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
        default_type "text/plain";
    }

    location / {
        proxy_pass http://${targetContainer}:${upstream_port};
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_read_timeout 120s;
    }
}
`;
    try {
      await writeFile(sitePath, httpsConf);
      await sh('docker', ['exec', 'nginx_reverse_proxy', 'nginx', '-t']);
      await sh('docker', ['exec', 'nginx_reverse_proxy', 'nginx', '-s', 'reload']);
    } catch (e) { await fail('cert', 'nginx_https_invalid: ' + (e.stderr || e.message).slice(-300)); return; }
    setPhase('cert', 'ok');

    // === webhook ===
    setPhase('webhook', 'running');
    const cfg = ensureRepoCfg(name);
    setPhase('webhook', 'ok');

    // === done ===
    stmtDeployUpdate.run('done', 'ok', null, Math.floor(Date.now() / 1000), cfg.webhook_secret, null, deployId);
    if (res) sseSend(res, 'done', {
      id: deployId,
      url: 'https://' + domain,
      webhook_url: 'https://viewer.edvardks.com/api/webhooks/git/' + name,
      webhook_secret: cfg.webhook_secret
    });
    // Notify SMTP
    transporter.sendMail({
      from: process.env.SMTP_FROM, to: process.env.NOTIFY_TO,
      subject: '[ViewerSoftware] Deploy OK: ' + name,
      text: 'Deploy completado.\nURL: https://' + domain + '\nWebhook: configura en GitHub con el secret mostrado en panel.'
    }).catch(() => {});
  } catch (e) {
    await fail('internal', 'internal_error: ' + e.message);
  } finally {
    deployLocks.delete(name);
    deployLocks.delete(domain);
    if (res) try { res.end(); } catch {}

    // Rollback si failed
    const row = stmtDeployGet.get(deployId);
    if (row && row.status === 'failed' && !row.rollback_done) {
      append('rollback', 'info', 'iniciando rollback');
      try {
        if (canaryUp) try { await sh('docker', ['compose', '-p', canaryProject, '-f', composePath, '-f', overridePath, 'down', '-t', '5', '-v'], { cwd: path }); } catch {}
        if (containersUp) try { await sh('docker', ['compose', 'down', '-t', '10', '-v'], { cwd: path, timeout: 60000 }); } catch {}
        if (nginxConfWritten) {
          try { await import('node:fs/promises').then(m => m.unlink(sitePath)); } catch {}
          try { await sh('docker', ['exec', 'nginx_reverse_proxy', 'nginx', '-s', 'reload']); } catch {}
        }
        if (cloneDone) try { await sh('rm', ['-rf', path], { timeout: 30000 }); } catch {}
        stmtDeployUpdate.run(row.phase, 'failed', row.error, Math.floor(Date.now() / 1000), null, 1, deployId);
        append('rollback', 'info', 'rollback OK');
      } catch (re) {
        append('rollback', 'error', 'rollback partial: ' + re.message);
      }
      // Email admin
      transporter.sendMail({
        from: process.env.SMTP_FROM, to: process.env.NOTIFY_TO,
        subject: '[ViewerSoftware] Deploy FAIL: ' + name,
        text: 'Deploy fallo en phase=' + row.phase + ': ' + row.error + '\nRollback ejecutado.'
      }).catch(() => {});
    }
  }
}

// Precheck endpoint (rápido, no inicia deploy)
app.get('/api/deploy/precheck', requireAuth, async (req, res) => {
  const domain = String(req.query.domain || '');
  const name = String(req.query.name || '');
  const out = { domain, name };
  if (domain) {
    out.domain_valid = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(domain);
    out.domain_available = out.domain_valid && !(await pathExistsAsync('/host/nginx/sites-generated/' + domain + '.conf'));
  }
  if (name) {
    out.name_valid = /^[a-z][a-z0-9_.-]{0,63}$/.test(name) && !isReservedName(name);
    out.path_available = out.name_valid && !(await pathExistsAsync('/host/www/' + name));
  }
  res.json(out);
});

// Inspecciona repo remoto (shallow clone temporal) y detecta stack + puerto
app.post('/api/deploy/inspect', requireAuth, async (req, res) => {
  const { url } = req.body || {};
  if (!/^(https?:\/\/[^\s@]+\.git|git@[^\s:]+:[^\s]+\.git)$/.test(url || '')) return res.status(400).json({ error: 'bad_url' });
  const tmp = '/tmp/inspect-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  try {
    await sh('git', ['clone', '--depth', '1', '--single-branch', url, tmp], { timeout: 60000, maxBuffer: 5 * 1024 * 1024 });
    const out = { has_compose: false, has_dockerfile: false, has_env_example: false, services: [], detected_ports: [], suggested_port: null, suggested_container: null };
    try { await stat(tmp + '/.env.example'); out.has_env_example = true; } catch {}

    let composePath = null;
    if (await pathExistsAsync(tmp + '/docker-compose.yml')) composePath = tmp + '/docker-compose.yml';
    else if (await pathExistsAsync(tmp + '/compose.yml')) composePath = tmp + '/compose.yml';

    if (composePath) {
      out.has_compose = true;
      const yaml = await readFile(composePath, 'utf8');
      // Parser ligero scan completo
      const services = [];
      let inServices = false;
      let current = null;
      for (const raw of yaml.split('\n')) {
        const line = raw.replace(/\r$/, '');
        if (/^services\s*:\s*$/.test(line)) { inServices = true; current = null; continue; }
        if (inServices && /^[a-zA-Z_]/.test(line)) { inServices = false; current = null; }
        if (!inServices) continue;
        const svcM = line.match(/^ {2}([a-zA-Z][a-zA-Z0-9_-]*)\s*:\s*$/);
        if (svcM) {
          current = { name: svcM[1], expose: [], ports: [], container_name: null, image: null, build: false, _ctx: null };
          services.push(current);
          continue;
        }
        if (!current) continue;
        const cn = line.match(/^ {4}container_name\s*:\s*([^\s#]+)/);
        if (cn) current.container_name = cn[1].replace(/['"]/g, '');
        const im = line.match(/^ {4}image\s*:\s*([^\s#]+)/);
        if (im) current.image = im[1].replace(/['"]/g, '');
        if (/^ {4}build\s*:/.test(line)) current.build = true;
        if (/^ {4}expose\s*:/.test(line)) { current._ctx = 'expose'; continue; }
        if (/^ {4}ports\s*:/.test(line)) { current._ctx = 'ports'; continue; }
        if (/^ {4}[a-zA-Z_]/.test(line)) current._ctx = null;
        if (current._ctx === 'expose') {
          const m = line.match(/^ {6,}-\s*['"]?(\d+)['"]?\s*$/);
          if (m) current.expose.push(parseInt(m[1]));
        }
        if (current._ctx === 'ports') {
          const m = line.match(/^ {6,}-\s*['"]?(?:\d+:)?(\d+)['"]?\s*$/);
          if (m) current.ports.push(parseInt(m[1]));
        }
      }
      // Heurística servicio principal: prefer frontend/web/app, fallback non-db
      const main = services.find(s => /^(frontend|front|web|app|nginx|client|ui)$/i.test(s.name))
                || services.find(s => !/db|redis|postgres|mysql|mariadb|memcached|worker|queue/i.test(s.name))
                || services[0];
      out.services = services.map(s => ({ name: s.name, container_name: s.container_name, expose: s.expose, ports: s.ports, image: s.image, has_build: s.build }));
      if (main) {
        out.suggested_container = main.container_name || (deriveName(url) + '_' + main.name);
        out.suggested_port = main.expose[0] || main.ports[0] || null;
        out.detected_ports = [...new Set([...main.expose, ...main.ports])];
      }
    } else if (await pathExistsAsync(tmp + '/Dockerfile')) {
      out.has_dockerfile = true;
      const df = await readFile(tmp + '/Dockerfile', 'utf8');
      const exposeMatches = [...df.matchAll(/^EXPOSE\s+(\d+)/gim)];
      out.detected_ports = exposeMatches.map(m => parseInt(m[1]));
      out.suggested_port = out.detected_ports[0] || null;
      out.suggested_container = deriveName(url) + '_app';
    }
    out.suggested_name = deriveName(url);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: 'inspect_failed', detail: (e.stderr || e.message).slice(-300) });
  } finally {
    try { await sh('rm', ['-rf', tmp], { timeout: 15000 }); } catch {}
  }
});

// Lista deploys
app.get('/api/deploys', requireAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50') || 50, 200);
  const status = req.query.status ? String(req.query.status) : null;
  try {
    if (status) {
      const rows = db.prepare('SELECT id,ts,finished_ts,user,name,domain,phase,status,error FROM deploys WHERE status=? ORDER BY ts DESC LIMIT ?').all(status, limit);
      return res.json(rows);
    }
    res.json(stmtDeployList.all(limit));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/deploys/:id', requireAuth, (req, res) => {
  const row = stmtDeployGet.get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json(row);
});
app.get('/api/deploys/:id/logs', requireAuth, (req, res) => {
  const since = parseInt(req.query.since_seq || '0') || 0;
  const limit = Math.min(parseInt(req.query.limit || '500'), 2000);
  const row = stmtDeployGet.get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json(stmtLogGet.all(req.params.id, since, limit));
});

// Endpoint principal SSE
const deployRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true,
  skip: (req) => { const ip = realIp(req); return ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.') || ip.startsWith('172.'); }
});
app.post('/api/deploy/new', ...requireOp, deployRateLimit, async (req, res) => {
  let parsed;
  try { parsed = await parseMultipart(req, { maxFile: 32 * 1024 }); }
  catch (e) { return res.status(400).json({ error: 'bad_multipart', detail: e.message }); }
  if (parsed.fileTruncated) return res.status(413).json({ error: 'env_too_large' });

  const f = parsed.fields;
  const url = String(f.url || '').trim();
  if (!/^(https?:\/\/[^\s@]+\.git|git@[^\s:]+:[^\s]+\.git)$/.test(url)) return res.status(400).json({ error: 'bad_url' });
  if (url.startsWith('git@') && !(await pathExistsAsync('/root/.ssh/asadorvps'))) return res.status(400).json({ error: 'ssh_key_missing' });

  let name = String(f.name || '').trim() || deriveName(url);
  if (!name) return res.status(400).json({ error: 'bad_name' });
  if (isReservedName(name)) return res.status(400).json({ error: 'reserved_name' });
  if (!/^[a-z][a-z0-9_.-]{0,63}$/.test(name)) return res.status(400).json({ error: 'bad_name' });

  const domain = String(f.domain || '').trim().toLowerCase();
  if (!/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(domain)) return res.status(400).json({ error: 'bad_domain' });

  const upstream_port = parseInt(f.upstream_port || '0');
  if (!Number.isInteger(upstream_port) || upstream_port < 1 || upstream_port > 65535) return res.status(400).json({ error: 'bad_port' });

  const email = (f.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) ? f.email : (process.env.DEFAULT_CERT_EMAIL || 'admin@example.com');
  const skip_dns = f.skip_dns === 'true' || f.skip_dns === '1';
  const staging_cert = f.staging_cert === 'true' || f.staging_cert === '1';

  // env upload check NULL byte
  if (parsed.fileContent && parsed.fileContent.includes('\0')) return res.status(400).json({ error: 'invalid_env' });

  // Pre-check sync
  if (await pathExistsAsync('/host/www/' + name)) return res.status(409).json({ error: 'path_in_use' });
  if (await pathExistsAsync('/host/nginx/sites-generated/' + domain + '.conf')) return res.status(409).json({ error: 'domain_in_use' });

  // Concurrency locks
  if (deployLocks.has(name) || deployLocks.has(domain)) return res.status(409).json({ error: 'concurrency_conflict' });
  if (deployLocks.size >= 5) { res.setHeader('Retry-After', '60'); return res.status(503).json({ error: 'too_many_deploys' }); }

  const id = randomUUID();
  deployLocks.set(name, id);
  deployLocks.set(domain, id);
  stmtDeployInsert.run(id, Math.floor(Date.now() / 1000), req.user.u, url, name, domain, upstream_port, email, skip_dns ? 1 : 0, staging_cert ? 1 : 0, 'queued', 'running');

  sseSetup(res);
  // Heartbeat to keep alive
  const hb = setInterval(() => { try { res.write(': keepalive\n\n'); } catch {} }, 30000);
  res.on('close', () => clearInterval(hb));

  runDeployPipeline(id, { url, name, domain, upstream_port, email, skip_dns, staging_cert, env_content: parsed.fileContent }, res)
    .catch(e => console.error('deploy pipe:', e.message))
    .finally(() => clearInterval(hb));
});

// Logs tail
app.get('/api/logs/tail', requireAuth, async (req, res) => {
  const source = String(req.query.source || '');
  const filter = String(req.query.filter || '').slice(0, 200);
  const limit = Math.min(parseInt(req.query.limit || '200', 10) || 200, 1000);
  try {
    let lines = [];
    if (source === 'nginx_access') {
      const { stdout } = await sh('docker', ['exec', 'nginx_reverse_proxy', 'sh', '-c', `tail -n ${limit * 3} /var/log/nginx/access.log`]);
      lines = stdout.split('\n').filter(Boolean);
    } else if (source.startsWith('container:')) {
      const name = source.slice('container:'.length);
      if (!/^[A-Za-z0-9_.-]+$/.test(name)) return res.status(400).json({ error: 'bad_container' });
      const { stdout, stderr } = await sh('docker', ['logs', '--tail', String(limit * 3), name]);
      lines = (stdout + stderr).split('\n').filter(Boolean);
    } else if (source.startsWith('stack:')) {
      const project = source.slice('stack:'.length);
      if (!/^[a-zA-Z0-9_.-]{1,80}$/.test(project)) return res.status(400).json({ error: 'bad_stack' });
      try {
        const { stdout: psOut } = await sh('docker', ['ps', '-a', '--filter', 'label=com.docker.compose.project=' + project, '--format', '{{.Names}}']);
        const containers = psOut.trim().split('\n').filter(Boolean);
        if (containers.length === 0) {
          return res.json({ source, filter, count: 0, lines: [] });
        }
        const perContainer = Math.max(20, Math.floor((limit * 3) / containers.length));
        const all = [];
        for (const cname of containers) {
          try {
            const { stdout, stderr } = await sh('docker', ['logs', '--tail', String(perContainer), cname]);
            const cls = (stdout + stderr).split('\n').filter(Boolean).map(l => '[' + cname + '] ' + l);
            all.push(...cls);
          } catch { }
        }
        lines = all;
      } catch (e) { return res.status(500).json({ error: e.message }); }
    } else {
      return res.status(400).json({ error: 'bad_source' });
    }
    if (filter) {
      const rx = new RegExp(filter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      lines = lines.filter(l => rx.test(l));
    }
    lines = lines.slice(-limit);
    res.json({ source, filter, count: lines.length, lines });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Users CRUD (admin only)
app.get('/api/users', requireAdmin, (_, res) => {
  res.json(usersState.users.map(u => ({
    user: u.user, role: u.role,
    totp_enabled: !!u.totp_secret,
    backup_codes_remaining: Array.isArray(u.backup_codes) ? u.backup_codes.filter(c => !c.used).length : 0
  })));
});

app.post('/api/users', requireAdmin, async (req, res) => {
  const { user, pass, role } = req.body || {};
  if (typeof user !== 'string' || !/^[a-z][a-z0-9_.-]{1,31}$/i.test(user)) return res.status(400).json({ error: 'bad username (1-31 alfanum)' });
  if (typeof pass !== 'string' || pass.length < 12) return res.status(400).json({ error: 'pass min 12 chars' });
  if (!ROLES.has(role)) return res.status(400).json({ error: 'role must be admin|operator|viewer' });
  if (findUser(user)) return res.status(409).json({ error: 'user already exists' });
  try {
    usersState.users.push({ user, role, hash: bcrypt.hashSync(pass, 12), totp_secret: null, backup_codes: null });
    await persistUsers();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:user', requireAdmin, async (req, res) => {
  const target = req.params.user;
  if (target === req.user.u) return res.status(400).json({ error: 'no self-delete' });
  const idx = usersState.users.findIndex(u => u.user === target);
  if (idx < 0) return res.status(404).json({ error: 'not found' });
  const remainingAdmins = usersState.users.filter((u, i) => u.role === 'admin' && i !== idx).length;
  if (remainingAdmins < 1) return res.status(400).json({ error: 'cannot remove last admin' });
  try {
    usersState.users.splice(idx, 1);
    await persistUsers();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/users/:user/role', requireAdmin, async (req, res) => {
  const { role } = req.body || {};
  if (!ROLES.has(role)) return res.status(400).json({ error: 'bad role' });
  const u = findUser(req.params.user);
  if (!u) return res.status(404).json({ error: 'not found' });
  if (u.role === 'admin' && role !== 'admin') {
    const adminCount = usersState.users.filter(x => x.role === 'admin').length;
    if (adminCount < 2) return res.status(400).json({ error: 'cannot demote last admin' });
  }
  try { u.role = role; await persistUsers(); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/system/stats', requireAuth, async (_, res) => {
  try {
    const [cpuinfo, meminfo, loadavg, uptime, statRaw] = await Promise.all([
      readFile('/host/proc/cpuinfo', 'utf8').catch(() => ''),
      readFile('/host/proc/meminfo', 'utf8'),
      readFile('/host/proc/loadavg', 'utf8'),
      readFile('/host/proc/uptime', 'utf8'),
      readFile('/host/proc/stat', 'utf8').catch(() => '')
    ]);
    const memKv = Object.fromEntries(meminfo.split('\n').filter(Boolean).map(l => {
      const [k, v] = l.split(':'); return [k.trim(), parseInt((v || '').trim().split(' ')[0]) || 0];
    }));
    const cpus = (cpuinfo.match(/^processor\s*:/gm) || []).length;
    const [l1, l5, l15] = loadavg.trim().split(/\s+/).map(parseFloat);
    const up = parseFloat(uptime.trim().split(/\s+/)[0]);
    const cpuLine = statRaw.split('\n').find(l => l.startsWith('cpu ')) || '';
    const cpuVals = cpuLine.split(/\s+/).slice(1).map(n => parseInt(n) || 0);
    res.json({
      cpu: { count: cpus, load: { '1': l1, '5': l5, '15': l15 }, raw: cpuVals },
      mem: { total: memKv.MemTotal * 1024, free: memKv.MemFree * 1024, available: memKv.MemAvailable * 1024, buffers: memKv.Buffers * 1024, cached: memKv.Cached * 1024 },
      uptime_s: up,
      ts: Date.now()
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/system/network', requireAuth, async (_, res) => {
  try {
    const text = await readFile('/host/proc/net/dev', 'utf8');
    const lines = text.split('\n').slice(2).filter(Boolean);
    const out = [];
    for (const l of lines) {
      const m = l.match(/^\s*(\S+):\s*(.+)$/);
      if (!m) continue;
      const iface = m[1];
      if (iface === 'lo' || iface.startsWith('veth') || iface.startsWith('br-') || iface.startsWith('docker')) continue;
      const v = m[2].trim().split(/\s+/).map(n => parseInt(n) || 0);
      out.push({ iface, rx_bytes: v[0], rx_packets: v[1], tx_bytes: v[8], tx_packets: v[9] });
    }
    res.json({ ts: Date.now(), interfaces: out });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/system/snapshot', requireAuth, async (_, res) => {
  try {
    const [meminfo, loadavg, cpuinfo, uptime] = await Promise.all([
      readFile('/host/proc/meminfo', 'utf8'),
      readFile('/host/proc/loadavg', 'utf8'),
      readFile('/host/proc/cpuinfo', 'utf8').catch(() => ''),
      readFile('/host/proc/uptime', 'utf8')
    ]);
    const memKv = Object.fromEntries(meminfo.split('\n').filter(Boolean).map(l => {
      const [k, v] = l.split(':'); return [k.trim(), parseInt((v || '').trim().split(' ')[0]) || 0];
    }));
    const cpus = (cpuinfo.match(/^processor\s*:/gm) || []).length;
    const [l1] = loadavg.trim().split(/\s+/).map(parseFloat);
    let containersCount = 0, sitesCount = 0, backupsCount = 0;
    try {
      const { stdout } = await sh('docker', ['ps', '-q']);
      containersCount = stdout.trim().split('\n').filter(Boolean).length;
    } catch {}
    try { sitesCount = (await readdir('/host/nginx/sites-generated')).filter(f => f.endsWith('.conf') && !f.includes('.bak')).length; } catch {}
    try { backupsCount = (await readdir('/host/backups')).filter(f => f.endsWith('.zip')).length; } catch {}
    let diskPct = 0;
    try {
      const { stdout } = await sh('df', ['-B1', '/']);
      const data = stdout.trim().split('\n').slice(1)[0];
      diskPct = parseInt(data.split(/\s+/)[4]) || 0;
    } catch {}
    res.json({
      cpu: { count: cpus, load_1: l1 },
      mem: { total: memKv.MemTotal * 1024, available: memKv.MemAvailable * 1024, used_pct: ((memKv.MemTotal - memKv.MemAvailable) / memKv.MemTotal) * 100 },
      disk: { used_pct: diskPct },
      uptime_s: parseFloat(uptime.trim().split(/\s+/)[0]),
      containers_count: containersCount,
      sites_count: sitesCount,
      backups_count: backupsCount,
      alerts_count: activeAlerts.size,
      ts: Date.now()
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/system/disk', requireAuth, async (_, res) => {
  try {
    const mounts = await readFile('/host/proc/mounts', 'utf8');
    const interesting = mounts.split('\n').filter(l => l.startsWith('/dev/'));
    const out = [];
    for (const line of interesting) {
      const [fs, mount] = line.split(/\s+/);
      try {
        const { stdout } = await sh('df', ['-B1', mount]);
        const data = stdout.trim().split('\n').slice(1)[0];
        if (!data) continue;
        const p = data.split(/\s+/);
        out.push({ fs, mount, total: +p[1], used: +p[2], avail: +p[3], usePct: parseInt(p[4]) });
      } catch {}
    }
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/system/top', requireAuth, async (_, res) => {
  try {
    const procs = await readdir('/host/proc');
    const pids = procs.filter(p => /^\d+$/.test(p)).slice(0, 500);
    const out = [];
    for (const pid of pids) {
      try {
        const [stat, status] = await Promise.all([
          readFile('/host/proc/' + pid + '/stat', 'utf8'),
          readFile('/host/proc/' + pid + '/status', 'utf8').catch(() => '')
        ]);
        const m = stat.match(/^(\d+)\s+\(([^)]+)\)\s+(\S+)\s+(.+)$/);
        if (!m) continue;
        const rest = m[4].split(/\s+/);
        const utime = +rest[11], stime = +rest[12];
        const rssLine = status.split('\n').find(l => l.startsWith('VmRSS:')) || '';
        const rss = parseInt((rssLine.match(/(\d+)/) || [])[1]) || 0;
        const userLine = status.split('\n').find(l => l.startsWith('Uid:')) || '';
        const uid = parseInt(userLine.split(/\s+/)[1]) || 0;
        out.push({ pid: +pid, comm: m[2], cpu_ticks: utime + stime, rss_kb: rss, uid });
      } catch {}
    }
    out.sort((a, b) => b.cpu_ticks - a.cpu_ticks);
    res.json(out.slice(0, 20));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/containers', requireAuth, async (_, res) => {
  try {
    const { stdout } = await sh('docker', ['ps', '-a', '--no-trunc', '--format', '{{json .}}']);
    const list = stdout.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
    // Parse Labels (Docker returns it as "k=v,k2=v2" string) → object
    // Enrich with StartedAt via single docker inspect (multi-arg)
    const ids = list.map(c => c.ID);
    let inspectMap = {};
    if (ids.length > 0) {
      try {
        const { stdout: insOut } = await sh('docker', ['inspect', '--format', '{{.Id}}|{{.State.StartedAt}}', ...ids]);
        for (const line of insOut.trim().split('\n')) {
          const [id, started] = line.split('|');
          if (id) inspectMap[id] = started;
        }
      } catch {}
    }
    for (const c of list) {
      const labelsObj = {};
      if (typeof c.Labels === 'string') {
        for (const pair of c.Labels.split(',')) {
          const i = pair.indexOf('=');
          if (i > 0) labelsObj[pair.slice(0, i)] = pair.slice(i + 1);
        }
      }
      c.Labels = labelsObj;
      c.StartedAt = inspectMap[c.ID] || c.CreatedAt || '';
    }
    res.json(list);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const SECRET_RX = /(PASS|SECRET|KEY|TOKEN|CREDENTIAL|PRIVATE)/i;
function redactEnv(envArr) {
  if (!Array.isArray(envArr)) return [];
  return envArr.map(e => {
    const idx = e.indexOf('=');
    if (idx < 0) return e;
    const k = e.slice(0, idx);
    return SECRET_RX.test(k) ? `${k}=***` : e;
  });
}

app.get('/api/containers/:name/inspect', requireAuth, async (req, res) => {
  const name = req.params.name;
  if (!/^[A-Za-z0-9_.-]+$/.test(name)) return res.status(400).json({ error: 'bad name' });
  try {
    const { stdout } = await sh('docker', ['inspect', name]);
    const arr = JSON.parse(stdout);
    if (!arr.length) return res.status(404).json({ error: 'not found' });
    const c = arr[0];
    res.json({
      Id: c.Id,
      Name: (c.Name || '').replace(/^\//, ''),
      Image: c.Config?.Image,
      Created: c.Created,
      State: {
        Status: c.State?.Status,
        Running: c.State?.Running,
        StartedAt: c.State?.StartedAt,
        Health: c.State?.Health?.Status
      },
      RestartCount: c.RestartCount,
      Mounts: (c.Mounts || []).map(m => ({ Type: m.Type, Source: m.Source, Destination: m.Destination, Mode: m.Mode, RW: m.RW })),
      Networks: Object.keys(c.NetworkSettings?.Networks || {}),
      PortBindings: c.HostConfig?.PortBindings || {},
      Env: redactEnv(c.Config?.Env),
      Cmd: c.Config?.Cmd,
      Healthcheck: c.Config?.Healthcheck || null
    });
  } catch (e) {
    if (/No such object/i.test(e.stderr || '')) return res.status(404).json({ error: 'not found' });
    res.status(500).json({ error: e.message, stderr: e.stderr });
  }
});

app.get('/api/audit', requireAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '100', 10) || 100, 500);
  try {
    const filters = [];
    const params = [];
    if (req.query.user) { filters.push('user = ?'); params.push(String(req.query.user)); }
    if (req.query.action) { filters.push('action LIKE ?'); params.push('%' + String(req.query.action) + '%'); }
    if (req.query.since) {
      const since = Math.floor(new Date(String(req.query.since)).getTime() / 1000);
      if (!isNaN(since)) { filters.push('ts >= ?'); params.push(since); }
    }
    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';
    const rows = db.prepare(`SELECT * FROM audit ${where} ORDER BY ts DESC LIMIT ?`).all(...params, limit);
    if (req.query.format === 'csv') {
      const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const header = 'id,ts,iso,user,action,target,ok,detail\n';
      const body = rows.map(r => [r.id, r.ts, new Date(r.ts * 1000).toISOString(), r.user, r.action, r.target, r.ok, r.detail].map(esc).join(',')).join('\n');
      res.type('text/csv').setHeader('Content-Disposition', 'attachment; filename="audit.csv"').send(header + body);
      return;
    }
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/containers/stats', requireAuth, async (_, res) => {
  try {
    const { stdout } = await sh('docker', ['stats', '--no-stream', '--format', '{{json .}}']);
    const list = stdout.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
    res.json(list);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Stack actions (docker compose down/up/restart at compose project level)
app.post('/api/stacks/:project/down', ...requireOp, async (req, res) => {
  const proj = req.params.project;
  if (!/^[a-zA-Z0-9_.-]{1,80}$/.test(proj)) return res.status(400).json({ error: 'bad_project' });
  if (proj === 'viewersoftware') return res.status(400).json({ error: 'no_self_down' });
  try {
    // Find config_files via inspect first running container of stack
    const { stdout: psOut } = await sh('docker', ['ps', '-a', '--filter', 'label=com.docker.compose.project=' + proj, '--format', '{{.ID}}']);
    const ids = psOut.trim().split('\n').filter(Boolean);
    if (ids.length === 0) return res.status(404).json({ error: 'no_containers' });
    const { stdout: insOut } = await sh('docker', ['inspect', '--format', '{{index .Config.Labels "com.docker.compose.project.config_files"}}|{{index .Config.Labels "com.docker.compose.project.working_dir"}}', ids[0]]);
    const [configFile, workingDir] = insOut.trim().split('|');
    if (!workingDir || workingDir === '<no value>') return res.status(500).json({ error: 'no_working_dir' });
    // Map host /var/www/... to /host/www/...
    const cwd = workingDir.replace(/^\/var\/www\//, '/host/www/');
    const { stdout, stderr } = await sh('docker', ['compose', 'down', '-t', '10'], { cwd, timeout: 60000 });
    res.json({ ok: true, project: proj, output: (stdout + stderr).slice(-2000) });
  } catch (e) { res.status(500).json({ error: e.message, stderr: (e.stderr || '').slice(-500) }); }
});

app.post('/api/stacks/:project/up', ...requireOp, async (req, res) => {
  const proj = req.params.project;
  if (!/^[a-zA-Z0-9_.-]{1,80}$/.test(proj)) return res.status(400).json({ error: 'bad_project' });
  try {
    const { stdout: psOut } = await sh('docker', ['ps', '-a', '--filter', 'label=com.docker.compose.project=' + proj, '--format', '{{.ID}}']);
    const ids = psOut.trim().split('\n').filter(Boolean);
    if (ids.length === 0) return res.status(404).json({ error: 'no_containers' });
    const { stdout: insOut } = await sh('docker', ['inspect', '--format', '{{index .Config.Labels "com.docker.compose.project.working_dir"}}', ids[0]]);
    const workingDir = insOut.trim();
    if (!workingDir || workingDir === '<no value>') return res.status(500).json({ error: 'no_working_dir' });
    const cwd = workingDir.replace(/^\/var\/www\//, '/host/www/');
    const { stdout, stderr } = await sh('docker', ['compose', 'up', '-d'], { cwd, timeout: 120000 });
    res.json({ ok: true, project: proj, output: (stdout + stderr).slice(-2000) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Docker system cleanup (admin only) — removes stopped containers, dangling images, unused networks
// Does NOT remove volumes (data safety)
app.post('/api/system/docker-prune', ...requireAdmin, async (_, res) => {
  try {
    const out = [];
    const c1 = await sh('docker', ['container', 'prune', '-f'], { timeout: 60000 }); out.push('containers: ' + c1.stdout.trim().split('\n').pop());
    const c2 = await sh('docker', ['image', 'prune', '-af'], { timeout: 120000 }); out.push('images: ' + c2.stdout.trim().split('\n').pop());
    const c3 = await sh('docker', ['network', 'prune', '-f'], { timeout: 30000 }); out.push('networks: ' + c3.stdout.trim().split('\n').pop());
    const c4 = await sh('docker', ['builder', 'prune', '-af'], { timeout: 120000 }); out.push('builder: ' + c4.stdout.trim().split('\n').pop());
    res.json({ ok: true, summary: out.join(' · '), details: out });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/containers/:name/logs', requireAuth, async (req, res) => {
  const name = req.params.name;
  if (!/^[A-Za-z0-9_.-]+$/.test(name)) return res.status(400).json({ error: 'bad name' });
  try {
    const tail = Math.min(parseInt(req.query.tail || '100', 10), 1000);
    const { stdout, stderr } = await sh('docker', ['logs', '--tail', String(tail), name]);
    res.type('text/plain').send(stdout + stderr);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const EXEC_ALLOWLIST = new Set(['uptime', 'ls /', 'ls /app', 'ps aux', 'df -h', 'env', 'cat /etc/hostname', 'date', 'free -h', 'id']);
app.get('/api/containers/exec/allowed', requireAuth, (_, res) => res.json([...EXEC_ALLOWLIST]));
app.post('/api/containers/:name/exec', ...requireOp, async (req, res) => {
  const name = req.params.name;
  if (!/^[A-Za-z0-9_.-]+$/.test(name)) return res.status(400).json({ error: 'bad name' });
  const { cmd } = req.body || {};
  if (typeof cmd !== 'string' || !EXEC_ALLOWLIST.has(cmd)) return res.status(400).json({ error: 'cmd not in allowlist' });
  try {
    const { stdout, stderr } = await sh('docker', ['exec', name, 'sh', '-c', cmd], { timeout: 15000 });
    res.json({ ok: true, stdout, stderr });
  } catch (e) { res.status(500).json({ error: e.message, stdout: e.stdout || '', stderr: e.stderr || '' }); }
});

app.post('/api/containers/:name/restart', ...requireOp, async (req, res) => {
  const name = req.params.name;
  if (!/^[A-Za-z0-9_.-]+$/.test(name)) return res.status(400).json({ error: 'bad name' });
  if (SELF_NAMES.has(name)) return res.status(400).json({ error: 'no self-restart' });
  try { await sh('docker', ['restart', name], { timeout: 60000 }); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sites', requireAuth, async (_, res) => {
  try {
    const dir = '/host/nginx/sites-generated';
    const files = (await readdir(dir)).filter(f => f.endsWith('.conf') && !f.includes('.bak'));
    const out = [];
    for (const f of files) {
      const domain = f.replace(/\.conf$/, '');
      let expiresAt = null;
      let issuedAt = null;
      try {
        const certPath = '/host/letsencrypt/live/' + domain + '/fullchain.pem';
        const { stdout } = await sh('openssl', ['x509', '-noout', '-dates', '-in', certPath]);
        const mEnd = stdout.match(/notAfter=(.+)/); if (mEnd) expiresAt = new Date(mEnd[1].trim()).toISOString();
        const mStart = stdout.match(/notBefore=(.+)/); if (mStart) issuedAt = new Date(mStart[1].trim()).toISOString();
      } catch { }
      const body = await readFile(path.join(dir, f), 'utf8');
      const upstream = (body.match(/proxy_pass\s+http:\/\/([^;\s]+)/) || [])[1] || null;
      out.push({ domain, upstream, issuedAt, expiresAt });
    }
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Traffic aggregated per domain (last N from nginx access log)
app.get('/api/sites/traffic/summary', requireAuth, async (req, res) => {
  const since = String(req.query.since || '1h');
  try {
    const { stdout } = await sh('docker', ['exec', 'nginx_reverse_proxy', 'sh', '-c', 'tail -n 5000 /var/log/nginx/access.log'], { maxBuffer: 20 * 1024 * 1024 });
    const lines = stdout.split('\n').filter(Boolean);
    // Parse: try to extract host from request via nginx default log format (no host included usually)
    // Workaround: scan sites-generated to get domain list; we tag each line by matching server_name later via Referer or Host header isn't in default log_format.
    // Strategy: count by source dir conf — read all sites and assume traffic is proportional to log lines containing referer with that domain OR HTTP host header.
    // Pragmatic: use Host from referer/request path lookups won't work without host. Fall back: count by 'X-Forwarded-Host' if present.
    // Better: parse status + assume single domain via server log. Default format doesn't show server_name. Use sum total + per-domain heuristic via referer host.
    const sites = (await readdir('/host/nginx/sites-generated')).filter(f => f.endsWith('.conf') && !f.includes('.bak')).map(f => f.replace(/\.conf$/, ''));
    const counts = {};
    for (const s of sites) counts[s] = 0;
    for (const l of lines) {
      // Try common patterns: "Host:" header or Referer host
      let match = false;
      for (const s of sites) {
        if (l.includes(' ' + s + ' ') || l.includes('//' + s + '/') || l.includes('//' + s + '"')) {
          counts[s] = (counts[s] || 0) + 1;
          match = true;
          break;
        }
      }
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const domains = Object.entries(counts)
      .map(([domain, count]) => ({ domain, count, pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0 }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count);
    res.json({ since, total, domains });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Pure functions exported for tests (mounted inline)
function composeQuality(yamlText) {
  const issues = [];
  const services = [];
  const networks = [];
  let inServices = false;
  let inNetworks = false;
  let current = null;
  let netCurrent = null;
  for (const raw of String(yamlText).split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (/^services\s*:\s*$/.test(line)) { inServices = true; inNetworks = false; current = null; continue; }
    if (/^networks\s*:\s*$/.test(line)) { inNetworks = true; inServices = false; netCurrent = null; continue; }
    if (/^[a-zA-Z_]/.test(line) && !/^(services|networks)\s*:/.test(line)) { inServices = false; inNetworks = false; }
    if (inServices) {
      const svcM = line.match(/^ {2}([a-zA-Z][a-zA-Z0-9_-]*)\s*:\s*$/);
      if (svcM) {
        current = { name: svcM[1], ports: [], hostPorts: [], networks: [], healthcheck: false, restart: false, _ctx: null };
        services.push(current);
        continue;
      }
      if (!current) continue;
      if (/^ {4}restart\s*:/.test(line)) current.restart = true;
      if (/^ {4}healthcheck\s*:/.test(line)) current.healthcheck = true;
      // Inline networks: must come BEFORE setting _ctx
      const inlineNets = line.match(/^ {4}networks\s*:\s*\[([^\]]+)\]/);
      if (inlineNets) {
        current.networks.push(...inlineNets[1].split(',').map(s => s.trim()).filter(Boolean));
        continue;
      }
      const inlinePorts = line.match(/^ {4}ports\s*:\s*\[([^\]]+)\]/);
      if (inlinePorts) {
        for (const p of inlinePorts[1].split(',').map(s => s.trim().replace(/['"]/g, ''))) {
          if (p.includes(':')) {
            const [h, c] = p.split(':');
            current.hostPorts.push(parseInt(h));
            current.ports.push(parseInt(c));
          } else { current.ports.push(parseInt(p)); }
        }
        continue;
      }
      if (/^ {4}ports\s*:\s*$/.test(line)) { current._ctx = 'ports'; continue; }
      if (/^ {4}networks\s*:\s*$/.test(line)) { current._ctx = 'networks'; continue; }
      if (/^ {4}[a-zA-Z_]/.test(line)) current._ctx = null;
      if (current._ctx === 'ports') {
        const m = line.match(/^ {6,}-\s*['"]?(\d+):(\d+)['"]?\s*$/);
        if (m) current.hostPorts.push(parseInt(m[1]));
        const m2 = line.match(/^ {6,}-\s*['"]?(\d+)['"]?\s*$/);
        if (m2) current.ports.push(parseInt(m2[1]));
      }
      if (current._ctx === 'networks') {
        const m = line.match(/^ {6,}-\s*([a-zA-Z0-9_-]+)\s*$/);
        if (m) current.networks.push(m[1]);
      }
    }
    if (inNetworks) {
      const nm = line.match(/^ {2}([a-zA-Z][a-zA-Z0-9_-]*)\s*:\s*$/);
      const nmInline = line.match(/^ {2}([a-zA-Z][a-zA-Z0-9_-]*)\s*:\s*\{[^}]*\}/);
      const nmExternal = line.match(/^ {2}([a-zA-Z][a-zA-Z0-9_-]*)\s*:\s*\{[^}]*external\s*:\s*true[^}]*\}/);
      if (nm) { netCurrent = { name: nm[1], external: false }; networks.push(netCurrent); continue; }
      if (nmInline) { netCurrent = { name: nmInline[1], external: /external\s*:\s*true/.test(line) }; networks.push(netCurrent); continue; }
      if (netCurrent && /^ {4}external\s*:\s*true/.test(line)) netCurrent.external = true;
    }
  }

  const isDb = (n) => /db|redis|postgres|mysql|mariadb|memcached|mongo/i.test(n);
  const isFrontal = (n) => /^(frontend|front|web|app|nginx|client|ui|api|backend)$/i.test(n);
  const frontal = services.find(s => isFrontal(s.name)) || services.find(s => !isDb(s.name)) || services[0];

  for (const s of services) {
    if (s.hostPorts.length > 0) issues.push({ rule: 'host_ports', severity: 'warn', service: s.name, fix: 'reset ports' });
    if (!s.restart) issues.push({ rule: 'no_restart', severity: 'warn', service: s.name, fix: "add restart: always" });
    if (isDb(s.name) && s.hostPorts.length > 0) issues.push({ rule: 'db_exposed', severity: 'error', service: s.name, fix: 'reset db ports' });
  }
  const hasReverseProxy = services.some(s => s.networks.includes('reverse_proxy'));
  const reverseProxyDeclared = networks.find(n => n.name === 'reverse_proxy' && n.external);
  if (!hasReverseProxy || !reverseProxyDeclared) {
    issues.push({ rule: 'no_reverse_proxy', severity: 'warn', service: frontal ? frontal.name : '', fix: 'add reverse_proxy external network on frontal' });
  }
  if (frontal && !frontal.healthcheck) {
    issues.push({ rule: 'no_healthcheck', severity: 'warn', service: frontal.name, fix: 'add healthcheck on ' + frontal.name });
  }
  return { issues, services, frontal: frontal ? frontal.name : null };
}

function generateOverride(qa, opts = {}) {
  const { issues, services, frontal } = qa;
  if (!issues.length) return '';
  const lines = ['# auto-generated by viewerSoftware deploy quality check', 'services:'];
  const byService = {};
  for (const i of issues) {
    if (!i.service) continue;
    byService[i.service] = byService[i.service] || [];
    byService[i.service].push(i.rule);
  }
  const allSvcs = new Set(Object.keys(byService));
  if (frontal && issues.find(i => i.rule === 'no_reverse_proxy')) allSvcs.add(frontal);
  for (const svc of allSvcs) {
    lines.push('  ' + svc + ':');
    const rules = byService[svc] || [];
    if (rules.includes('host_ports') || rules.includes('db_exposed')) {
      lines.push('    ports: !reset []');
    }
    if (rules.includes('no_restart')) {
      lines.push('    restart: always');
    }
    if (svc === frontal && issues.find(i => i.rule === 'no_reverse_proxy')) {
      lines.push('    networks:');
      lines.push('      - reverse_proxy');
    }
    if (svc === frontal && issues.find(i => i.rule === 'no_healthcheck')) {
      const port = opts.upstream_port || 3000;
      lines.push('    healthcheck:');
      lines.push('      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:' + port + '/ >/dev/null 2>&1 || curl -fsS http://127.0.0.1:' + port + '/ >/dev/null 2>&1 || exit 1"]');
      lines.push('      interval: 15s');
      lines.push('      timeout: 5s');
      lines.push('      start_period: 30s');
      lines.push('      retries: 5');
    }
  }
  if (issues.find(i => i.rule === 'no_reverse_proxy')) {
    lines.push('networks:');
    lines.push('  reverse_proxy:');
    lines.push('    external: true');
  }
  return lines.join('\n') + '\n';
}

app.post('/api/deploy/compose-quality', requireAuth, async (req, res) => {
  const yaml = (req.body && req.body.yaml) || '';
  if (typeof yaml !== 'string' || yaml.length === 0 || yaml.length > 200000) return res.status(400).json({ error: 'bad_yaml' });
  try {
    const qa = composeQuality(yaml);
    const override_yaml = generateOverride(qa, { upstream_port: req.body.upstream_port || 3000 });
    res.json({ issues: qa.issues, frontal: qa.frontal, override_yaml });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sites/:domain/conf', requireAuth, async (req, res) => {
  const domain = req.params.domain;
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) return res.status(400).json({ error: 'bad domain' });
  try {
    const text = await readFile('/host/nginx/sites-generated/' + domain + '.conf', 'utf8');
    res.type('text/plain').send(text);
  } catch (e) { res.status(404).json({ error: 'not found' }); }
});

app.put('/api/sites/:domain/conf', ...requireOp, async (req, res) => {
  const domain = req.params.domain;
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) return res.status(400).json({ error: 'bad domain' });
  const content = (req.body && req.body.content) || '';
  if (typeof content !== 'string' || content.length < 10 || content.length > 65536)
    return res.status(400).json({ error: 'content must be 10..65536 chars string' });
  if (!content.includes(domain))
    return res.status(400).json({ error: 'content must reference domain' });
  const confPath = '/host/nginx/sites-generated/' + domain + '.conf';
  let backup = null;
  try { backup = await readFile(confPath, 'utf8'); }
  catch (e) { return res.status(404).json({ error: 'site not found' }); }
  try {
    await writeFile(confPath, content);
    const { stdout, stderr } = await sh('docker', ['exec', 'nginx_reverse_proxy', 'nginx', '-t']);
    res.json({ ok: true, stdout, stderr });
  } catch (e) {
    try { await writeFile(confPath, backup); } catch {}
    res.status(400).json({ error: 'nginx -t failed (rollback applied)', stdout: e.stdout || '', stderr: e.stderr || e.message });
  }
});

app.get('/api/nginx/test', requireAuth, async (_, res) => {
  try {
    const { stdout, stderr } = await sh('docker', ['exec', 'nginx_reverse_proxy', 'nginx', '-t']);
    res.json({ ok: true, stdout, stderr });
  } catch (e) {
    res.json({ ok: false, stdout: e.stdout || '', stderr: e.stderr || e.message });
  }
});

app.post('/api/nginx/reload', ...requireOp, async (_, res) => {
  try {
    const { stdout, stderr } = await sh('docker', ['exec', 'nginx_reverse_proxy', 'nginx', '-s', 'reload']);
    res.json({ ok: true, stdout, stderr });
  } catch (e) { res.status(500).json({ error: e.message, stdout: e.stdout, stderr: e.stderr }); }
});

app.get('/api/sites/:domain/traffic', requireAuth, async (req, res) => {
  const domain = req.params.domain;
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) return res.status(400).json({ error: 'bad domain' });
  try {
    const { stdout } = await sh('docker', ['exec', 'nginx_reverse_proxy', 'sh', '-c', `grep -F " ${domain} " /var/log/nginx/access.log 2>/dev/null | tail -200 || tail -200 /var/log/nginx/access.log`]);
    const lines = stdout.trim().split('\n').filter(Boolean);
    const rx = /^(\S+)\s\S+\s\S+\s\[([^\]]+)\]\s"(\S+)\s(\S+)\s\S+"\s(\d+)\s(\d+)/;
    const events = [];
    for (const l of lines) {
      const m = l.match(rx);
      if (m) events.push({ ip: m[1], time: m[2], method: m[3], path: m[4], status: parseInt(m[5]), bytes: parseInt(m[6]) });
    }
    const statusCounts = events.reduce((a, e) => { a[e.status] = (a[e.status] || 0) + 1; return a; }, {});
    res.json({ count: events.length, statusCounts, events: events.slice(-50) });
  } catch (e) { res.status(500).json({ error: e.message, stderr: e.stderr }); }
});

app.post('/api/certs/renew-all', ...requireOp, async (_, res) => {
  try {
    const cmd = await sh('docker', ['run', '--rm', '-v', '/etc/letsencrypt:/etc/letsencrypt', '-v', '/var/www/certbot:/var/www/certbot', 'certbot/certbot', 'renew', '--webroot', '-w', '/var/www/certbot', '--non-interactive'], { timeout: 300000 });
    await sh('docker', ['exec', 'nginx_reverse_proxy', 'nginx', '-s', 'reload']);
    res.json({ ok: true, output: cmd.stdout + cmd.stderr });
  } catch (e) { res.status(500).json({ error: e.message, stdout: e.stdout, stderr: e.stderr }); }
});

app.post('/api/certs/issue', ...requireOp, async (req, res) => {
  const { domain, upstream, email } = req.body || {};
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain || '')) return res.status(400).json({ error: 'bad domain' });
  if (!/^[A-Za-z0-9_.-]+:[0-9]+$/.test(upstream || '')) return res.status(400).json({ error: 'bad upstream' });
  const em = email || DEFAULT_CERT_EMAIL;
  try {
    const { stdout, stderr } = await sh('bash', ['/host/nginx/add_site_and_cert.sh', domain, upstream, em], { timeout: 300000 });
    res.json({ ok: true, output: stdout + stderr });
  } catch (e) { res.status(500).json({ error: e.message, stdout: e.stdout, stderr: e.stderr }); }
});

app.get('/api/cron', requireAuth, async (_, res) => {
  try {
    const text = await readFile('/host/crontabs/root', 'utf8').catch(() => '');
    const lines = text.split('\n').map((line, i) => ({ i, raw: line, comment: line.trim().startsWith('#'), active: !line.trim().startsWith('#') && line.trim().length > 0 }));
    res.json(lines);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const CRON_SAFE_RX = /^([0-9*\/,\-]+\s+){4,5}[0-9*\/,\-]+\s+(\/var\/www\/\.nginx\/(renew_certs|backup_www)\.sh|@reboot\s+true)/;
app.put('/api/cron', ...requireOp, async (req, res) => {
  const { lines } = req.body || {};
  if (!Array.isArray(lines)) return res.status(400).json({ error: 'lines array required' });
  for (const l of lines) {
    if (typeof l !== 'string') return res.status(400).json({ error: 'each line must be string' });
    if (l.trim() === '' || l.trim().startsWith('#')) continue;
    if (!CRON_SAFE_RX.test(l)) return res.status(400).json({ error: 'unsafe cron line', line: l });
  }
  try {
    const body = lines.join('\n') + (lines[lines.length - 1] === '' ? '' : '\n');
    await writeFile('/host/crontabs/root', body, { mode: 0o600 });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/backups', requireAuth, async (_, res) => {
  try {
    const dir = '/host/backups';
    const files = (await readdir(dir)).filter(f => f.endsWith('.zip'));
    const out = await Promise.all(files.map(async f => {
      const s = await stat(path.join(dir, f));
      return { name: f, size: s.size, mtime: s.mtime.toISOString() };
    }));
    out.sort((a, b) => b.mtime.localeCompare(a.mtime));
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/scripts/allowed', requireAuth, (_, res) => res.json([...SCRIPT_ALLOWLIST]));
app.post('/api/scripts/run', ...requireOp, async (req, res) => {
  const { script } = req.body || {};
  if (!SCRIPT_ALLOWLIST.has(script)) return res.status(400).json({ error: 'script not in allowlist' });
  try {
    const { stdout, stderr } = await sh('bash', [script], { timeout: 600000 });
    res.json({ ok: true, output: stdout + stderr });
  } catch (e) { res.status(500).json({ error: e.message, stdout: e.stdout, stderr: e.stderr }); }
});

app.get('/api/system/history', requireAuth, (req, res) => {
  const range = String(req.query.range || '1h');
  const cfg = { '1h': { secs: 3600, bucket: 60 }, '6h': { secs: 6 * 3600, bucket: 300 }, '24h': { secs: 24 * 3600, bucket: 900 } }[range];
  if (!cfg) return res.status(400).json({ error: 'range must be 1h|6h|24h' });
  try {
    const since = Math.floor(Date.now() / 1000) - cfg.secs;
    const rows = db.prepare(`
      SELECT (ts / ?) * ? AS bucket_ts, AVG(cpu_load) AS cpu_load, AVG(mem_pct) AS mem_pct, AVG(disk_pct) AS disk_pct
      FROM samples WHERE ts >= ?
      GROUP BY bucket_ts ORDER BY bucket_ts ASC
    `).all(cfg.bucket, cfg.bucket, since);
    res.json({ range, bucket_s: cfg.bucket, samples: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/alerts/state', requireAuth, (_, res) => {
  res.json([...activeAlerts.values()]);
});

app.get('/api/alerts/log', requireAuth, (_, res) => {
  try { res.json(stmtRecentAlerts.all(50)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/notify', requireAuth, async (req, res) => {
  const { subject, text } = req.body || {};
  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM, to: process.env.NOTIFY_TO, subject: subject || 'ViewerSoftware', text: text || '' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Global Express error handler — captura cualquier throw no manejado en routes
app.use((err, req, res, next) => {
  console.error('[express error]', req.method, req.path, err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'internal_error' });
});

// 404 JSON
app.use((req, res) => res.status(404).json({ error: 'not_found', path: req.path }));

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, '0.0.0.0', () => console.log('viewer-backend listening on', PORT));
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 70000;
  sampleMetrics();
  setInterval(() => { sampleMetrics().catch(e => console.error('sample loop:', e.message)); }, 60000);
  // Graceful shutdown
  for (const sig of ['SIGTERM', 'SIGINT']) {
    process.on(sig, () => { console.log('[shutdown]', sig); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 5000); });
  }
}

export { app, JWT_SECRET, CRON_SAFE_RX, SCRIPT_ALLOWLIST };
