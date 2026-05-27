PATH = "/var/www/viewerSoftware/frontend/src/components/Dashboard.jsx"
with open(PATH, "r") as f:
    s = f.read()

# 1. Remove the red square from stack header (revert that change, keep ↓ down only)
old_btns = """            {healthy > 0 && (
                              <>
                                <button title={'docker compose stop stack ' + g.proj + ' (containers paran, NO se borran)'} onClick={() => setStackAction({ project: g.proj, action: 'stop' })}
                                  className="inline-flex items-center justify-center w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold leading-none transition" aria-label="stop">■</button>
                                <button title={'docker compose down stack ' + g.proj + ' (mantiene volúmenes)'} onClick={() => setStackAction({ project: g.proj, action: 'down' })}
                                  className="text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded px-2 py-0.5">↓ down</button>
                              </>
                            )}"""
new_btns = """            {healthy > 0 && (
                              <button title={'docker compose down stack ' + g.proj + ' (mantiene volúmenes)'} onClick={() => setStackAction({ project: g.proj, action: 'down' })}
                                className="text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded px-2 py-0.5">↓ down</button>
                            )}"""

if old_btns not in s:
    raise SystemExit("stack stop btn not found to revert")
s = s.replace(old_btns, new_btns)

# 2. Widen Acciones column w-28 -> w-32 to fit 4 buttons
s = s.replace('<th className="text-right w-28 pr-1">Acciones</th>',
              '<th className="text-right w-32 pr-1">Acciones</th>')
s = s.replace('<td className="pr-1">\n                                    <div className="flex items-center justify-end gap-2 text-base leading-none">',
              '<td className="pr-1 w-32">\n                                    <div className="flex items-center justify-end gap-2 text-base leading-none">')

# 3. Add red square stop button next to restart button (per-container)
old_row = """                                      {canWrite && !isSelf && (
                                        <button title="Reiniciar container" className="hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded p-1 transition disabled:opacity-40" disabled={restarting} onClick={() => setRestartFor(c.Names)}>
                                          {restarting ? '…' : '↻'}
                                        </button>
                                      )}"""

new_row = """                                      {canWrite && !isSelf && (
                                        <button title="Reiniciar container" className="hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded p-1 transition disabled:opacity-40" disabled={restarting} onClick={() => setRestartFor(c.Names)}>
                                          {restarting ? '…' : '↻'}
                                        </button>
                                      )}
                                      {canWrite && !isSelf && c.State === 'running' && (
                                        <button title="docker stop (parar container)" disabled={busy === ('stop:' + c.Names)} onClick={() => setStopFor(c.Names)}
                                          className="inline-flex items-center justify-center w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold leading-none transition disabled:opacity-40">
                                          {busy === ('stop:' + c.Names) ? '…' : '■'}
                                        </button>
                                      )}"""

if old_row not in s:
    raise SystemExit("restart row not found")
s = s.replace(old_row, new_row)

# 4. Add setStopFor state + ConfirmModal. Find setRestartFor
old_state = "const [restartFor, setRestartFor] = useState(null);"
new_state = old_state + "\n  const [stopFor, setStopFor] = useState(null);"
if old_state not in s:
    raise SystemExit("restartFor state not found")
s = s.replace(old_state, new_state)

# 5. Find restartFor ConfirmModal to add stopFor modal next to it
# Find a marker around it
marker = "{restartFor && (\n          <ConfirmModal"
if marker not in s:
    raise SystemExit("restartFor modal not found")

# Find the closing of restartFor confirm modal
idx_start = s.index(marker)
# Find the matching closing block - look for ")}\n      </AnimatePresence>" after this
# Approach: search "</ConfirmModal>" then ")}"
import re
m = re.search(r'\{restartFor && \(\n\s*<ConfirmModal[\s\S]*?\)\}', s[idx_start:idx_start+5000])
if not m:
    raise SystemExit("restartFor modal close not found")
end_idx = idx_start + m.end()

stop_modal = """

      <AnimatePresence>
        {stopFor && (
          <ConfirmModal
            title={'Parar ' + stopFor}
            message={`docker stop ${stopFor} (-t 10).\\n\\nEl container se para pero NO se borra.\\nDatos, redes y volumenes intactos.\\n\\nReversible con ▶ start en card "Contenedores parados".`}
            onCancel={() => setStopFor(null)}
            onConfirm={async () => {
              const name = stopFor;
              setStopFor(null);
              setBusy('stop:' + name);
              try {
                const r = await fetch('/api/containers/' + encodeURIComponent(name) + '/stop', { method: 'POST', credentials: 'include' });
                const j = await r.json();
                notify(r.ok ? `${name} parado` : ('Error: ' + (j.error || '')));
                containers.reload();
              } catch (e) { notify('Error: ' + e.message); }
              finally { setBusy(''); }
            }}
          />
        )}
      </AnimatePresence>"""

s = s[:end_idx] + stop_modal + s[end_idx:]

with open(PATH, "w") as f:
    f.write(s)
print("done", len(s))
