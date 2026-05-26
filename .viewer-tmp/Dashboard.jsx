import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';

const SELF = new Set(['viewer_backend', 'viewer_frontend']);

function MatrixCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    let w = c.width = window.innerWidth;
    let h = c.height = window.innerHeight;
    const fontSize = 16;
    let cols = Math.floor(w / fontSize);
    const drops = Array(cols).fill(0).map(() => Math.random() * -h / fontSize);
    const resize = () => {
      w = c.width = window.innerWidth; h = c.height = window.innerHeight;
      cols = Math.floor(w / fontSize);
      while (drops.length < cols) drops.push(Math.random() * -h / fontSize);
    };
    window.addEventListener('resize', resize);
    let raf;
    const draw = () => {
      ctx.fillStyle = 'rgba(13, 58, 35, 0.08)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = fontSize + 'px monospace';
      for (let i = 0; i < cols; i++) {
        const ch = Math.random() < 0.5 ? '0' : '1';
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillStyle = y > h - 40 ? '#bbcfb4' : '#58c896';
        ctx.globalAlpha = 0.65;
        ctx.fillText(ch, x, y);
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="fixed inset-0 w-full h-full" aria-hidden="true" />;
}

function MatrixTitle() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const original = document.title;
    let id = null;
    const cycle = () => {
      let s = '';
      for (let i = 0; i < 18; i++) s += Math.random() < 0.5 ? '0' : '1';
      document.title = s;
    };
    const onVis = () => {
      if (document.hidden) {
        if (!id) { cycle(); id = setInterval(cycle, 80); }
      } else {
        if (id) { clearInterval(id); id = null; }
        document.title = original;
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); if (id) clearInterval(id); document.title = original; };
  }, []);
  return null;
}

function Screensaver({ timeoutMs = 90000 }) {
  const [active, setActive] = useState(false);
  const lastActivity = useRef(Date.now());
  useEffect(() => {
    const bump = () => { lastActivity.current = Date.now(); };
    const evs = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll'];
    evs.forEach(e => window.addEventListener(e, bump, { passive: true }));
    const id = setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      setActive(prev => {
        if (!prev && idle >= timeoutMs) return true;
        return prev;
      });
    }, 2000);
    return () => { clearInterval(id); evs.forEach(e => window.removeEventListener(e, bump)); };
  }, [timeoutMs]);
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[60] bg-bone-900 cursor-pointer"
          onClick={() => { lastActivity.current = Date.now(); setActive(false); }}
          onTouchStart={() => { lastActivity.current = Date.now(); setActive(false); }}
        >
          <MatrixCanvas />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MobileActions({ onIssue, onRenew, onNginxTest, onNginxReload, busy }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative md:hidden">
      <button className="btn-ghost text-base" onClick={() => setOpen(v => !v)} aria-label="Acciones">⋯</button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 mt-2 card p-2 shadow-lg z-30 min-w-[180px]" onClick={() => setOpen(false)}>
            <button className="btn-ghost w-full justify-start sm:hidden" onClick={onNginxTest} disabled={busy === 'nginx-test'}>nginx -t</button>
            <button className="btn-ghost w-full justify-start sm:hidden" onClick={onNginxReload} disabled={busy === 'nginx-reload'}>nginx reload</button>
            <button className="btn-ghost w-full justify-start" onClick={onIssue}>Nuevo cert</button>
            <button className="btn-ghost w-full justify-start" onClick={onRenew} disabled={busy === 'renew'}>Renovar certs</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function bytes(n) {
  if (n == null) return '-';
  const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0; let x = n;
  while (x >= 1024 && i < u.length - 1) { x /= 1024; i++; }
  return x.toFixed(x < 10 ? 2 : 0) + ' ' + u[i];
}
function dur(s) {
  if (!s) return '-';
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return (d > 0 ? d + 'd ' : '') + h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
}

function useApi(url, interval) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  useEffect(() => {
    let cancel = false;
    let consecutiveErrors = 0;
    const controller = new AbortController();
    async function tick() {
      if (cancel) return;
      // Pause polling if tab hidden (saves CPU + avoid stale state)
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const r = await fetch(url, { credentials: 'include', signal: controller.signal });
        if (r.status === 401) { window.location.href = '/login'; return; }
        if (r.status === 403) {
          const j = await r.json().catch(() => ({}));
          if (j.error === 'access_denied') { window.location.href = '/access-denied'; return; }
        }
        const j = await r.json();
        if (!cancel) { setData(j); setErr(null); consecutiveErrors = 0; }
      } catch (e) {
        if (e.name === 'AbortError') return;
        if (!cancel) { setErr(e.message); consecutiveErrors++; }
      }
    }
    tick();
    let id = null;
    if (interval) {
      // Backoff: si hay errores consecutivos, espera más
      const scheduleNext = () => {
        const delay = consecutiveErrors > 0 ? Math.min(interval * Math.pow(2, consecutiveErrors), 5 * 60 * 1000) : interval;
        id = setTimeout(async () => { await tick(); if (!cancel) scheduleNext(); }, delay);
      };
      scheduleNext();
    }
    const onVisible = () => { if (!document.hidden) tick(); };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancel = true;
      controller.abort();
      if (id) clearTimeout(id);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible);
    };
  }, [url, interval, reloadTick]);
  return { data, err, reload: () => setReloadTick(t => t + 1) };
}

function Card({ children, title, action, help, delay = 0, className = '' }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      className={'card p-4 sm:p-5 ' + className}
    >
      {(title || action || help) && (
        <header className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <div className="flex items-center gap-1.5">
            <h2 className="font-semibold text-sm sm:text-base text-bone-800 dark:text-bone-100">{title}</h2>
            {help && (
              <span tabIndex="0" title={help} className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-bone-200 dark:bg-bone-700 text-bone-600 dark:text-bone-300 text-[10px] font-bold cursor-help select-none hover:bg-moss-200 dark:hover:bg-moss-800 transition">?</span>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </motion.section>
  );
}

function StatBar({ label, value, total, fmt = bytes }) {
  const pct = total ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-bone-600 dark:text-bone-300">
        <span>{label}</span>
        <span>{fmt(value)} / {fmt(total)} <span className="text-bone-400">({pct}%)</span></span>
      </div>
      <div className="h-2 rounded-full bg-bone-100 dark:bg-bone-700 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: pct + '%' }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full bg-moss-grad" />
      </div>
    </div>
  );
}

function Sparkline({ values, color = '#1f8a4e', height = 36 }) {
  const ref = useRef(null);
  const pathRef = useRef(null);
  useEffect(() => {
    if (!values || values.length < 2) return;
    const w = ref.current?.clientWidth || 200;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const span = (max - min) || 1;
    const step = w / (values.length - 1);
    const pts = values.map((v, i) => [i * step, height - ((v - min) / span) * (height - 4) - 2]);
    const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    if (pathRef.current) gsap.to(pathRef.current, { attr: { d }, duration: 0.6, ease: 'power2.out' });
  }, [values, height]);
  return (
    <svg ref={ref} width="100%" height={height} className="overflow-visible">
      <path ref={pathRef} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IssueCertForm({ onDone }) {
  const [domain, setDomain] = useState('');
  const [upstream, setUpstream] = useState('');
  const [email, setEmail] = useState('');
  const [out, setOut] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true); setOut('Solicitando...');
    try {
      const r = await fetch('/api/certs/issue', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ domain, upstream, email: email || undefined })
      });
      const j = await r.json();
      setOut(r.ok ? ('OK\n' + (j.output || '')) : ('ERROR: ' + (j.error || '') + '\n' + (j.stdout || '') + (j.stderr || '')));
      if (r.ok && onDone) onDone();
    } catch (e) { setOut('ERROR: ' + e.message); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input className="input" placeholder="dominio.com" value={domain} onChange={e => setDomain(e.target.value)} required />
        <input className="input" placeholder="container:puerto" value={upstream} onChange={e => setUpstream(e.target.value)} required />
        <input className="input" placeholder="email (opcional)" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <motion.button whileTap={{ scale: 0.98 }} disabled={busy} className="btn-primary">{busy ? 'Emitiendo…' : 'Solicitar cert'}</motion.button>
      {out && <pre className="text-xs bg-bone-100 dark:bg-bone-900 p-2 rounded-lg max-h-40 overflow-auto whitespace-pre-wrap">{out}</pre>}
    </form>
  );
}

function LogsModal({ name, onClose }) {
  const [text, setText] = useState('Cargando…');
  useEffect(() => {
    let cancel = false;
    async function load() {
      try {
        const r = await fetch('/api/containers/' + encodeURIComponent(name) + '/logs?tail=300', { credentials: 'include' });
        const t = await r.text();
        if (!cancel) setText(t || '(sin output)');
      } catch (e) { if (!cancel) setText('ERROR: ' + e.message); }
    }
    load();
    const id = setInterval(load, 5000);
    return () => { cancel = true; clearInterval(id); };
  }, [name]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        onClick={e => e.stopPropagation()}
        className="card w-full max-w-4xl max-h-[80vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-bone-200 dark:border-bone-700">
          <div>
            <div className="text-xs uppercase tracking-widest text-moss-700 dark:text-moss-300">logs (auto-refresh 5s)</div>
            <h3 className="font-semibold">{name}</h3>
          </div>
          <button className="btn-ghost" onClick={onClose}>Cerrar</button>
        </header>
        <pre className="p-4 text-xs overflow-auto flex-1 whitespace-pre-wrap text-bone-700 dark:text-bone-200">{text}</pre>
      </motion.div>
    </motion.div>
  );
}

function TwoFactorModal({ onClose, notify }) {
  const [status, setStatus] = useState(null);
  const [setup, setSetup] = useState(null);
  const [token, setToken] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch('/api/auth/2fa/status', { credentials: 'include' }).then(r => r.json()).then(setStatus);
  }, []);

  async function startSetup() {
    setBusy(true); setErr(null);
    try {
      const r = await fetch('/api/auth/2fa/setup', { credentials: 'include' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setSetup(j);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  const [backupCodes, setBackupCodes] = useState(null);
  async function enable() {
    setBusy(true); setErr(null);
    try {
      const r = await fetch('/api/auth/2fa/enable', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ secret: setup.secret, token })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      notify('2FA activado');
      if (j.backup_codes) setBackupCodes(j.backup_codes);
      else onClose();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true); setErr(null);
    try {
      const r = await fetch('/api/auth/2fa/disable', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pass })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      notify('2FA desactivado'); onClose();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="card max-w-md w-full p-6 space-y-4">
        <h3 className="font-semibold text-lg">2FA (TOTP)</h3>
        {!status && <div className="text-sm text-bone-500">Cargando…</div>}
        {status?.enabled && !setup && (
          <div className="space-y-3">
            <div className="text-sm">Estado: <span className="text-moss-700 dark:text-moss-300 font-medium">ACTIVO</span></div>
            <input className="input" type="password" placeholder="Contraseña actual" value={pass} onChange={e => setPass(e.target.value)} />
            <button className="btn-ghost w-full text-red-600 dark:text-red-400" disabled={busy} onClick={disable}>{busy ? '…' : 'Desactivar 2FA'}</button>
          </div>
        )}
        {backupCodes && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-amber-700 dark:text-amber-300">⚠ Guarda estos backup codes ahora. No se mostrarán de nuevo.</div>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs bg-bone-100 dark:bg-bone-900 p-3 rounded-xl">
              {backupCodes.map((c, i) => <div key={i}>{c}</div>)}
            </div>
            <button className="btn-primary w-full" onClick={() => { setBackupCodes(null); onClose(); }}>He guardado los codes</button>
          </div>
        )}
        {!status?.enabled && !setup && !backupCodes && (
          <div className="space-y-3">
            <div className="text-sm text-bone-500 dark:text-bone-400">2FA desactivado. Genera un secret y escanea con app (Authy, Google Authenticator, 1Password).</div>
            <button className="btn-primary w-full" disabled={busy} onClick={startSetup}>{busy ? '…' : 'Iniciar setup'}</button>
          </div>
        )}
        {setup && (
          <div className="space-y-3">
            {setup.qrDataUrl && <img src={setup.qrDataUrl} alt="QR" className="mx-auto rounded-xl border border-bone-200 dark:border-bone-700" />}
            <div className="text-xs">
              <div className="text-bone-500 dark:text-bone-400 mb-1">Secret (manual):</div>
              <div className="font-mono break-all bg-bone-100 dark:bg-bone-900 p-2 rounded-lg">{setup.secret}</div>
            </div>
            <input className="input font-mono tracking-widest text-center" inputMode="numeric" maxLength={6} placeholder="123456" value={token} onChange={e => setToken(e.target.value.replace(/\D/g, ''))} />
            <button className="btn-primary w-full" disabled={busy || token.length !== 6} onClick={enable}>{busy ? '…' : 'Activar'}</button>
          </div>
        )}
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="btn-ghost w-full" onClick={onClose}>Cerrar</button>
      </motion.div>
    </motion.div>
  );
}

function ChangePasswordModal({ onClose, notify }) {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setErr(null);
    if (newPass !== newPass2) { setErr('Las nuevas contraseñas no coinciden'); return; }
    if (newPass.length < 12) { setErr('Min 12 caracteres'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/auth/change-password', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ oldPass, newPass })
      });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || ('HTTP ' + r.status)); return; }
      notify('Contraseña actualizada. Vuelve a iniciar sesión.');
      setTimeout(() => { window.location.href = '/login'; }, 1200);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onClose}>
      <motion.form initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()} onSubmit={submit} className="card max-w-md w-full p-6 space-y-3">
        <h3 className="font-semibold text-lg">Cambiar contraseña</h3>
        <input className="input" type="password" placeholder="Contraseña actual" value={oldPass} onChange={e => setOldPass(e.target.value)} autoFocus />
        <input className="input" type="password" placeholder="Nueva (min 12)" value={newPass} onChange={e => setNewPass(e.target.value)} />
        <input className="input" type="password" placeholder="Repite nueva" value={newPass2} onChange={e => setNewPass2(e.target.value)} />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Cambiar'}</button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function HistoryChart() {
  const [range, setRange] = useState('1h');
  const [data, setData] = useState(null);
  const cpuRef = useRef(null);
  const memRef = useRef(null);

  useEffect(() => {
    let cancel = false;
    async function load() {
      try {
        const r = await fetch('/api/system/history?range=' + range, { credentials: 'include' });
        const j = await r.json();
        if (!cancel) setData(j);
      } catch {}
    }
    load();
    const id = setInterval(load, 30000);
    return () => { cancel = true; clearInterval(id); };
  }, [range]);

  useEffect(() => {
    if (!data?.samples?.length) return;
    const H = 140, W = 600;
    const samples = data.samples;
    const xs = samples.map(s => s.bucket_ts);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const spanX = (maxX - minX) || 1;
    function path(values, max) {
      const pts = samples.map((s, i) => {
        const x = ((s.bucket_ts - minX) / spanX) * W;
        const y = H - (values(s) / max) * (H - 8) - 4;
        return [x, y];
      });
      return pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    }
    const cpuMax = Math.max(...samples.map(s => s.cpu_load), 1);
    const memMax = 100;
    if (cpuRef.current) gsap.to(cpuRef.current, { attr: { d: path(s => s.cpu_load, cpuMax) }, duration: 0.6 });
    if (memRef.current) gsap.to(memRef.current, { attr: { d: path(s => s.mem_pct, memMax) }, duration: 0.6 });
  }, [data]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {['1h', '6h', '24h'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={'btn text-xs px-3 py-1 ' + (range === r ? 'btn-primary' : 'btn-ghost')}>{r}</button>
          ))}
        </div>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-moss-600 inline-block"></span> CPU load</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-moss-400 inline-block"></span> MEM %</span>
        </div>
      </div>
      <div className="w-full">
        <svg viewBox="0 0 600 140" className="w-full h-36">
          <path ref={memRef} fill="none" stroke="#58c896" strokeWidth="1.5" strokeOpacity="0.7" />
          <path ref={cpuRef} fill="none" stroke="#1f8a4e" strokeWidth="2" />
        </svg>
      </div>
      <div className="text-xs text-bone-500 dark:text-bone-400">
        {data ? `${data.samples.length} buckets · cada ${data.bucket_s}s` : 'Cargando…'}
      </div>
    </div>
  );
}

function AccessControlModal({ onClose, notify }) {
  const [ips, setIps] = useState(null);
  const [devices, setDevices] = useState(null);
  const [me, setMe] = useState(null);
  const [newIp, setNewIp] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [err, setErr] = useState(null);

  function load() {
    fetch('/api/access/ips', { credentials: 'include' }).then(r => r.json()).then(setIps);
    fetch('/api/access/devices', { credentials: 'include' }).then(r => r.json()).then(setDevices);
    fetch('/api/access/me', { credentials: 'include' }).then(r => r.json()).then(setMe);
  }
  useEffect(load, []);

  async function addIp(e) {
    e.preventDefault(); setErr(null);
    const r = await fetch('/api/access/ips', {
      method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ip: newIp, label: newLabel })
    });
    const j = await r.json();
    if (!r.ok) { setErr(j.error); return; }
    setNewIp(''); setNewLabel(''); notify('IP añadida'); load();
  }
  async function delIp(ip) {
    if (!confirm('Borrar IP ' + ip + '?')) return;
    const r = await fetch('/api/access/ips/' + encodeURIComponent(ip), { method: 'DELETE', credentials: 'include' });
    const j = await r.json();
    if (!r.ok) { notify('Error: ' + j.error); return; }
    notify('IP borrada'); load();
  }
  async function patchDev(id, body) {
    const r = await fetch('/api/access/devices/' + encodeURIComponent(id), {
      method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!r.ok) { notify('Error: ' + j.error); return; }
    notify('Device actualizado'); load();
  }
  async function delDev(id) {
    if (!confirm('Borrar device ' + id.slice(0, 12) + '?')) return;
    const r = await fetch('/api/access/devices/' + encodeURIComponent(id), { method: 'DELETE', credentials: 'include' });
    const j = await r.json();
    if (!r.ok) { notify('Error: ' + j.error); return; }
    notify('Device borrado'); load();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="card max-w-5xl w-full p-6 space-y-5 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Control de acceso</h3>
          <button className="btn-ghost" onClick={onClose}>Cerrar</button>
        </div>

        {me && (
          <div className="card p-3 text-xs">
            <div className="text-bone-500 dark:text-bone-400 mb-1">Tu acceso</div>
            <div>IP: <span className="font-mono">{me.ip}</span> · device: <span className="font-mono">{me.device_id ? me.device_id.slice(0, 12) + '…' : '—'}</span></div>
            <div className="mt-1">
              <span className={'text-xs px-2 py-0.5 rounded-full mr-2 ' + (me.ip_allowed ? 'bg-moss-600 text-white' : 'bg-bone-300 dark:bg-bone-700')}>IP {me.ip_allowed ? 'allowed' : 'no'}</span>
              <span className={'text-xs px-2 py-0.5 rounded-full ' + (me.device_approved ? 'bg-moss-600 text-white' : 'bg-bone-300 dark:bg-bone-700')}>Device {me.device_approved ? 'approved' : 'no'}</span>
            </div>
          </div>
        )}

        <section>
          <h4 className="font-medium mb-2">IPs autorizadas ({ips?.length ?? 0})</h4>
          <table className="w-full text-sm">
            <thead className="text-xs text-bone-500 dark:text-bone-400 text-left">
              <tr><th className="py-1">IP</th><th>Label</th><th>Añadido por</th><th>Cuando</th><th></th></tr>
            </thead>
            <tbody>
              {(ips || []).map(r => (
                <tr key={r.ip} className="border-t border-bone-100 dark:border-bone-700">
                  <td className="py-1.5 font-mono">{r.ip}</td>
                  <td>{r.label || '—'}</td>
                  <td className="text-bone-500 text-xs">{r.added_by}</td>
                  <td className="text-bone-500 text-xs">{new Date(r.ts * 1000).toLocaleString()}</td>
                  <td><button className="text-xs text-red-600 hover:underline" onClick={() => delIp(r.ip)}>borrar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <form onSubmit={addIp} className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-3">
            <input className="input text-sm" placeholder="IP (v4 o v6)" value={newIp} onChange={e => setNewIp(e.target.value)} required />
            <input className="input text-sm" placeholder="label (opcional)" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
            <button className="btn-primary text-sm">Añadir IP</button>
          </form>
        </section>

        <section>
          <h4 className="font-medium mb-2">Dispositivos ({devices?.length ?? 0})</h4>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-bone-500 dark:text-bone-400 text-left">
                <tr><th className="py-1">ID</th><th>Label</th><th>User</th><th>Aprobado</th><th>Last IP</th><th>UA</th><th>Last seen</th><th></th></tr>
              </thead>
              <tbody>
                {(devices || []).map(d => (
                  <tr key={d.id} className="border-t border-bone-100 dark:border-bone-700">
                    <td className="py-1.5 font-mono text-xs">{d.id.slice(0, 12)}…</td>
                    <td>
                      <input className="text-xs bg-transparent border-b border-bone-200 dark:border-bone-700 px-1 py-0.5 max-w-[120px]" defaultValue={d.label || ''} onBlur={e => { if (e.target.value !== (d.label || '')) patchDev(d.id, { label: e.target.value }); }} />
                    </td>
                    <td>{d.user || '—'}</td>
                    <td>
                      <button className={'text-xs px-2 py-0.5 rounded-full ' + (d.approved ? 'bg-moss-600 text-white' : 'bg-bone-300 dark:bg-bone-700')} onClick={() => patchDev(d.id, { approved: !d.approved })}>
                        {d.approved ? 'sí' : 'no'}
                      </button>
                    </td>
                    <td className="font-mono text-xs">{d.last_ip}</td>
                    <td className="text-xs truncate max-w-[160px]" title={d.ua}>{d.ua}</td>
                    <td className="text-xs text-bone-500">{d.last_seen ? new Date(d.last_seen * 1000).toLocaleString() : '—'}</td>
                    <td><button className="text-xs text-red-600 hover:underline" onClick={() => delDev(d.id)}>borrar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {err && <div className="text-sm text-red-600">{err}</div>}
      </motion.div>
    </motion.div>
  );
}

function UsersModal({ onClose, notify, currentUser }) {
  const [users, setUsers] = useState(null);
  const [nu, setNu] = useState({ user: '', pass: '', role: 'viewer' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    fetch('/api/users', { credentials: 'include' }).then(r => r.json()).then(j => {
      if (j.error) setErr(j.error); else setUsers(j);
    });
  }
  useEffect(load, []);

  async function add(e) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const r = await fetch('/api/users', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(nu)
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      notify('Usuario creado'); setNu({ user: '', pass: '', role: 'viewer' }); load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }
  async function changeRole(user, role) {
    const r = await fetch('/api/users/' + encodeURIComponent(user) + '/role', {
      method: 'PATCH', credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role })
    });
    const j = await r.json();
    if (!r.ok) { notify('Error: ' + j.error); return; }
    notify('Rol actualizado'); load();
  }
  async function del(user) {
    if (!confirm('Borrar usuario ' + user + '?')) return;
    const r = await fetch('/api/users/' + encodeURIComponent(user), { method: 'DELETE', credentials: 'include' });
    const j = await r.json();
    if (!r.ok) { notify('Error: ' + j.error); return; }
    notify('Usuario borrado'); load();
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="card max-w-3xl w-full p-6 space-y-4 max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Usuarios</h3>
          <button className="btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
        <table className="w-full text-sm">
          <thead className="text-bone-500 dark:text-bone-400 text-left text-xs">
            <tr><th className="py-1">Usuario</th><th>Rol</th><th>2FA</th><th>Backup codes</th><th></th></tr>
          </thead>
          <tbody>
            {(users || []).map(u => (
              <tr key={u.user} className="border-t border-bone-100 dark:border-bone-700">
                <td className="py-1.5 font-medium">{u.user}{u.user === currentUser && <span className="text-xs text-bone-400 ml-1">(tu)</span>}</td>
                <td>
                  <select className="text-xs bg-transparent border border-bone-200 dark:border-bone-700 rounded px-2 py-1" value={u.role} onChange={e => changeRole(u.user, e.target.value)}>
                    <option value="admin">admin</option>
                    <option value="operator">operator</option>
                    <option value="viewer">viewer</option>
                  </select>
                </td>
                <td>{u.totp_enabled ? '✓' : '—'}</td>
                <td className="text-xs">{u.backup_codes_remaining}</td>
                <td><button className="text-xs text-red-600 hover:underline disabled:opacity-30" disabled={u.user === currentUser} onClick={() => del(u.user)}>borrar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-4 border-t border-bone-200 dark:border-bone-700">
          <input className="input text-sm" placeholder="usuario" value={nu.user} onChange={e => setNu({ ...nu, user: e.target.value })} required />
          <input className="input text-sm" type="password" placeholder="pass (12+)" value={nu.pass} onChange={e => setNu({ ...nu, pass: e.target.value })} required />
          <select className="input text-sm" value={nu.role} onChange={e => setNu({ ...nu, role: e.target.value })}>
            <option value="viewer">viewer</option>
            <option value="operator">operator</option>
            <option value="admin">admin</option>
          </select>
          <button className="btn-primary text-sm" disabled={busy}>{busy ? '…' : 'Crear'}</button>
        </form>
        {err && <div className="text-sm text-red-600">{err}</div>}
      </motion.div>
    </motion.div>
  );
}

function DockerEventsCard() {
  const ev = useApi('/api/docker/events?since=1h', 60000);
  return (
    <div className="space-y-2">
      <div className="text-xs text-bone-500 dark:text-bone-400">{ev.data?.count ?? '—'} eventos · ultima hora{ev.data?.partial ? ' (parcial)' : ''}</div>
      <div className="overflow-auto max-h-64">
        <table className="w-full text-xs">
          <thead className="text-bone-500 dark:text-bone-400 text-left sticky top-0 bg-white/90 dark:bg-bone-800/90 backdrop-blur">
            <tr><th className="py-1">Cuando</th><th>Type</th><th>Action</th><th>Actor</th></tr>
          </thead>
          <tbody>
            {(ev.data?.events || []).slice().reverse().slice(0, 50).map((e, i) => {
              const tsMs = (e.timeNano ? e.timeNano / 1e6 : (e.time || 0) * 1000) || Date.now();
              const actor = e.Actor?.Attributes?.name || e.Actor?.ID?.slice(0, 12) || '—';
              return (
                <tr key={i} className="border-t border-bone-100 dark:border-bone-700">
                  <td className="py-1 whitespace-nowrap">{new Date(tsMs).toLocaleTimeString()}</td>
                  <td className="text-bone-600 dark:text-bone-300">{e.Type}</td>
                  <td className="font-mono">{e.Action}</td>
                  <td className="font-mono truncate max-w-[180px]">{actor}</td>
                </tr>
              );
            })}
            {ev.data && ev.data.events.length === 0 && <tr><td colSpan="4" className="py-2 text-bone-400 italic">Sin eventos</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NetworkCard() {
  const net = useApi('/api/system/network', 5000);
  const [history, setHistory] = useState({});
  useEffect(() => {
    if (!net.data) return;
    setHistory(prev => {
      const next = { ...prev };
      for (const iface of net.data.interfaces) {
        const prevSamples = next[iface.iface] || [];
        const last = prevSamples[prevSamples.length - 1];
        const dt = last ? (net.data.ts - last.ts) / 1000 : 1;
        const rxRate = last ? Math.max(0, (iface.rx_bytes - last.rx) / dt) : 0;
        const txRate = last ? Math.max(0, (iface.tx_bytes - last.tx) / dt) : 0;
        next[iface.iface] = [...prevSamples, { ts: net.data.ts, rx: iface.rx_bytes, tx: iface.tx_bytes, rxRate, txRate }].slice(-40);
      }
      return next;
    });
  }, [net.data?.ts]);
  return (
    <div className="space-y-4">
      {(net.data?.interfaces || []).map(iface => {
        const samples = history[iface.iface] || [];
        return (
          <div key={iface.iface} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-mono font-medium">{iface.iface}</span>
              <span className="text-xs text-bone-500 dark:text-bone-400">RX {bytes(iface.rx_bytes)} · TX {bytes(iface.tx_bytes)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-bone-500 dark:text-bone-400 mb-1">RX/s</div>
                <Sparkline values={samples.map(s => s.rxRate)} color="#1f8a4e" />
              </div>
              <div>
                <div className="text-xs text-bone-500 dark:text-bone-400 mb-1">TX/s</div>
                <Sparkline values={samples.map(s => s.txRate)} color="#58c896" />
              </div>
            </div>
          </div>
        );
      })}
      {!net.data && <div className="text-sm text-bone-500">Cargando…</div>}
    </div>
  );
}

function ExecModal({ name, onClose }) {
  const [allowed, setAllowed] = useState([]);
  const [cmd, setCmd] = useState('');
  const [out, setOut] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch('/api/containers/exec/allowed', { credentials: 'include' }).then(r => r.json()).then(setAllowed).catch(() => {});
  }, []);
  async function run() {
    if (!cmd) return;
    setBusy(true); setOut('…');
    try {
      const r = await fetch('/api/containers/' + encodeURIComponent(name) + '/exec', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cmd })
      });
      const j = await r.json();
      setOut((j.stdout || '') + (j.stderr ? '\n[stderr]\n' + j.stderr : ''));
    } catch (e) { setOut('ERROR: ' + e.message); }
    finally { setBusy(false); }
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="card w-full max-w-3xl max-h-[80vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-bone-200 dark:border-bone-700">
          <div>
            <div className="text-xs uppercase tracking-widest text-moss-700 dark:text-moss-300">exec (allowlist)</div>
            <h3 className="font-semibold">{name}</h3>
          </div>
          <button className="btn-ghost" onClick={onClose}>Cerrar</button>
        </header>
        <div className="p-4 space-y-3 flex-1 overflow-auto">
          <select className="input" value={cmd} onChange={e => setCmd(e.target.value)}>
            <option value="">— Elige comando —</option>
            {allowed.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn-primary" disabled={!cmd || busy} onClick={run}>{busy ? 'Ejecutando…' : 'Ejecutar'}</button>
          {out && <pre className="text-xs font-mono bg-bone-100 dark:bg-bone-900 p-3 rounded-xl max-h-80 overflow-auto whitespace-pre-wrap">{out}</pre>}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ContainerDetailModal({ name, onClose }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    fetch('/api/containers/' + encodeURIComponent(name) + '/inspect', { credentials: 'include' })
      .then(r => r.json()).then(j => { if (j.error) setErr(j.error); else setData(j); })
      .catch(e => setErr(e.message));
  }, [name]);
  const health = data?.State?.Health;
  const healthCls = health === 'healthy' ? 'bg-moss-600 text-white' : health === 'unhealthy' ? 'bg-red-600 text-white' : 'bg-bone-200 dark:bg-bone-700 text-bone-700 dark:text-bone-200';
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        onClick={e => e.stopPropagation()} className="card w-full max-w-4xl max-h-[85vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-bone-200 dark:border-bone-700">
          <div>
            <div className="text-xs uppercase tracking-widest text-moss-700 dark:text-moss-300">container</div>
            <h3 className="font-semibold flex items-center gap-3">{name}
              {health && <span className={'text-xs px-2 py-0.5 rounded-full ' + healthCls}>{health}</span>}
            </h3>
          </div>
          <button className="btn-ghost" onClick={onClose}>Cerrar</button>
        </header>
        <div className="p-4 overflow-auto flex-1 space-y-4 text-sm">
          {err && <div className="text-red-600">{err}</div>}
          {data && (
            <>
              <section>
                <div className="text-xs text-bone-500 dark:text-bone-400 mb-1">Imagen</div>
                <div className="font-mono text-xs break-all">{data.Image}</div>
              </section>
              <section>
                <div className="text-xs text-bone-500 dark:text-bone-400 mb-1">Estado</div>
                <div>{data.State?.Status} · started {new Date(data.State?.StartedAt).toLocaleString()} · restart count {data.RestartCount}</div>
              </section>
              <section>
                <div className="text-xs text-bone-500 dark:text-bone-400 mb-1">Networks ({data.Networks?.length})</div>
                <div className="flex flex-wrap gap-1">{(data.Networks || []).map(n => <span key={n} className="text-xs px-2 py-0.5 rounded-full bg-moss-100 dark:bg-moss-900/40 text-moss-800 dark:text-moss-200">{n}</span>)}</div>
              </section>
              <section>
                <div className="text-xs text-bone-500 dark:text-bone-400 mb-1">Mounts ({data.Mounts?.length})</div>
                <table className="w-full text-xs">
                  <thead className="text-bone-400 text-left"><tr><th className="py-1">Tipo</th><th>Origen</th><th>Destino</th><th>RW</th></tr></thead>
                  <tbody>
                    {(data.Mounts || []).map((m, i) => (
                      <tr key={i} className="border-t border-bone-100 dark:border-bone-700">
                        <td className="py-1">{m.Type}</td>
                        <td className="font-mono break-all">{m.Source}</td>
                        <td className="font-mono break-all">{m.Destination}</td>
                        <td>{m.RW ? 'rw' : 'ro'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
              <section>
                <div className="text-xs text-bone-500 dark:text-bone-400 mb-1">Env ({data.Env?.length}) — secretos enmascarados</div>
                <pre className="text-xs bg-bone-100 dark:bg-bone-900 p-3 rounded-xl overflow-auto max-h-48">{(data.Env || []).join('\n')}</pre>
              </section>
              {data.Healthcheck && (
                <section>
                  <div className="text-xs text-bone-500 dark:text-bone-400 mb-1">Healthcheck</div>
                  <pre className="text-xs bg-bone-100 dark:bg-bone-900 p-3 rounded-xl overflow-auto">{JSON.stringify(data.Healthcheck, null, 2)}</pre>
                </section>
              )}
            </>
          )}
          {!data && !err && <div className="text-bone-500">Cargando…</div>}
        </div>
      </motion.div>
    </motion.div>
  );
}

function AuditModal({ onClose }) {
  const [rows, setRows] = useState(null);
  const [fUser, setFUser] = useState('');
  const [fAction, setFAction] = useState('');
  const [fSince, setFSince] = useState('');
  function load() {
    const qs = new URLSearchParams({ limit: '200' });
    if (fUser) qs.set('user', fUser);
    if (fAction) qs.set('action', fAction);
    if (fSince) qs.set('since', new Date(fSince).toISOString());
    fetch('/api/audit?' + qs, { credentials: 'include' })
      .then(r => r.json()).then(setRows).catch(() => setRows([]));
  }
  useEffect(() => { load(); }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="card w-full max-w-4xl max-h-[85vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-bone-200 dark:border-bone-700">
          <h3 className="font-semibold">Auditoria ({rows?.length || 0})</h3>
          <div className="flex gap-2">
            <a href="/api/audit?format=csv&limit=500" className="btn-ghost text-sm">CSV</a>
            <button className="btn-ghost" onClick={onClose}>Cerrar</button>
          </div>
        </header>
        <div className="p-3 border-b border-bone-200 dark:border-bone-700 grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="input text-xs" placeholder="user" value={fUser} onChange={e => setFUser(e.target.value)} />
          <input className="input text-xs" placeholder="accion (LIKE)" value={fAction} onChange={e => setFAction(e.target.value)} />
          <input className="input text-xs" type="datetime-local" value={fSince} onChange={e => setFSince(e.target.value)} />
          <button className="btn-primary text-xs" onClick={load}>Filtrar</button>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-xs">
            <thead className="text-bone-500 dark:text-bone-400 text-left sticky top-0 bg-white/90 dark:bg-bone-800/90 backdrop-blur">
              <tr><th className="py-2 px-3">Cuando</th><th>Usuario</th><th>Accion</th><th>Target</th><th>OK</th></tr>
            </thead>
            <tbody>
              {(rows || []).map(r => (
                <tr key={r.id} className="border-t border-bone-100 dark:border-bone-700">
                  <td className="py-1.5 px-3 whitespace-nowrap">{new Date(r.ts * 1000).toLocaleString()}</td>
                  <td className="font-mono">{r.user}</td>
                  <td className="font-mono">{r.action}</td>
                  <td className="font-mono truncate max-w-[180px]">{r.target}</td>
                  <td className={r.ok ? 'text-moss-700 dark:text-moss-300' : 'text-red-600'}>{r.ok ? '✓' : '✗'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NginxConfModal({ domain, onClose }) {
  const [text, setText] = useState('Cargando…');
  useEffect(() => {
    let cancel = false;
    fetch('/api/sites/' + encodeURIComponent(domain) + '/conf', { credentials: 'include' })
      .then(r => r.text()).then(t => { if (!cancel) setText(t); })
      .catch(e => { if (!cancel) setText('ERROR: ' + e.message); });
    return () => { cancel = true; };
  }, [domain]);
  const highlighted = text.split('\n').map((line, i) => {
    let cls = '';
    if (/^\s*#/.test(line)) cls = 'text-bone-400 italic';
    else if (/^\s*(server|location|http|events)\s*[\{\s]/.test(line)) cls = 'text-moss-700 dark:text-moss-300 font-semibold';
    else if (/^\s*(listen|server_name|ssl_|proxy_|return|root|location|set_real_ip_from|real_ip_header|add_header|if|allow|deny)\b/.test(line)) cls = 'text-moss-700 dark:text-moss-400';
    return <div key={i} className={cls || 'text-bone-700 dark:text-bone-200'}>{line || ' '}</div>;
  });
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        onClick={e => e.stopPropagation()} className="card w-full max-w-4xl max-h-[80vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-bone-200 dark:border-bone-700">
          <div>
            <div className="text-xs uppercase tracking-widest text-moss-700 dark:text-moss-300">nginx conf</div>
            <h3 className="font-semibold">{domain}</h3>
          </div>
          <button className="btn-ghost" onClick={onClose}>Cerrar</button>
        </header>
        <pre className="p-4 text-xs overflow-auto flex-1 font-mono whitespace-pre">{highlighted}</pre>
      </motion.div>
    </motion.div>
  );
}

function NginxEditorModal({ domain, onClose, notify, onSaved }) {
  const [text, setText] = useState('');
  const [orig, setOrig] = useState('');
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);

  useEffect(() => {
    let cancel = false;
    fetch('/api/sites/' + encodeURIComponent(domain) + '/conf', { credentials: 'include' })
      .then(r => r.text()).then(t => { if (!cancel) { setText(t); setOrig(t); } })
      .catch(e => { if (!cancel) setOut({ ok: false, stderr: e.message }); });
    return () => { cancel = true; };
  }, [domain]);

  async function save() {
    setBusy(true); setOut(null);
    try {
      const r = await fetch('/api/sites/' + encodeURIComponent(domain) + '/conf', {
        method: 'PUT', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: text })
      });
      const j = await r.json();
      setOut({ ok: r.ok, stdout: j.stdout, stderr: j.stderr || j.error });
      if (r.ok) {
        setOrig(text);
        notify('Conf guardada. Recuerda hacer nginx reload.');
        if (onSaved) onSaved();
      }
    } catch (e) { setOut({ ok: false, stderr: e.message }); }
    finally { setBusy(false); }
  }

  const dirty = text !== orig;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="card w-full max-w-5xl max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-bone-200 dark:border-bone-700">
          <div>
            <div className="text-xs uppercase tracking-widest text-moss-700 dark:text-moss-300">editar nginx conf</div>
            <h3 className="font-semibold">{domain}</h3>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" disabled={!dirty || busy} onClick={() => setText(orig)}>Revertir</button>
            <button className="btn-primary" disabled={!dirty || busy} onClick={save}>{busy ? 'Validando…' : 'Guardar (con nginx -t)'}</button>
            <button className="btn-ghost" onClick={onClose}>Cerrar</button>
          </div>
        </header>
        <textarea
          spellCheck={false}
          className="input font-mono text-xs leading-relaxed flex-1 m-4 rounded-xl"
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ minHeight: '50vh' }}
        />
        {out && (
          <div className={'mx-4 mb-4 p-3 rounded-xl text-xs ' + (out.ok ? 'bg-moss-50 dark:bg-moss-900/30 text-moss-800 dark:text-moss-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200')}>
            <div className="font-semibold mb-1">{out.ok ? 'OK — nginx -t pasa. Recuerda hacer reload.' : 'Error — rollback aplicado'}</div>
            <pre className="whitespace-pre-wrap max-h-40 overflow-auto">{(out.stdout || '') + (out.stderr || '')}</pre>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onCancel}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="card max-w-md w-full p-6">
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-bone-600 dark:text-bone-300 mb-5 whitespace-pre-wrap">{message}</p>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn-primary" onClick={onConfirm}>Confirmar</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CronEditor({ initial, onSaved, notify }) {
  const initialText = (initial || []).map(l => l.raw).join('\n');
  const [text, setText] = useState(initialText);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => { setText(initialText); }, [initialText]);

  async function save() {
    setBusy(true); setErr(null); setConfirm(false);
    try {
      const lines = text.replace(/\r/g, '').split('\n');
      const r = await fetch('/api/cron', {
        method: 'PUT', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lines })
      });
      const j = await r.json();
      if (!r.ok) { setErr(j.error + (j.line ? (': ' + j.line) : '')); }
      else { notify('Crontab guardado'); onSaved?.(); }
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  const dirty = text !== initialText;

  return (
    <div className="space-y-3">
      <textarea
        spellCheck={false}
        className="input font-mono text-xs leading-relaxed h-48"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-bone-500 dark:text-bone-400">
          Solo se aceptan rutas de la allowlist (renew_certs.sh, backup_www.sh).
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" disabled={!dirty || busy} onClick={() => setText(initialText)}>Revertir</button>
          <button className="btn-primary" disabled={!dirty || busy} onClick={() => setConfirm(true)}>{busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </div>
      {err && <div className="text-sm text-red-600">{err}</div>}
      <AnimatePresence>
        {confirm && (
          <ConfirmModal
            title="Guardar crontab"
            message={"Vas a sobrescribir el crontab de root.\n\nSi alguna linea no esta en la allowlist sera rechazada y nada se aplicara."}
            onConfirm={save}
            onCancel={() => setConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TrafficPanel({ sites }) {
  const [domain, setDomain] = useState(null);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

  useEffect(() => {
    if (!domain) return;
    setBusy(true);
    fetch('/api/sites/' + encodeURIComponent(domain) + '/traffic', { credentials: 'include' })
      .then(r => r.json()).then(setData).catch(() => setData(null))
      .finally(() => setBusy(false));
  }, [domain]);

  const groups = (() => {
    if (!data?.statusCounts) return null;
    const g = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
    for (const [k, v] of Object.entries(data.statusCounts)) {
      const c = parseInt(k);
      if (c >= 200 && c < 300) g['2xx'] += v;
      else if (c >= 300 && c < 400) g['3xx'] += v;
      else if (c >= 400 && c < 500) g['4xx'] += v;
      else if (c >= 500) g['5xx'] += v;
    }
    return g;
  })();
  const total = groups ? Object.values(groups).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(sites || []).map(s => (
          <button key={s.domain} className={'btn ' + (domain === s.domain ? 'btn-primary' : 'btn-ghost') + ' text-xs px-3 py-1.5'}
            onClick={() => setDomain(s.domain)}>{s.domain}</button>
        ))}
      </div>
      {busy && <div className="text-sm text-bone-500">Cargando…</div>}
      {data && (
        <div className="space-y-3">
          <div className="text-xs text-bone-500 dark:text-bone-400">{data.count} eventos · ultimas 200 lineas</div>
          {groups && total > 0 && (
            <div className="space-y-1.5">
              {Object.entries(groups).map(([k, v]) => {
                const colors = { '2xx': '#1f8a4e', '3xx': '#58c896', '4xx': '#d97706', '5xx': '#dc2626' };
                const pct = (v / total) * 100;
                return (
                  <div key={k} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono">{k}</span>
                      <span className="text-bone-500">{v} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-bone-100 dark:bg-bone-700 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: pct + '%' }} transition={{ duration: 0.6 }} className="h-full" style={{ background: colors[k] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <button className="btn-ghost text-xs" onClick={() => setShowEvents(v => !v)}>
            {showEvents ? 'Ocultar' : 'Ver'} ultimos eventos ({data.events?.length || 0})
          </button>
          <AnimatePresence>
            {showEvents && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="overflow-auto max-h-64 text-xs font-mono">
                  <table className="w-full">
                    <thead className="text-bone-500 dark:text-bone-400 text-left">
                      <tr><th>IP</th><th>Method</th><th>Path</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {(data.events || []).slice().reverse().map((e, i) => (
                        <tr key={i} className="border-t border-bone-100 dark:border-bone-700">
                          <td className="py-1">{e.ip}</td>
                          <td>{e.method}</td>
                          <td className="truncate max-w-[200px]">{e.path}</td>
                          <td className={e.status >= 500 ? 'text-red-600' : e.status >= 400 ? 'text-amber-600' : 'text-moss-700 dark:text-moss-300'}>{e.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const v = localStorage.getItem('viewer_theme');
    if (v) return v === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('viewer_theme', dark ? 'dark' : 'light');
  }, [dark]);
  return [dark, setDark];
}

const TABS = [
  { id: 'dashboard', label: 'Resumen', icon: '📊', help: 'KPIs globales: sistema, disco, top procesos, red, historial, alertas, backups' },
  { id: 'nginx', label: 'Nginx', icon: '🌐', help: 'Sitios, tráfico por dominio, editor conf, nginx -t/reload' },
  { id: 'docker', label: 'Docker', icon: '🐳', help: 'Containers, eventos, logs, exec, restart' },
  { id: 'certs', label: 'Certificados', icon: '🔏', help: 'SSL Let\'s Encrypt: emisión, renovación, expiración' },
  { id: 'repos', label: 'Repositorios', icon: '📦', help: 'Git clone/pull de repos en /var/www' },
  { id: 'files', label: 'Archivos', icon: '📁', help: 'Explorador y editor de /var/www (sandbox)' },
  { id: 'logs', label: 'Logs', icon: '📜', help: 'Logs nginx + containers filtrables hot-time' },
  { id: 'profile', label: 'Perfil', icon: '👤', help: 'Cambiar contraseña, 2FA, control acceso, usuarios' }
];

function Sidebar({ tab, setTab, dark, setDark, alerts, logout, mobileOpen, setMobileOpen, collapsed, setCollapsed }) {
  const W = collapsed ? 'w-16' : 'w-64';
  return (
    <>
      <button className="md:hidden fixed bottom-4 right-4 z-40 btn-primary rounded-full w-12 h-12 shadow-lg" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">≡</button>
      <AnimatePresence>
        {(mobileOpen) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>
      <motion.aside
        initial={false}
        className={'fixed top-0 right-0 h-full z-40 p-3 border-l border-bone-200 dark:border-bone-700 bg-bone-50/95 dark:bg-bone-900/95 backdrop-blur transition-all duration-300 ' + W + ' ' + (mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0')}
      >
        <div className="flex items-start justify-between mb-4 gap-2">
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-[10px] uppercase tracking-widest text-moss-700 dark:text-moss-300 whitespace-nowrap">VPS Control</div>
              <div className="font-semibold text-base whitespace-nowrap">ViewerSoftware</div>
            </div>
          )}
          <button
            className="hidden md:inline-flex btn-ghost text-base p-1 px-2"
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            aria-label="toggle-sidebar"
          >{collapsed ? '«' : '»'}</button>
        </div>
        <nav className="space-y-1">
          {TABS.map(t => (
            <motion.button
              key={t.id}
              whileHover={{ x: -2 }}
              title={t.label + ' — ' + t.help}
              onClick={() => { setTab(t.id); setMobileOpen(false); }}
              className={'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition relative overflow-hidden ' + (tab === t.id ? 'bg-moss-grad text-white shadow' : 'hover:bg-bone-100 dark:hover:bg-bone-800 text-bone-700 dark:text-bone-200') + (collapsed ? ' justify-center' : '')}
            >
              <span className="text-lg">{t.icon}</span>
              {!collapsed && <span className="flex-1 text-left whitespace-nowrap">{t.label}</span>}
              {tab === t.id && !collapsed && <motion.span layoutId="tab-dot" className="w-1.5 h-1.5 rounded-full bg-white"/>}
            </motion.button>
          ))}
        </nav>
        <div className="absolute bottom-3 left-3 right-3 space-y-2">
          {alerts?.data && alerts.data.length > 0 && !collapsed && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xs text-red-600 dark:text-red-400 px-2">⚠ {alerts.data.length} alerta{alerts.data.length > 1 ? 's' : ''}</motion.div>
          )}
          {alerts?.data && alerts.data.length > 0 && collapsed && (
            <div title={alerts.data.length + ' alertas'} className="text-center text-red-600 dark:text-red-400">⚠</div>
          )}
          <div className={'flex gap-2 ' + (collapsed ? 'flex-col' : '')}>
            <button className="btn-ghost flex-1 text-base" title="Cambiar tema" onClick={() => setDark(v => !v)}>{dark ? '☀' : '☾'}</button>
            <button className="btn-ghost flex-1 text-sm" title="Cerrar sesion" onClick={logout}>{collapsed ? '⏻' : 'Salir'}</button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function StatusPill({ status }) {
  const map = {
    idle: { c: 'bg-bone-200 dark:bg-bone-700 text-bone-600 dark:text-bone-300', label: 'idle' },
    running: { c: 'bg-blue-500 text-white animate-pulse', label: 'running' },
    deployed: { c: 'bg-moss-600 text-white', label: 'deployed' },
    test_failed: { c: 'bg-red-600 text-white', label: 'test_failed' },
    build_failed: { c: 'bg-red-700 text-white', label: 'build_failed' },
    pull_failed: { c: 'bg-red-600 text-white', label: 'pull_failed' },
    pending: { c: 'bg-amber-500 text-white', label: 'pending' }
  };
  const m = map[status] || map.idle;
  return <span className={'text-xs px-2 py-0.5 rounded-full ' + m.c}>{m.label}</span>;
}

function WebhookModal({ name, isAdmin, notify, onClose }) {
  const [cfg, setCfg] = useState(null);
  const [secret, setSecret] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [busy, setBusy] = useState('');
  useEffect(() => {
    fetch('/api/repos/' + encodeURIComponent(name) + '/config', { credentials: 'include' }).then(r => r.json()).then(setCfg);
  }, [name]);
  async function loadSecret() {
    setBusy('secret');
    const r = await fetch('/api/repos/' + encodeURIComponent(name) + '/config/secret', { credentials: 'include' });
    const j = await r.json();
    setSecret(j.secret || null); setShowSecret(true); setBusy('');
  }
  async function regen() {
    if (!confirm('Regenerar secret? Tendrás que actualizar el webhook en GitHub/GitLab.')) return;
    setBusy('regen');
    const r = await fetch('/api/repos/' + encodeURIComponent(name) + '/config', {
      method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ regen_secret: true })
    });
    if (r.ok) { notify('Secret regenerado'); setSecret(null); setShowSecret(false); }
    setBusy('');
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); notify('Copiado'); } catch { notify('No se pudo copiar'); }
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="card max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">🔗 Webhook · {name}</h3>
          <button className="btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
        {!cfg && <div className="text-sm text-bone-500">Cargando…</div>}
        {cfg && (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-bone-500 dark:text-bone-400 mb-1">URL webhook</div>
              <div className="flex gap-2">
                <code className="font-mono text-xs bg-bone-100 dark:bg-bone-900 p-2 rounded-lg flex-1 break-all">{cfg.webhook_url}</code>
                <button className="btn-ghost text-xs" title="Copiar URL" onClick={() => copy(cfg.webhook_url)}>📋</button>
              </div>
            </div>
            <div>
              <div className="text-xs text-bone-500 dark:text-bone-400 mb-1">Secret (HMAC sha256)</div>
              {!showSecret && isAdmin && (
                <button className="btn-ghost text-xs" disabled={busy === 'secret'} onClick={loadSecret}>{busy === 'secret' ? '…' : 'Mostrar secret'}</button>
              )}
              {!isAdmin && <div className="text-xs text-bone-500">Solo admin puede ver el secret.</div>}
              {showSecret && secret && (
                <div className="flex gap-2">
                  <code className="font-mono text-xs bg-bone-100 dark:bg-bone-900 p-2 rounded-lg flex-1 break-all">{secret}</code>
                  <button className="btn-ghost text-xs" title="Copiar" onClick={() => copy(secret)}>📋</button>
                </div>
              )}
              {isAdmin && (
                <button className="text-xs text-amber-700 dark:text-amber-400 hover:underline mt-2" disabled={busy === 'regen'} onClick={regen}>{busy === 'regen' ? '…' : 'Regenerar secret'}</button>
              )}
            </div>
            <div className="text-xs text-bone-600 dark:text-bone-300 bg-bone-100 dark:bg-bone-900 p-3 rounded-xl">
              <div className="font-semibold mb-1">Configuración GitHub:</div>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Settings → Webhooks → Add webhook</li>
                <li>Payload URL: copia URL de arriba</li>
                <li>Content type: <code>application/json</code></li>
                <li>Secret: pega el secret</li>
                <li>Events: Just the push event</li>
                <li>Active: ✓</li>
              </ol>
            </div>
            <div className="text-xs">
              Estado: <StatusPill status={cfg.last_status || 'idle'} />
              {cfg.last_status_ts && <span className="ml-2 text-bone-500">{new Date(cfg.last_status_ts * 1000).toLocaleString()}</span>}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function DeployLogModal({ name, onClose }) {
  const [text, setText] = useState('Cargando…');
  useEffect(() => {
    fetch('/api/repos/' + encodeURIComponent(name) + '/deploy-log', { credentials: 'include' })
      .then(r => r.text()).then(setText).catch(e => setText('ERROR: ' + e.message));
  }, [name]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="card w-full max-w-4xl max-h-[80vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-bone-200 dark:border-bone-700">
          <h3 className="font-semibold">Deploy log · {name}</h3>
          <button className="btn-ghost" onClick={onClose}>Cerrar</button>
        </header>
        <pre className="p-4 text-xs font-mono overflow-auto flex-1 whitespace-pre-wrap">{text}</pre>
      </motion.div>
    </motion.div>
  );
}

function ReposTab({ notify, canWrite, isAdmin, setTab }) {
  const repos = useApi('/api/repos', 15000);
  const [cloneUrl, setCloneUrl] = useState('');
  const [cloneDir, setCloneDir] = useState('/var/www/');
  const [busy, setBusy] = useState('');
  const [out, setOut] = useState(null);
  const [logFor, setLogFor] = useState(null);
  const [logData, setLogData] = useState(null);
  const [webhookFor, setWebhookFor] = useState(null);
  const [deployLogFor, setDeployLogFor] = useState(null);

  async function pull(name) {
    setBusy('pull:' + name); setOut(null);
    try {
      const r = await fetch('/api/repos/' + encodeURIComponent(name) + '/pull', { method: 'POST', credentials: 'include' });
      const j = await r.json();
      setOut({ ok: r.ok, name, output: j.output || j.error || '' });
      notify(r.ok ? ('Pull OK: ' + name) : ('Error: ' + j.error));
      repos.reload();
    } catch (e) { notify('Error: ' + e.message); }
    finally { setBusy(''); }
  }
  async function clone(e) {
    e.preventDefault(); setBusy('clone'); setOut(null);
    try {
      const r = await fetch('/api/repos/clone', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: cloneUrl, dir: cloneDir }) });
      const j = await r.json();
      setOut({ ok: r.ok, name: cloneDir, output: j.output || j.error || (j.stderr || '') });
      if (r.ok) {
        notify('Clone OK · abriendo explorador en ' + cloneDir);
        try { localStorage.setItem('viewer_files_open', cloneDir); } catch {}
        setCloneUrl(''); setCloneDir('/var/www/'); repos.reload();
        if (setTab) setTimeout(() => setTab('files'), 600);
      }
      else notify('Error: ' + j.error);
    } catch (e) { notify('Error: ' + e.message); }
    finally { setBusy(''); }
  }
  async function del(name) {
    if (!confirm('Borrar repo ' + name + ' (rm -rf)?')) return;
    setBusy('del:' + name);
    try {
      const r = await fetch('/api/repos/' + encodeURIComponent(name), { method: 'DELETE', credentials: 'include' });
      const j = await r.json();
      notify(r.ok ? 'Repo borrado' : ('Error: ' + j.error));
      repos.reload();
    } catch (e) { notify('Error: ' + e.message); }
    finally { setBusy(''); }
  }
  async function loadLog(name) {
    setLogFor(name); setLogData(null);
    const r = await fetch('/api/repos/' + encodeURIComponent(name) + '/log', { credentials: 'include' });
    setLogData(await r.json());
  }

  async function toggleAuto(name, current) {
    setBusy('toggle:' + name);
    try {
      const r = await fetch('/api/repos/' + encodeURIComponent(name) + '/config', {
        method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ webhook_enabled: !current })
      });
      if (!r.ok) throw new Error('toggle');
      notify('Auto-deploy ' + (!current ? 'activado' : 'desactivado'));
      repos.reload();
    } catch (e) { notify('Error: ' + e.message); }
    finally { setBusy(''); }
  }

  async function triggerDeploy(name) {
    if (!confirm('Lanzar deploy manual de ' + name + ' (pull + build + healthcheck)?')) return;
    setBusy('deploy:' + name);
    try {
      const r = await fetch('/api/repos/' + encodeURIComponent(name) + '/deploy', { method: 'POST', credentials: 'include' });
      const j = await r.json();
      notify(r.ok ? 'Deploy en cola para ' + name : ('Error: ' + j.error));
      setTimeout(() => repos.reload(), 2000);
    } catch (e) { notify('Error: ' + e.message); }
    finally { setBusy(''); }
  }

  return (
    <div className="space-y-5">
      <Card title="Repositorios" help="Lista de repos git en /var/www/. Cada uno muestra rama actual, commits ahead/behind del upstream, archivos modificados (dirty) y último commit." action={<span className="text-xs text-bone-500">{repos.data?.length ?? 0}</span>}>
        <div className="overflow-auto">
          <table className="w-full text-sm min-w-[840px]">
            <thead className="text-xs text-bone-500 dark:text-bone-400 text-left">
              <tr>
                <th className="py-1" title="Nombre del repositorio (directorio en /var/www/)">Repo</th>
                <th title="Rama activa (git rev-parse --abbrev-ref HEAD)">Rama</th>
                <th title="Commits ahead/behind respecto al upstream">±</th>
                <th title="Archivos modificados sin commit (working tree)">Dirty</th>
                <th title="Hash + mensaje del último commit (git log -1)">Último commit</th>
                <th title="Última vez que se ejecutó fetch/pull (mtime de FETCH_HEAD)">Último pull</th>
                <th title="Auto-deploy ON: el webhook activa pull+build+healthcheck. OFF: ignora pushes.">Auto</th>
                <th title="Estado del último deploy (click para ver log completo)">Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(repos.data || []).map(r => (
                <motion.tr key={r.name} layout className="border-t border-bone-100 dark:border-bone-700">
                  <td className="py-1.5 font-medium" title={r.git_error || r.path}>{r.name}{r.git_error && <span className="ml-1 text-red-500" title={r.git_error}>⚠</span>}</td>
                  <td className="font-mono text-xs">{r.branch || '—'}</td>
                  <td className="text-xs whitespace-nowrap">↑{r.ahead || 0} ↓{r.behind || 0}</td>
                  <td className={'text-xs ' + (r.dirty > 0 ? 'text-amber-600' : 'text-bone-400')}>{r.dirty || 0}</td>
                  <td className="text-xs truncate max-w-[200px]" title={r.last_commit ? (r.last_commit.hash + ' ' + r.last_commit.author + ' · ' + r.last_commit.date + '\n' + r.last_commit.msg) : ''}>
                    {r.last_commit ? <><span className="font-mono text-moss-700 dark:text-moss-300">{r.last_commit.hash}</span> {r.last_commit.msg}</> : '—'}
                  </td>
                  <td className="text-xs whitespace-nowrap" title={r.last_pull || 'Nunca'}>{r.last_pull ? new Date(r.last_pull).toLocaleString() : '—'}</td>
                  <td>
                    <button
                      role="switch"
                      aria-checked={!!r.config?.webhook_enabled}
                      disabled={!canWrite || busy === 'toggle:' + r.name}
                      onClick={() => toggleAuto(r.name, !!r.config?.webhook_enabled)}
                      title={(r.config?.webhook_enabled ? 'Desactivar' : 'Activar') + ' auto-deploy en push'}
                      className={'relative inline-flex h-5 w-9 rounded-full transition ' + (r.config?.webhook_enabled ? 'bg-moss-600' : 'bg-bone-300 dark:bg-bone-700') + ' disabled:opacity-40'}
                    >
                      <motion.span layout className="block w-4 h-4 bg-white rounded-full shadow absolute top-0.5" animate={{ left: r.config?.webhook_enabled ? '1.125rem' : '0.125rem' }} />
                    </button>
                  </td>
                  <td>
                    <button title="Ver log completo del último deploy" onClick={() => setDeployLogFor(r.name)} className="hover:opacity-80">
                      <StatusPill status={r.config?.last_status || 'idle'} />
                    </button>
                  </td>
                  <td className="text-xs flex gap-1.5 sm:gap-2 whitespace-nowrap">
                    <button title="Ver historial git log -20" className="text-moss-700 dark:text-moss-300 hover:underline" onClick={() => loadLog(r.name)}>log</button>
                    {canWrite && <button title="git pull --ff-only" disabled={busy === 'pull:' + r.name} className="text-moss-700 dark:text-moss-300 hover:underline disabled:opacity-40" onClick={() => pull(r.name)}>{busy === 'pull:' + r.name ? '…' : 'pull'}</button>}
                    {canWrite && <button title="Deploy manual (pull + build + healthcheck)" disabled={busy === 'deploy:' + r.name} className="text-amber-700 dark:text-amber-400 hover:underline disabled:opacity-40" onClick={() => triggerDeploy(r.name)}>{busy === 'deploy:' + r.name ? '…' : '🚀'}</button>}
                    <button title="Webhook URL + secret" className="text-moss-700 dark:text-moss-300 hover:underline" onClick={() => setWebhookFor(r.name)}>🔗</button>
                    {isAdmin && <button title="rm -rf (PELIGRO)" className="text-red-600 hover:underline" onClick={() => del(r.name)}>✕</button>}
                  </td>
                </motion.tr>
              ))}
              {repos.data && repos.data.length === 0 && <tr><td colSpan="9" className="py-3 text-center text-bone-400 italic">No hay repos git en /var/www/. Usa 'Clonar nuevo' abajo.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {canWrite && (
        <Card title="Clonar nuevo" help="Clona repo git en /var/www/<nombre>. URL acepta https://...git o git@...git. Timeout 5 min.">
          <form onSubmit={clone} className="space-y-3">
            <input className="input text-sm" placeholder="URL git (https://github.com/user/repo.git)" value={cloneUrl} onChange={e => setCloneUrl(e.target.value)} required />
            <input className="input text-sm" placeholder="/var/www/destino" value={cloneDir} onChange={e => setCloneDir(e.target.value)} required />
            <button className="btn-primary" disabled={busy === 'clone'}>{busy === 'clone' ? 'Clonando…' : 'Clonar'}</button>
          </form>
        </Card>
      )}

      {out && (
        <Card title={(out.ok ? '✓' : '✗') + ' ' + out.name}>
          <pre className="text-xs bg-bone-100 dark:bg-bone-900 p-3 rounded-xl max-h-60 overflow-auto whitespace-pre-wrap">{out.output}</pre>
        </Card>
      )}

      <AnimatePresence>
        {logFor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setLogFor(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="card w-full max-w-3xl max-h-[80vh] flex flex-col">
              <header className="flex items-center justify-between p-4 border-b border-bone-200 dark:border-bone-700">
                <h3 className="font-semibold">git log {logFor}</h3>
                <button className="btn-ghost" onClick={() => setLogFor(null)}>Cerrar</button>
              </header>
              <div className="p-4 overflow-auto text-xs font-mono">
                {!logData && <div className="text-bone-500">Cargando…</div>}
                {logData && Array.isArray(logData) && logData.map((c, i) => (
                  <div key={i} className="py-1 border-t border-bone-100 dark:border-bone-700">
                    <span className="text-moss-700 dark:text-moss-300">{c.hash}</span>{' '}
                    <span className="text-bone-500">{c.date}</span>{' '}
                    <span className="text-amber-700 dark:text-amber-300">{c.author}</span>{' '}
                    <span className="text-bone-700 dark:text-bone-200">{c.msg}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {webhookFor && <WebhookModal name={webhookFor} isAdmin={isAdmin} notify={notify} onClose={() => setWebhookFor(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {deployLogFor && <DeployLogModal name={deployLogFor} onClose={() => setDeployLogFor(null)} />}
      </AnimatePresence>
    </div>
  );
}

function FilesTab({ notify, canWrite, isAdmin }) {
  const [cwd, setCwd] = useState(() => (typeof window !== 'undefined' && localStorage.getItem('viewer_cwd')) || '/var/www');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [openPath, setOpenPath] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDirty, setEditDirty] = useState(false);
  const [busy, setBusy] = useState('');
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState('file');

  function persist(p) { try { localStorage.setItem('viewer_cwd', p); } catch {} }

  async function loadLs(p) {
    setLoading(true); setErr(null);
    try {
      const r = await fetch('/api/files/ls?path=' + encodeURIComponent(p), { credentials: 'include' });
      const j = await r.json();
      if (!r.ok) { setErr(j.error); setData(null); return; }
      setData(j);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  async function openFile(full) {
    setOpenPath(full); setFileData(null); setEditText(''); setEditDirty(false);
    const r = await fetch('/api/files/read?path=' + encodeURIComponent(full), { credentials: 'include' });
    const j = await r.json();
    if (!r.ok) { setFileData({ error: j.error, size: j.size }); return; }
    setFileData(j);
    setEditText(j.content);
  }

  useEffect(() => { loadLs(cwd); persist(cwd); setOpenPath(null); setFileData(null); }, [cwd]);

  // Auto-open from clone
  useEffect(() => {
    const open = localStorage.getItem('viewer_files_open');
    if (open) {
      localStorage.removeItem('viewer_files_open');
      setCwd(open);
    }
  }, []);

  const [saveOk, setSaveOk] = useState(false);
  async function save() {
    if (!openPath) return;
    setBusy('save'); setSaveOk(false);
    const startedAt = Date.now();
    try {
      const r = await fetch('/api/files/write', {
        method: 'PUT', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: openPath, content: editText })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      const elapsed = Date.now() - startedAt;
      if (elapsed < 1000) await new Promise(res => setTimeout(res, 1000 - elapsed));
      setEditDirty(false);
      setFileData({ ...fileData, content: editText, size: j.size });
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 1800);
    } catch (e) { notify('Error: ' + e.message); }
    finally { setBusy(''); }
  }

  async function create() {
    if (!newName) return;
    setBusy('create');
    const full = cwd + '/' + newName;
    try {
      if (newKind === 'dir') {
        const r = await fetch('/api/files/mkdir', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path: full }) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error);
        notify('Carpeta creada');
      } else {
        const r = await fetch('/api/files/write', { method: 'PUT', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path: full, content: '' }) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error);
        notify('Archivo creado');
        await openFile(full);
      }
      setNewName('');
      loadLs(cwd);
    } catch (e) { notify('Error: ' + e.message); }
    finally { setBusy(''); }
  }

  async function del(entry) {
    const full = cwd + '/' + entry.name;
    if (!confirm('Borrar ' + entry.type + ' ' + full + '?')) return;
    setBusy('del:' + entry.name);
    try {
      const r = await fetch('/api/files?path=' + encodeURIComponent(full), { method: 'DELETE', credentials: 'include' });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      notify('Borrado');
      if (openPath === full) { setOpenPath(null); setFileData(null); }
      loadLs(cwd);
    } catch (e) { notify('Error: ' + e.message); }
    finally { setBusy(''); }
  }

  function crumbs() {
    if (!cwd.startsWith('/var/www')) return null;
    const rel = cwd.slice('/var/www'.length).split('/').filter(Boolean);
    const parts = [];
    let acc = '/var/www';
    parts.push({ label: 'var/www', path: acc });
    for (const seg of rel) { acc = acc + '/' + seg; parts.push({ label: seg, path: acc }); }
    return parts;
  }

  return (
    <div className="grid gap-3 sm:gap-5 lg:grid-cols-2">
      <Card title="Explorador" help="Navega /var/www/* (sandbox: viewerSoftware/.nginx/certbot/html bloqueados). Click dir para entrar, click archivo para abrir editor." action={<span className="text-xs text-bone-500 dark:text-bone-400">{data?.entries?.length ?? 0}</span>}>
        <div className="space-y-3">
          <div className="flex items-center gap-1 flex-wrap text-sm">
            {(crumbs() || []).map((c, i, a) => (
              <span key={c.path} className="flex items-center gap-1">
                <button className="text-moss-700 dark:text-moss-300 hover:underline" onClick={() => setCwd(c.path)}>{c.label}</button>
                {i < a.length - 1 && <span className="text-bone-400">/</span>}
              </span>
            ))}
          </div>
          {loading && <div className="text-xs text-bone-500">Cargando…</div>}
          {err && <div className="text-sm text-red-600">{err}</div>}
          <div className="overflow-auto max-h-[60vh] -mx-4 sm:-mx-5 px-4 sm:px-5">
            <ul className="divide-y divide-bone-100 dark:divide-bone-700">
              {data?.parent && (
                <li><motion.button whileHover={{ x: 2 }} className="flex items-center gap-2 py-2 text-sm text-bone-500 dark:text-bone-400" onClick={() => setCwd(data.parent)} title="Subir un nivel">📂 ..</motion.button></li>
              )}
              {(data?.entries || []).map(e => (
                <li key={e.name} className="flex items-center justify-between py-1.5">
                  <motion.button
                    whileHover={{ x: 2 }}
                    className="flex items-center gap-2 text-sm text-left flex-1 truncate"
                    title={e.type + ' · ' + e.size + 'B · ' + new Date(e.mtime).toLocaleString() + ' · ' + e.mode}
                    onClick={() => e.type === 'dir' ? setCwd(cwd + '/' + e.name) : openFile(cwd + '/' + e.name)}>
                    <span>{e.type === 'dir' ? '📁' : '📄'}</span>
                    <span className="truncate">{e.name}</span>
                  </motion.button>
                  <div className="flex items-center gap-3 text-xs text-bone-400">
                    <span className="hidden sm:inline">{bytes(e.size)}</span>
                    {canWrite && <button title="Borrar" className="text-red-600 hover:underline disabled:opacity-40" disabled={busy === ('del:' + e.name)} onClick={() => del(e)}>✕</button>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {canWrite && (
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 pt-3 border-t border-bone-200 dark:border-bone-700">
              <input className="input text-sm" placeholder="nombre.ext" value={newName} onChange={ev => setNewName(ev.target.value)} />
              <select className="input text-sm" value={newKind} onChange={ev => setNewKind(ev.target.value)} title="Tipo">
                <option value="file">archivo</option>
                <option value="dir">carpeta</option>
              </select>
              <button className="btn-primary text-sm" disabled={busy === 'create' || !newName} onClick={create}>{busy === 'create' ? '…' : 'Crear'}</button>
            </div>
          )}
        </div>
      </Card>

      <Card
        title={openPath ? (<span className="flex items-center gap-2">📝 <span className="font-mono text-xs sm:text-sm break-all">{openPath.split('/').pop()}</span>{editDirty && <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200" title="Cambios sin guardar">●</span>}</span>) : 'Editor'}
        help={openPath ? ('Editor de ' + openPath + '. Cambios resaltados con ●. Guardar requiere rol operator/admin.') : 'Abre un archivo en el explorador clickando sobre él.'}
        action={openPath && canWrite && (
          <button className="btn-primary text-xs relative overflow-hidden min-w-[110px]" disabled={!editDirty || busy === 'save'} onClick={save} title="Guardar cambios (PUT /api/files/write)">
            <AnimatePresence mode="wait">
              {busy === 'save' && (
                <motion.span key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full" />
                  Guardando…
                </motion.span>
              )}
              {saveOk && busy !== 'save' && (
                <motion.span key="ok" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-1 text-white">
                  <motion.svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <motion.path d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: 'easeOut' }} />
                  </motion.svg>
                  Guardado
                </motion.span>
              )}
              {busy !== 'save' && !saveOk && (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Guardar</motion.span>
              )}
            </AnimatePresence>
          </button>
        )}
      >
        {!openPath && <div className="text-sm text-bone-500 dark:text-bone-400 py-8 text-center">Click un archivo en el explorador</div>}
        {openPath && !fileData && <div className="text-sm text-bone-500 flex items-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="inline-block w-3 h-3 border-2 border-bone-300 border-t-moss-600 rounded-full" /> Cargando…</div>}
        {fileData?.error && <div className="text-sm text-red-600">{fileData.error}{fileData.size ? ' (' + bytes(fileData.size) + ')' : ''}</div>}
        {fileData && fileData.content !== undefined && (
          <>
            <div className="text-xs text-bone-500 dark:text-bone-400 mb-2 font-mono break-all" title={openPath}>{openPath} · {bytes(fileData.size)}</div>
            <textarea
              spellCheck={false}
              className="input font-mono text-xs leading-relaxed w-full h-[60vh]"
              value={editText}
              onChange={ev => { setEditText(ev.target.value); setEditDirty(ev.target.value !== fileData.content); }}
              readOnly={!canWrite}
            />
          </>
        )}
      </Card>
    </div>
  );
}

function LogsTab({ containers }) {
  const [source, setSource] = useState('nginx_access');
  const [filter, setFilter] = useState('');
  const [auto, setAuto] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/logs/tail?source=' + encodeURIComponent(source) + '&filter=' + encodeURIComponent(filter) + '&limit=300', { credentials: 'include' });
      setData(await r.json());
    } catch {} finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [source]);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [auto, source, filter]);

  return (
    <Card title="Logs hot-time" help="Visor de logs combinado. Selector de fuente (nginx_access o container:NOMBRE) + filtro regex case-insensitive. Auto-refresh 5s opcional." className="md:col-span-2 lg:col-span-3">
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select className="input text-sm" value={source} onChange={e => setSource(e.target.value)} title="Fuente del log">
            <option value="nginx_access">nginx_access</option>
            {(containers || []).map(c => <option key={c.ID} value={'container:' + c.Names}>container:{c.Names}</option>)}
          </select>
          <input className="input text-sm md:col-span-2" placeholder="Filtro (regex case-i)" value={filter} onChange={e => setFilter(e.target.value)} title="Filtro regex" />
          <div className="flex gap-2">
            <button className="btn-primary flex-1 text-sm" onClick={load} disabled={loading}>{loading ? '…' : 'Buscar'}</button>
            <button className={'btn flex-1 text-sm ' + (auto ? 'btn-primary' : 'btn-ghost')} onClick={() => setAuto(a => !a)} title="Auto-refresh 5s">{auto ? 'Auto ✓' : 'Auto'}</button>
          </div>
        </div>
        <div className="text-xs text-bone-500 dark:text-bone-400">{data?.count ?? 0} lineas{data?.error ? (' · ' + data.error) : ''}</div>
        <pre className="text-xs font-mono bg-bone-100 dark:bg-bone-900 p-3 rounded-xl max-h-[60vh] overflow-auto whitespace-pre">
          {(data?.lines || []).join('\n')}
        </pre>
      </div>
    </Card>
  );
}

function ProfileTab({ me, onPass, on2fa, onAccess, onUsers, isAdmin }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card title="Perfil" help="Información del usuario actual con su rol y acceso. Usa los botones para gestionar cuenta.">
        <div className="space-y-3 text-sm">
          <div><span className="text-bone-500 dark:text-bone-400">Usuario:</span> <span className="font-mono">{me?.user || '—'}</span></div>
          <div><span className="text-bone-500 dark:text-bone-400">Rol:</span> <span className="px-2 py-0.5 rounded-full bg-moss-100 dark:bg-moss-900/40 text-moss-700 dark:text-moss-200 text-xs">{me?.role || '—'}</span></div>
        </div>
      </Card>

      <Card title="Seguridad" help="Cambiar contraseña y activar 2FA TOTP con backup codes.">
        <div className="space-y-2">
          <button title="Cambiar contraseña actual" className="btn-ghost w-full justify-start" onClick={onPass}>⚙ Cambiar contraseña</button>
          <button title="Configurar 2FA TOTP (Authenticator)" className="btn-ghost w-full justify-start" onClick={on2fa}>🔐 Configurar 2FA</button>
        </div>
      </Card>

      {isAdmin && (
        <>
          <Card title="Control de acceso" help="Gestionar IPs autorizadas y dispositivos registrados (cookie viewer_device).">
            <button title="Abrir panel de IPs + devices" className="btn-ghost w-full justify-start" onClick={onAccess}>🔒 Abrir panel</button>
          </Card>
          <Card title="Usuarios" help="CRUD de usuarios con roles admin/operator/viewer.">
            <button title="Abrir gestor usuarios" className="btn-ghost w-full justify-start" onClick={onUsers}>👥 Gestionar usuarios</button>
          </Card>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const me = useApi('/api/me', 0);
  const role = me.data?.role;
  const isAdmin = role === 'admin';
  const canWrite = role === 'admin' || role === 'operator';
  const stats = useApi('/api/system/stats', 5000);
  const disk = useApi('/api/system/disk', 30000);
  const top = useApi('/api/system/top', 15000);
  const containers = useApi('/api/containers', 10000);
  const containerStats = useApi('/api/containers/stats', 10000);
  const sites = useApi('/api/sites', 60000);
  const cron = useApi('/api/cron', 60000);
  const backups = useApi('/api/backups', 60000);
  const alerts = useApi('/api/alerts/state', 15000);

  const [memHistory, setMemHistory] = useState([]);
  const [cpuHistory, setCpuHistory] = useState([]);
  const [busy, setBusy] = useState('');
  const [toast, setToast] = useState(null);
  const [showIssue, setShowIssue] = useState(false);
  const [logsFor, setLogsFor] = useState(null);
  const [restartFor, setRestartFor] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [show2fa, setShow2fa] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showAccess, setShowAccess] = useState(false);
  const [tab, setTabRaw] = useState(() => {
    if (typeof window === 'undefined') return 'dashboard';
    return localStorage.getItem('viewer_tab') || 'dashboard';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsedRaw] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('viewer_sidebar_collapsed') === '1';
  });
  const setCollapsed = (v) => {
    setCollapsedRaw(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      try { localStorage.setItem('viewer_sidebar_collapsed', next ? '1' : '0'); } catch {}
      return next;
    });
  };
  const setTab = (t) => { setTabRaw(t); try { localStorage.setItem('viewer_tab', t); } catch {} };
  const [confFor, setConfFor] = useState(null);
  const [editFor, setEditFor] = useState(null);
  const [detailFor, setDetailFor] = useState(null);
  const [execFor, setExecFor] = useState(null);
  const [showAudit, setShowAudit] = useState(false);
  const [nginxReload, setNginxReload] = useState(false);
  const [nginxTestOut, setNginxTestOut] = useState(null);
  const [dark, setDark] = useDarkMode();

  useEffect(() => {
    if (!stats.data) return;
    const memPct = ((stats.data.mem.total - stats.data.mem.available) / stats.data.mem.total) * 100;
    setMemHistory(h => [...h, memPct].slice(-40));
    setCpuHistory(h => [...h, stats.data.cpu.load['1']].slice(-40));
  }, [stats.data?.ts]);

  function notify(msg) { setToast(msg); setTimeout(() => setToast(null), 4000); }

  async function renewAll() {
    setBusy('renew');
    try {
      const r = await fetch('/api/certs/renew-all', { method: 'POST', credentials: 'include' });
      const j = await r.json();
      notify(r.ok ? 'Renovación lanzada' : ('Error: ' + (j.error || '')));
    } catch (e) { notify('Error: ' + e.message); }
    finally { setBusy(''); }
  }
  async function restartContainer(name) {
    setRestartFor(null);
    setBusy('restart:' + name);
    try {
      const r = await fetch('/api/containers/' + encodeURIComponent(name) + '/restart', { method: 'POST', credentials: 'include' });
      const j = await r.json();
      notify(r.ok ? 'Container ' + name + ' reiniciado' : ('Error: ' + (j.error || '')));
      containers.reload();
    } catch (e) { notify('Error: ' + e.message); }
    finally { setBusy(''); }
  }
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/login';
  }
  async function nginxTest() {
    setBusy('nginx-test'); setNginxTestOut(null);
    try {
      const r = await fetch('/api/nginx/test', { credentials: 'include' });
      const j = await r.json();
      setNginxTestOut(j);
      notify(j.ok ? 'nginx -t OK' : 'nginx -t FALLO');
      setTimeout(() => setNginxTestOut(null), 8000);
    } catch (e) { notify('Error: ' + e.message); }
    finally { setBusy(''); }
  }
  async function nginxReloadDo() {
    setNginxReload(false); setBusy('nginx-reload');
    try {
      const r = await fetch('/api/nginx/reload', { method: 'POST', credentials: 'include' });
      const j = await r.json();
      notify(r.ok ? 'nginx recargado' : ('Error: ' + (j.error || '')));
    } catch (e) { notify('Error: ' + e.message); }
    finally { setBusy(''); }
  }

  const s = stats.data;
  const memUsed = s ? s.mem.total - s.mem.available : 0;
  const statsByName = (containerStats.data || []).reduce((a, c) => { a[c.Name || c.Container] = c; return a; }, {});

  const T = (id) => tab === id;

  return (
    <main className={'min-h-screen p-3 sm:p-6 lg:p-10 max-w-7xl mx-auto transition-[padding] duration-300 ' + (collapsed ? 'md:pr-24' : 'md:pr-72')}>
      <MatrixTitle />
      <Screensaver timeoutMs={90000} />
      <Sidebar tab={tab} setTab={setTab} dark={dark} setDark={setDark} alerts={alerts} logout={logout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} collapsed={collapsed} setCollapsed={setCollapsed} />

      <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
        <div className="text-[10px] sm:text-xs uppercase tracking-widest text-moss-700 dark:text-moss-300">VPS Control · {TABS.find(t => t.id === tab)?.label}</div>
        <h1 className="text-2xl sm:text-3xl font-semibold">{TABS.find(t => t.id === tab)?.icon} {TABS.find(t => t.id === tab)?.label}</h1>
      </motion.header>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>

      {T('certs') && canWrite && (
        <div className="mb-5 flex gap-2 flex-wrap">
          <button className="btn-primary" title="Renovar todos los certs Let's Encrypt en lote" onClick={renewAll} disabled={busy === 'renew'}>{busy === 'renew' ? '…' : '🔁 Renovar todos'}</button>
          <button className="btn-ghost" title="Solicitar nuevo cert Let's Encrypt" onClick={() => setShowIssue(v => !v)}>{showIssue ? 'Ocultar' : '➕ Nuevo cert'}</button>
        </div>
      )}
      {T('nginx') && canWrite && (
        <div className="mb-5 flex gap-2 flex-wrap">
          <button className="btn-ghost" onClick={nginxTest} disabled={busy === 'nginx-test'} title="Validar config nginx (nginx -t)">{busy === 'nginx-test' ? '…' : '✓ nginx -t'}</button>
          <button className="btn-ghost" onClick={() => setNginxReload(true)} disabled={busy === 'nginx-reload'} title="Recargar nginx (sin downtime)">{busy === 'nginx-reload' ? '…' : '↻ reload'}</button>
          <button className="btn-ghost" title="Log de auditoria" onClick={() => setShowAudit(true)}>📋 Auditoria</button>
        </div>
      )}
      {T('dashboard') && (
        <div className="mb-5">
          <button className="btn-ghost" title="Log de auditoria" onClick={() => setShowAudit(true)}>📋 Auditoria</button>
        </div>
      )}

      <AnimatePresence>
        {showIssue && T('certs') && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
            <Card title="Emitir cert nuevo" help="Crea nginx site + emite cert Let's Encrypt via webroot ACME. Requiere DNS apuntando a este servidor.">
              <IssueCertForm onDone={() => { setShowIssue(false); notify('Cert emitido'); sites.reload(); }} />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {T('logs') && <LogsTab containers={containers.data} />}
      {T('repos') && <ReposTab notify={notify} canWrite={canWrite} isAdmin={isAdmin} setTab={setTab} />}
      {T('files') && <FilesTab notify={notify} canWrite={canWrite} isAdmin={isAdmin} />}
      {T('profile') && <ProfileTab me={me.data} onPass={() => setShowPass(true)} on2fa={() => setShow2fa(true)} onAccess={() => setShowAccess(true)} onUsers={() => setShowUsers(true)} isAdmin={isAdmin} />}

      <div className="grid gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {T('dashboard') && <Card title="Sistema" delay={0.05} help="CPU count, load average 1/5/15min, memoria total/usada/libre, uptime del servidor. Sparklines muestran tendencia memoria y load ultimas 40 muestras (cada 5s).">
          {s ? (
            <div className="space-y-4">
              <StatBar label="Memoria" value={memUsed} total={s.mem.total} />
              <div><div className="text-xs text-bone-500 dark:text-bone-400 mb-1">Memoria (40 muestras)</div><Sparkline values={memHistory} color="#1f8a4e" /></div>
              <div><div className="text-xs text-bone-500 dark:text-bone-400 mb-1">Load 1m (40 muestras)</div><Sparkline values={cpuHistory} color="#58c896" /></div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="card p-3"><div className="text-bone-500 dark:text-bone-400 text-xs">CPUs</div><div className="text-xl font-semibold">{s.cpu.count}</div></div>
                <div className="card p-3"><div className="text-bone-500 dark:text-bone-400 text-xs">Load 1m</div><div className="text-xl font-semibold">{s.cpu.load['1'].toFixed(2)}</div></div>
                <div className="card p-3"><div className="text-bone-500 dark:text-bone-400 text-xs">Uptime</div><div className="text-xl font-semibold">{dur(s.uptime_s)}</div></div>
              </div>
            </div>
          ) : <div className="text-bone-500 text-sm">{stats.err || 'Cargando…'}</div>}
        </Card>}

        {T('dashboard') && <Card title="Disco" delay={0.08} help="Uso de disco por mountpoint del host. Solo dispositivos /dev/*. Refresh 30s.">
          <div className="space-y-3">
            {(disk.data || []).map(d => (
              <div key={d.mount}>
                <div className="text-xs text-bone-500 dark:text-bone-400 mb-1">{d.mount} <span className="text-bone-400">({d.fs})</span></div>
                <StatBar label="" value={d.used} total={d.total} />
              </div>
            ))}
            {!disk.data && <div className="text-sm text-bone-500">Cargando…</div>}
          </div>
        </Card>}

        {T('dashboard') && <Card title="Top procesos" delay={0.12} help="Top 10 procesos del host por CPU ticks acumulados. PID, RSS (memoria residente) y comando. Refresh 15s.">
          <div className="overflow-auto max-h-72">
            <table className="w-full text-xs">
              <thead className="text-bone-500 dark:text-bone-400 text-left">
                <tr><th className="py-1">PID</th><th>RSS</th><th>Comando</th></tr>
              </thead>
              <tbody>
                {(top.data || []).slice(0, 10).map(p => (
                  <tr key={p.pid} className="border-t border-bone-100 dark:border-bone-700">
                    <td className="py-1.5 font-mono">{p.pid}</td>
                    <td className="text-bone-600 dark:text-bone-300">{bytes(p.rss_kb * 1024)}</td>
                    <td className="text-bone-700 dark:text-bone-200 truncate max-w-[180px]">{p.comm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>}

        {(T('nginx') || T('certs')) && <Card title="Sitios" delay={0.15} help="Dominios servidos por nginx. Muestra upstream (container destino) y fecha de expiracion del cert Let's Encrypt. Click 'ver' para conf, 'editar' para modificar (con nginx -t rollback)." action={<span className="text-xs text-bone-500">{sites.data?.length ?? 0}</span>} className="lg:col-span-2">
          <ul className="divide-y divide-bone-100 dark:divide-bone-700 -mx-1">
            {(sites.data || []).map(s => (
              <li key={s.domain} className="flex items-center justify-between py-2 px-1">
                <div>
                  <div className="font-medium text-sm">{s.domain}</div>
                  <div className="text-xs text-bone-500 dark:text-bone-400">{s.upstream || '—'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-bone-500 dark:text-bone-400">{s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : '—'}</div>
                  <button title="Ver conf nginx (read-only)" className="text-xs text-moss-700 dark:text-moss-300 hover:underline" onClick={() => setConfFor(s.domain)}>ver</button>
                  {canWrite && <button title="Editar conf nginx (con nginx -t rollback)" className="text-xs text-amber-700 dark:text-amber-400 hover:underline" onClick={() => setEditFor(s.domain)}>editar</button>}
                </div>
              </li>
            ))}
          </ul>
        </Card>}

        {T('docker') && <Card title="Containers" delay={0.18} help="Todos los containers Docker (running + stopped). Click nombre para detalle. 📜 logs, ▶ exec allowlist, ↻ restart. CPU/MEM en vivo cada 10s." action={<span className="text-xs text-bone-500">{containers.data?.length ?? 0}</span>} className="lg:col-span-2">
          <div className="overflow-auto max-h-80 -mx-4 sm:-mx-5 px-4 sm:px-5">
            <table className="w-full text-xs sm:text-sm min-w-[480px]">
              <thead className="text-xs text-bone-500 dark:text-bone-400 text-left">
                <tr><th className="py-1">Nombre</th><th className="hidden sm:table-cell">Estado</th><th>CPU</th><th>MEM</th><th></th></tr>
              </thead>
              <tbody>
                {(containers.data || []).map(c => {
                  const st = statsByName[c.Names];
                  const isSelf = SELF.has(c.Names);
                  const restarting = busy === ('restart:' + c.Names);
                  return (
                    <motion.tr key={c.ID} whileHover={{ backgroundColor: dark ? 'rgba(31,138,78,0.12)' : 'rgba(31,138,78,0.04)' }} className="border-t border-bone-100 dark:border-bone-700">
                      <td className="py-1.5 font-medium max-w-[140px] truncate"><button className="hover:underline text-left truncate w-full" onClick={() => setDetailFor(c.Names)}>{c.Names}</button></td>
                      <td className="text-bone-600 dark:text-bone-300 hidden sm:table-cell">{c.State}</td>
                      <td className="text-bone-500 dark:text-bone-400 whitespace-nowrap">{st?.CPUPerc || '—'}</td>
                      <td className="text-bone-500 dark:text-bone-400 whitespace-nowrap">{st?.MemPerc || '—'}</td>
                      <td className="text-xs flex gap-1.5 sm:gap-2">
                        <button title="Ver logs (auto-refresh 5s)" className="text-moss-700 dark:text-moss-300 hover:underline" onClick={() => setLogsFor(c.Names)}>📜</button>
                        {canWrite && <button title="Ejecutar comando (allowlist)" className="text-moss-700 dark:text-moss-300 hover:underline" onClick={() => setExecFor(c.Names)}>▶</button>}
                        {canWrite && !isSelf && (
                          <button title="Reiniciar container" className="text-amber-700 dark:text-amber-400 hover:underline disabled:opacity-40" disabled={restarting} onClick={() => setRestartFor(c.Names)}>
                            {restarting ? '…' : '↻'}
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>}

        {T('nginx') && <Card title="Trafico" delay={0.2} help="Parser access.log nginx por dominio. Agrupacion HTTP status 2xx/3xx/4xx/5xx con barras animadas. Lista ultimos 50 eventos plegable (IP, metodo, path, status).">
          <TrafficPanel sites={sites.data} />
        </Card>}

        {T('dashboard') && <Card title="Red" delay={0.21} help="Trafico RX/TX por interfaz de red (eth, ens...) excluyendo loopback/veth/docker. Sparklines de tasa bytes/s en tiempo real (refresh 5s).">
          <NetworkCard />
        </Card>}

        {T('dashboard') && <Card title="Historial" delay={0.23} className="lg:col-span-3" help="Metricas CPU load y MEM% almacenadas en SQLite. Selector 1h (cada 60s), 6h (cada 5min), 24h (cada 15min). Animacion GSAP en transiciones.">
          <HistoryChart />
        </Card>}

        {T('dashboard') && alerts.data && alerts.data.length > 0 && (
          <Card title="Alertas activas" delay={0.24} className="lg:col-span-3" help="Alertas en curso: disk>85%, mem>90%, load>2xcpus, load_spike (>2x baseline 60min). Email SMTP + webhook opcional con cooldown 1h por tipo.">
            <ul className="space-y-2">
              {alerts.data.map(a => (
                <li key={a.kind} className="flex items-center justify-between border-l-4 border-red-500 pl-3 py-1">
                  <div>
                    <div className="font-medium text-sm">{a.kind.toUpperCase()}</div>
                    <div className="text-xs text-bone-500 dark:text-bone-400">{a.message}</div>
                  </div>
                  <div className="text-xs text-bone-400">{new Date(a.ts * 1000).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {T('dashboard') && <Card title="Backups" delay={0.22} help="Zips backup en /var/backups/ del host. Cron diario 04:00 (backup_www.sh) genera daily + weekly rotativos. Solo lista, sin restore desde UI." action={<span className="text-xs text-bone-500">{backups.data?.length ?? 0}</span>}>
          <ul className="space-y-1 max-h-64 overflow-auto">
            {(backups.data || []).slice(0, 8).map(b => (
              <li key={b.name} className="text-sm flex justify-between gap-2">
                <span className="truncate">{b.name}</span>
                <span className="text-bone-500 dark:text-bone-400 whitespace-nowrap">{bytes(b.size)}</span>
              </li>
            ))}
          </ul>
        </Card>}

        {T('dashboard') && <Card title="Crontab root" delay={0.26} className="lg:col-span-3" help="Crontab del usuario root del host. Editable con allowlist (solo renew_certs.sh y backup_www.sh). Cambios requieren cron auto-reload.">
          {cron.data ? <CronEditor initial={cron.data} onSaved={() => cron.reload()} notify={notify} /> : <div className="text-sm text-bone-500">Cargando…</div>}
        </Card>}

        {T('docker') && <Card title="Eventos Docker (1h)" delay={0.28} className="lg:col-span-3" help="Eventos del daemon Docker en la ultima hora (start/stop/die/health_status/network/volume). Tabla con timestamp, Type, Action y Actor. Refresh 60s.">
          <DockerEventsCard />
        </Card>}
      </div>
      </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {logsFor && <LogsModal name={logsFor} onClose={() => setLogsFor(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showPass && <ChangePasswordModal onClose={() => setShowPass(false)} notify={notify} />}
      </AnimatePresence>
      <AnimatePresence>
        {show2fa && <TwoFactorModal onClose={() => setShow2fa(false)} notify={notify} />}
      </AnimatePresence>
      <AnimatePresence>
        {showUsers && <UsersModal onClose={() => setShowUsers(false)} notify={notify} currentUser={me.data?.user} />}
      </AnimatePresence>
      <AnimatePresence>
        {showAccess && <AccessControlModal onClose={() => setShowAccess(false)} notify={notify} />}
      </AnimatePresence>
      <AnimatePresence>
        {confFor && <NginxConfModal domain={confFor} onClose={() => setConfFor(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {editFor && <NginxEditorModal domain={editFor} onClose={() => setEditFor(null)} notify={notify} onSaved={() => sites.reload()} />}
      </AnimatePresence>
      <AnimatePresence>
        {detailFor && <ContainerDetailModal name={detailFor} onClose={() => setDetailFor(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {execFor && <ExecModal name={execFor} onClose={() => setExecFor(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showAudit && <AuditModal onClose={() => setShowAudit(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {nginxReload && (
          <ConfirmModal
            title="Recargar nginx"
            message="nginx -s reload. Recomendado ejecutar 'nginx -t' antes para validar config."
            onConfirm={nginxReloadDo}
            onCancel={() => setNginxReload(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {nginxTestOut && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="fixed top-6 right-6 card p-4 max-w-md text-xs glow z-40">
            <div className="font-semibold mb-2">{nginxTestOut.ok ? 'nginx -t OK' : 'nginx -t FALLO'}</div>
            <pre className="whitespace-pre-wrap max-h-40 overflow-auto">{(nginxTestOut.stdout || '') + (nginxTestOut.stderr || '')}</pre>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {restartFor && (
          <ConfirmModal
            title={'Reiniciar ' + restartFor}
            message={'Vas a reiniciar el container ' + restartFor + '.\n\nPuede causar interrupcion breve del servicio asociado.'}
            onConfirm={() => restartContainer(restartFor)}
            onCancel={() => setRestartFor(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 card px-4 py-3 text-sm shadow-lg glow">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
