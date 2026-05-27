PATH = "/var/www/viewerSoftware/frontend/src/components/Dashboard.jsx"
with open(PATH, "r") as f:
    s = f.read()

# 1. Add red square stop button next to down button
old_btns = """            {healthy > 0 && (
                              <button title={'docker compose down stack ' + g.proj + ' (mantiene volúmenes)'} onClick={() => setStackAction({ project: g.proj, action: 'down' })}
                                className="text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded px-2 py-0.5">↓ down</button>
                            )}"""

new_btns = """            {healthy > 0 && (
                              <>
                                <button title={'docker compose stop stack ' + g.proj + ' (containers paran, NO se borran)'} onClick={() => setStackAction({ project: g.proj, action: 'stop' })}
                                  className="inline-flex items-center justify-center w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold leading-none transition" aria-label="stop">■</button>
                                <button title={'docker compose down stack ' + g.proj + ' (mantiene volúmenes)'} onClick={() => setStackAction({ project: g.proj, action: 'down' })}
                                  className="text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded px-2 py-0.5">↓ down</button>
                              </>
                            )}"""

if old_btns not in s:
    raise SystemExit("btns marker not found")
s = s.replace(old_btns, new_btns)

# 2. Extend ConfirmModal title + message to handle stop
old_title = "title={(stackAction.action === 'down' ? 'Bajar' : 'Levantar') + ' stack ' + stackAction.project}"
new_title = "title={(stackAction.action === 'down' ? 'Bajar' : stackAction.action === 'stop' ? 'Parar' : 'Levantar') + ' stack ' + stackAction.project}"
if old_title not in s:
    raise SystemExit("title marker not found")
s = s.replace(old_title, new_title)

old_msg = """message={stackAction.action === 'down'
              ? `docker compose down -t 10 sobre ${stackAction.project}.\\n\\nLos containers se paran y borran.\\nLos volúmenes named SE CONSERVAN (datos a salvo).\\nLas redes nombradas en el compose se borran.\\n\\nReversible con ↑ up.`
              : `docker compose up -d sobre ${stackAction.project}.\\n\\nLevanta el stack con su última configuración.`"""

new_msg = """message={stackAction.action === 'down'
              ? `docker compose down -t 10 sobre ${stackAction.project}.\\n\\nLos containers se paran y borran.\\nLos volúmenes named SE CONSERVAN (datos a salvo).\\nLas redes nombradas en el compose se borran.\\n\\nReversible con ↑ up.`
              : stackAction.action === 'stop'
              ? `docker compose stop -t 10 sobre ${stackAction.project}.\\n\\nLos containers SE PARAN pero NO se borran.\\nLos datos y la red se conservan.\\n\\nReversible con ↑ up (igual config) o restart.`
              : `docker compose up -d sobre ${stackAction.project}.\\n\\nLevanta el stack con su última configuración.`"""

if old_msg not in s:
    raise SystemExit("msg marker not found")
s = s.replace(old_msg, new_msg)

with open(PATH, "w") as f:
    f.write(s)
print("done", len(s))
