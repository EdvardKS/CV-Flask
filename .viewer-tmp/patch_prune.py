PATH = "/var/www/viewerSoftware/backend/src/server.js"
with open(PATH, "r") as f:
    s = f.read()

old = """// Docker system cleanup (admin only) — removes stopped containers, dangling images, unused networks
// Does NOT remove volumes (data safety)
app.post('/api/system/docker-prune', ...requireAdmin, async (_, res) => {
  try {
    const out = [];
    const c1 = await sh('docker', ['container', 'prune', '-f'], { timeout: 60000 }); out.push('containers: ' + c1.stdout.trim().split('\\n').pop());
    const c2 = await sh('docker', ['image', 'prune', '-af'], { timeout: 120000 }); out.push('images: ' + c2.stdout.trim().split('\\n').pop());
    const c3 = await sh('docker', ['network', 'prune', '-f'], { timeout: 30000 }); out.push('networks: ' + c3.stdout.trim().split('\\n').pop());
    const c4 = await sh('docker', ['builder', 'prune', '-af'], { timeout: 120000 }); out.push('builder: ' + c4.stdout.trim().split('\\n').pop());
    res.json({ ok: true, summary: out.join(' · '), details: out });
  } catch (e) { res.status(500).json({ error: e.message }); }
});"""

new = """// Docker system cleanup (admin only) — solo elementos NO usados
// NUNCA toca: containers parados (se conservan para poder relevantarlos),
//             imagenes con tag (aunque container no este running),
//             volumenes (datos),
//             builder cache reciente (<7 dias, para no romper velocidad de build).
// SOLO borra: imagenes dangling (<none>:<none> sin referencia),
//             redes sin ningun container,
//             builder cache antiguo (>168h).
app.post('/api/system/docker-prune', ...requireAdmin, async (_, res) => {
  try {
    const out = [];
    // dangling images only (sin -a): solo <none> sin tag
    const c1 = await sh('docker', ['image', 'prune', '-f'], { timeout: 120000 });
    out.push('images: ' + c1.stdout.trim().split('\\n').pop());
    // networks sin uso (referencia a containers existentes los protege)
    const c2 = await sh('docker', ['network', 'prune', '-f'], { timeout: 30000 });
    out.push('networks: ' + c2.stdout.trim().split('\\n').pop());
    // builder cache >7 dias
    const c3 = await sh('docker', ['builder', 'prune', '-f', '--filter', 'until=168h'], { timeout: 120000 });
    out.push('builder: ' + c3.stdout.trim().split('\\n').pop());
    res.json({ ok: true, summary: out.join(' · '), details: out });
  } catch (e) { res.status(500).json({ error: e.message }); }
});"""

if old not in s:
    raise SystemExit("prune marker not found")
s = s.replace(old, new)
with open(PATH, "w") as f:
    f.write(s)
print("done", len(s))
