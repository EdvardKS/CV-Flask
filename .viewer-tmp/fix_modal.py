PATH = "/var/www/viewerSoftware/frontend/src/components/Dashboard.jsx"
with open(PATH, "r") as f:
    s = f.read()

# Fix the broken nested modal — the restartFor modal got cut mid-way and stopFor inserted inside it.
broken = """      <AnimatePresence>
        {restartFor && (
          <ConfirmModal
            title={'Reiniciar ' + restartFor}
            message={'Vas a reiniciar el container ' + restartFor + '.\\n\\nPuede causar interrupcion breve del servicio asociado.'}
            onConfirm={() => restartContainer(restartFor)}

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
      </AnimatePresence>
            onCancel={() => setRestartFor(null)}
          />
        )}
      </AnimatePresence>"""

fixed = """      <AnimatePresence>
        {restartFor && (
          <ConfirmModal
            title={'Reiniciar ' + restartFor}
            message={'Vas a reiniciar el container ' + restartFor + '.\\n\\nPuede causar interrupcion breve del servicio asociado.'}
            onConfirm={() => restartContainer(restartFor)}
            onCancel={() => setRestartFor(null)}
          />
        )}
      </AnimatePresence>

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

if broken not in s:
    raise SystemExit("broken block not found")
s = s.replace(broken, fixed)
with open(PATH, "w") as f:
    f.write(s)
print("done", len(s))
