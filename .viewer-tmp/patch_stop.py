PATH = "/var/www/viewerSoftware/backend/src/server.js"
with open(PATH, "r") as f:
    s = f.read()

stop_endpoint = """app.post('/api/stacks/:project/stop', ...requireOp, async (req, res) => {
  const proj = req.params.project;
  if (!/^[a-zA-Z0-9_.-]{1,80}$/.test(proj)) return res.status(400).json({ error: 'bad_project' });
  if (proj === 'viewersoftware') return res.status(400).json({ error: 'no_self_stop' });
  try {
    const { stdout: psOut } = await sh('docker', ['ps', '-a', '--filter', 'label=com.docker.compose.project=' + proj, '--format', '{{.ID}}']);
    const ids = psOut.trim().split('\\n').filter(Boolean);
    if (ids.length === 0) return res.status(404).json({ error: 'no_containers' });
    const { stdout: insOut } = await sh('docker', ['inspect', '--format', '{{index .Config.Labels "com.docker.compose.project.working_dir"}}', ids[0]]);
    const workingDir = insOut.trim();
    if (!workingDir || workingDir === '<no value>') return res.status(500).json({ error: 'no_working_dir' });
    const cwd = workingDir.replace(/^\\/var\\/www\\//, '/host/www/');
    const { stdout, stderr } = await sh('docker', ['compose', 'stop', '-t', '10'], { cwd, timeout: 60000 });
    res.json({ ok: true, project: proj, output: (stdout + stderr).slice(-2000) });
  } catch (e) { res.status(500).json({ error: e.message, stderr: (e.stderr || '').slice(-500) }); }
});

"""

marker = "app.post('/api/stacks/:project/up'"
idx = s.index(marker)
new = s[:idx] + stop_endpoint + s[idx:]
with open(PATH, "w") as f:
    f.write(new)
print("done", len(new))
