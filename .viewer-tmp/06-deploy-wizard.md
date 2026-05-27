# Spec 06 — Wizard "Desplegar Nuevo" — Robust One-Click Deploy

> Estado: borrador para revisión. Cero código hasta aprobación SDD + TDD.

## 0. Objetivo y alcance

Un wizard guiado en panel + endpoint backend que, dado únicamente:
- URL git (HTTPS o SSH)
- Dominio público (`<sub>.edvardks.com` o ajeno)
- Upstream port del contenedor principal
- (Opcional) email LE, archivo `.env`, override de nombre directorio, flags avanzados

…produce un servicio web **publicado en HTTPS** con **cero downtime de la app existente**, **certificado válido** y **auto-deploy futuro** (webhook GitHub registrado). Cada paso atómico, idempotente, con rollback determinista. Pipeline observable por SSE en tiempo real. Audit completo. **Concurrencia segura**: solo un deploy `/api/deploy/new` activo por dominio o path, encolados los siguientes.

Fuera de alcance v1: multi-container con múltiples dominios, paths `/api` separados a otro upstream, GitHub App, DNS-01 challenge, multi-arch builds, deploys cross-server.

## 1. Estado actual vs objetivo

| Pieza | Hoy | Spec 06 |
|---|---|---|
| Clone | manual via `/api/repos/clone` | orquestado en pipeline |
| `.env` | manual, archivos via tab Files | drag-drop wizard + auto-genera + redact preview |
| Build + Up | manual o webhook | orquestado, blue-green obligatorio |
| Nginx site conf | manual o `add_site_and_cert.sh` directo | orquestado con backup + rollback |
| Cert LE | manual | orquestado con DNS check + retry + LE staging para tests |
| Webhook | usuario configura GitHub manual | secret auto-generado + URL devuelta + instrucciones inline |
| Audit / rollback | parcial por endpoint | unificado con state machine persistida en SQLite |
| SSE progress | no existe | full SSE con phases tipadas |

## 2. Modelo de datos (SQLite — nuevas tablas)

```sql
CREATE TABLE IF NOT EXISTS deploys (
  id TEXT PRIMARY KEY,                  -- uuid v4
  ts INTEGER NOT NULL,                  -- created
  finished_ts INTEGER,                  -- last update
  user TEXT NOT NULL,                   -- who triggered
  url TEXT NOT NULL,
  name TEXT NOT NULL,                   -- /var/www/<name>
  domain TEXT NOT NULL,
  upstream_port INTEGER NOT NULL,
  email TEXT,
  skip_dns INTEGER NOT NULL DEFAULT 0,
  staging_cert INTEGER NOT NULL DEFAULT 0,
  phase TEXT NOT NULL,                  -- queued|validate|clone|env|detect|build|test|up|nginx|cert|webhook|done|failed|rolledback
  status TEXT NOT NULL,                 -- pending|running|ok|failed
  error TEXT,                           -- short error message
  log_chunks_id TEXT,                   -- FK a deploy_logs.deploy_id
  rollback_done INTEGER DEFAULT 0,
  webhook_secret TEXT                   -- generado al final si OK
);
CREATE INDEX IF NOT EXISTS idx_deploys_ts ON deploys(ts);
CREATE INDEX IF NOT EXISTS idx_deploys_status ON deploys(status);

CREATE TABLE IF NOT EXISTS deploy_logs (
  deploy_id TEXT NOT NULL,
  seq INTEGER NOT NULL,                 -- monotonic per deploy
  ts_ms INTEGER NOT NULL,
  phase TEXT NOT NULL,
  level TEXT NOT NULL,                  -- info|warn|error
  message TEXT NOT NULL,
  PRIMARY KEY (deploy_id, seq)
);
```

Retención: deploys 90 días, logs 30 días. Cleanup en boot + diario.

## 3. State machine

```
Estados: queued → validate → clone → env → detect → build → test → up → nginx → cert → webhook → done
                                                                                                 ↘ failed → (rollback) → rolledback
```

Transiciones:
- Solo **forward** salvo desde cualquier estado pueden ir a `failed`.
- `failed` ejecuta `rollback()` que limpia recursos creados hasta el momento.
- Tras rollback exitoso → `rolledback`. Si rollback falla → `rolledback_partial` + flag manual review.

Idempotencia:
- Cada paso comprueba si ya está hecho antes de actuar (e.g. clone: si dir existe + es git valido → saltar; nginx site: si conf existe y matchea → saltar).
- `POST /api/deploy/new` con misma URL+name+domain dentro de 60s → devuelve `id` del deploy en curso (no duplica).

Concurrencia:
- Lock por `name` (path) y por `domain`. Si conflicto: 409 `path_in_use` o `domain_in_use`.
- Cola global FIFO max 5 simultáneos para no saturar build. Si `runningDeploys.size >= 5` → 503 con `Retry-After`.

## 4. Entradas — validación detallada

### 4.1. URL git
- Regex: `^(https?://[^\s@]+\.git|git@[^\s:]+:[^\s]+\.git)$` (no `file://`, no `--upload-pack=`)
- TLD: al menos un punto
- Reachable: `git ls-remote --heads --quiet <url>` con timeout 30s. Si exit≠0 → `url_unreachable`.
- SSH: solo si `/root/.ssh/asadorvps` existe (seed-ssh montado). Si no → rechazar SSH y sugerir HTTPS.

### 4.2. Name (directorio)
- Auto-derivado: último segmento URL sin `.git`, lowercase, replace `[^a-z0-9_.-]` por `-`, dedup `-`, trim `-_.`.
- Override usuario: regex `^[a-z][a-z0-9_.-]{0,63}$`
- Reservados (bloqueo duro): `viewerSoftware`, `.nginx`, `certbot`, `html`, `.ollama`, `backups`, `.git`
- No existe `/var/www/<name>` (check con `stat`)

### 4.3. Dominio
- Regex: `^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$` (IDN no soportado)
- Lowercase
- No existe `/var/www/.nginx/sites-generated/<domain>.conf`
- No existe cert `/etc/letsencrypt/live/<domain>` (si existe ya, error con sugerencia "borra primero")
- **DNS check** (a menos `skip_dns=true`):
  - `getent ahostsv4 <domain>` resuelve
  - IP coincide con `curl -s4 ifconfig.me` (server self-IP) **O** está en rangos CF (si user usa CF proxied — pero ACME HTTP-01 NO funciona con CF proxied → forzar "gray cloud" durante emisión, advertir usuario)

### 4.4. Upstream port
- Integer 1..65535
- No conflicto de container_name esperado: `<name>_app` libre

### 4.5. Email
- Regex RFC simplificada
- Default: `process.env.DEFAULT_CERT_EMAIL`

### 4.6. `.env` (upload opcional)
- Size: max 32KB
- Content-type: `text/plain`, `application/octet-stream`, sin requerir
- Parse permisivo: líneas `KEY=VALUE` o comentarios `#`. Líneas invalidas → mantener tal cual (no estricto).
- Validar no contiene NULL bytes
- Si KEY duplicada → última gana (advertir)
- Mostrar preview cliente con valores enmascarados si key matches `/(PASS|SECRET|KEY|TOKEN|CREDENTIAL|PRIVATE)/i`

### 4.7. Flags avanzados
- `skip_dns: bool` (default false)
- `staging_cert: bool` (default false; usar LE staging para evitar rate limit en tests)
- `build_timeout_s: number` (default 600, max 1800)
- `health_timeout_s: number` (default 90, max 300)

## 5. Pipeline — paso a paso con I/O exacta

### Phase: `queued`
- INSERT en `deploys`. Devuelve `id`.
- Respond `202` + abre SSE.

### Phase: `validate` (timeout 30s)
- Ejecutar validaciones §4
- Pre-flight host:
  - Disk free en `/var/www` > 2GB (`df -B1 /var/www`)
  - Memoria libre > 256MB
  - Docker daemon responde (`docker info`)
  - Compose plugin disponible (`docker compose version`)
- Falla → `failed` phase=`validate`, error específico. No hay rollback (nada creado).

### Phase: `clone` (timeout 300s)
- `mkdir -p /var/www`
- `git clone --depth 1 --single-branch <url> /var/www/<name>`
  - `--depth 1` ahorra espacio; suficiente para deploy. Si user quiere full history → flag `full_history` (no v1).
- Permisos: `chown -R 1000:1000 /var/www/<name>` (ubuntu uid) si backend container puede sudo (puede con docker socket). Skip si no.
- Capture stdout/stderr a deploy_logs.
- Idempotente: si dir ya existe → skip (validate ya garantiza no existe; defensive).
- Rollback: `rm -rf /var/www/<name>` (atómico, mismo FS).

### Phase: `env`
- Determinar source en orden:
  1. **Upload**: si llegó `env_content` (size>0) → escribir `/var/www/<name>/.env` mode 0600, chown 1000:1000
  2. **`.env.example`**: si existe `/var/www/<name>/.env.example` → `cp .env.example .env` chmod 0600 + advertir "valores placeholder"
  3. **Generar desde compose**: parsear `docker-compose.yml` extraer `\${VAR}` patrones únicos → escribir `.env` con `VAR=` + comentario `# TODO`
  4. **Sin .env**: continuar (advertencia warn)
- Skip si `.env` ya existe (idempotente)
- Rollback: borrar `.env` SI esta phase lo creó (marcar en log).

### Phase: `detect` (timeout 5s)
- Buscar en orden:
  1. `/var/www/<name>/docker-compose.yml` → stack=`compose`
  2. `/var/www/<name>/compose.yml` → stack=`compose`
  3. `/var/www/<name>/Dockerfile` (raíz) → stack=`dockerfile_only`. Generar compose mínimo en `/var/www/<name>/docker-compose.yml`:
    ```yaml
    services:
      app:
        build: .
        container_name: ${NAME}_app
        restart: always
        env_file: [.env]
        networks: [${NAME}_net, reverse_proxy]
        healthcheck:
          test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:${PORT}/ >/dev/null 2>&1 || curl -fsS http://127.0.0.1:${PORT}/ >/dev/null 2>&1 || exit 1"]
          interval: 15s
          timeout: 3s
          start_period: 30s
          retries: 5
    networks:
      ${NAME}_net: { driver: bridge }
      reverse_proxy: { external: true }
    ```
  4. Nada → `failed` phase=`detect`. Rollback: rm dir.
- Validar compose con `docker compose -f <path> config -q` → si syntax bad → `failed`.
- Verificar al menos un servicio publicará el puerto upstream (escanear `expose:` o intent del Dockerfile EXPOSE). Si no → warning (no bloquea).

### Phase: `build` (timeout `build_timeout_s`)
- `cd /var/www/<name> && docker compose build --pull` (pull para base images frescas)
- Captura stdout/stderr stream → deploy_logs line-by-line
- Falla → `failed`. Rollback: nada (no se inició container). Image quedó cached — limpiar con `docker image prune -f --filter "label=com.docker.compose.project=<name>"` (best effort).

### Phase: `test` (blue-green spec 05)
Reutilizar lógica ya implementada en `deployRepo`:
- Generar override `/tmp/compose-canary-<id>.yml` con container_name+ports reset
- `docker compose -p canary-<name> -f orig -f override up -d`
- Wait `health_timeout_s`
- `docker compose -p canary-<name> down -t 5 -v` (sí `-v` para limpiar volúmenes anónimos del test stack)
- Si test ok → siguiente phase
- Si test fail → `failed`. Rollback: rm dir, sin tocar nginx ni certs (no se crearon).

### Phase: `up` (timeout 120s)
- `cd /var/www/<name> && docker compose up -d` (sin --build, ya buildado)
- Wait 60s healthcheck (3s polling)
- Si fail → `failed`. Rollback:
  - `docker compose down -t 10 -v`
  - rm dir
  - Cleanup `<name>_*` containers/networks/volumes

### Phase: `nginx` (timeout 30s)
- **Determinar container target**: `<name>_app` si stack=dockerfile_only; si compose, escanear servicios con `expose: <port>` o puerto matching → tomar nombre `container_name`. Si ambiguo: pedir al usuario en wizard (advanced) o defaultear primer servicio.
- Backup site conf si existe (no debería tras validate)
- Escribir `/var/www/.nginx/sites-generated/<domain>.conf` con template HTTP-only inicial (sin ssl_certificate) — el cert aún no existe:
  ```
  server { listen 80; server_name <domain>; location ^~ /.well-known/acme-challenge/ {...} location / { return 200 "pending-cert"; } }
  ```
- `docker exec nginx_reverse_proxy nginx -t` → si fail rollback
- `docker exec nginx_reverse_proxy nginx -s reload` → si fail rollback
- Rollback: rm conf + reload nginx + rm dir + containers down

### Phase: `cert` (timeout 180s)
- Pre-check ACME path: HTTP GET `http://<domain>/.well-known/acme-challenge/<token>` con token plantado en `/var/www/certbot/.well-known/acme-challenge/<token>`. Si no devuelve el token → `failed` (DNS o nginx mal). Hint específico.
- `docker run --rm certbot/certbot certonly --webroot -w /var/www/certbot -d <domain> --email <email> --agree-tos --non-interactive` + flag `--staging` si `staging_cert=true`
- Verificar `/etc/letsencrypt/live/<domain>/fullchain.pem` existe
- Sobreescribir conf con plantilla HTTPS completa (HSTS, headers, proxy_pass `<container>:<port>`, websocket-ready, client_max_body_size 10m)
- `nginx -t` + `nginx -s reload`
- Rollback: complejo (no borramos cert — LE rate limit) — solo borramos conf + reload + rm dir + containers down. Cert queda huérfano pero no daña. Audit warn.

### Phase: `webhook` (timeout 5s)
- `ensureRepoCfg(name)` ya genera secret. Devolver URL + secret en evento SSE.
- Marcar `repos_config.webhook_enabled = 1`

### Phase: `done`
- UPDATE deploys SET status=ok, phase=done, finished_ts=now
- Audit log: `DEPLOY_NEW name=<name> domain=<domain> ok=1 user=<user>`
- SMTP email summary al admin (no al user.email — no tenemos email por user todavía)
- SSE `event: done`, cerrar stream

### Rollback automático (tras failed)
Ejecutado en función `rollback(deployId)`:
1. Marcar phase=`failed` con error final
2. Recorrer logs en reverse para saber qué se hizo
3. Acciones (en orden):
   - `docker compose -p canary-<name> down -v` (limpia test stack si quedó colgado)
   - `docker compose down -t 10 -v` en `/var/www/<name>` si dir existe
   - `rm /var/www/.nginx/sites-generated/<domain>.conf` si existe
   - `nginx -t && nginx -s reload`
   - `rm -rf /var/www/<name>`
   - Cleanup orphans: `docker network rm <name>_<svc>_net 2>/dev/null` por cada network detectada
   - NO borrar cert
4. Marcar `rollback_done=1` o `rollback_partial=1`
5. SSE `event: fail` con `phase`, `error`, `rollback_status`
6. Email admin con resumen + log

## 6. Endpoint backend — contrato exacto

```
POST /api/deploy/new
Auth: requireOp (admin|operator)
Content-Type: multipart/form-data (busboy)

Campos:
  url            string required
  name           string optional
  domain         string required
  upstream_port  integer required
  email          string optional
  skip_dns       boolean optional
  staging_cert   boolean optional
  build_timeout_s integer optional
  health_timeout_s integer optional
  env            file optional (max 32KB, text/plain)

Pre-response handshake: validate síncrono mínimo (path libre, domain libre, no concurrency conflict).
Si validate-pre OK → 202 Accepted + set headers SSE:
  Content-Type: text/event-stream
  Cache-Control: no-cache
  X-Accel-Buffering: no
  Connection: keep-alive

Stream:
  event: start  data: {"id":"<uuid>","phases":["validate","clone","env","detect","build","test","up","nginx","cert","webhook"]}
  event: phase  data: {"phase":"clone","status":"running","seq":1}
  event: log    data: {"phase":"clone","level":"info","message":"Cloning into ...","seq":2}
  event: phase  data: {"phase":"clone","status":"ok","seq":12}
  event: phase  data: {"phase":"build","status":"running","seq":13}
  ...
  event: done   data: {"id":"...","domain":"...","webhook_url":"...","webhook_secret":"...","duration_ms":...}
  event: fail   data: {"id":"...","phase":"cert","error":"...","rollback_status":"complete"}

Cliente debe procesar `event:` lines (no JSON sin event para hacerlo simple).

Errores pre-handshake:
- 400 + JSON con `error: bad_<field>`
- 401 unauth
- 403 forbidden (no role)
- 409 path_in_use | domain_in_use | concurrency_conflict
- 413 env_too_large
- 503 too_many_deploys (Retry-After: 60)
```

## 7. Frontend — wizard exacto

### Pestaña sidebar
- ID: `deploy_new`
- Icon: 🚀 (o svg rocket)
- Label: "Desplegar nuevo"
- Visibilidad: `canWrite`
- Help: "Asistente para clonar repo + configurar + emitir cert + publicar dominio en un click"

### Componente `DeployWizard`
3 pasos visuales (motion AnimatePresence x slide):

**Paso 1 — Datos** (validación on-blur):
- URL git: input + indicador `git ls-remote` async on-blur (spinner + ✓ / ✗)
- Nombre directorio: auto-fill al cambiar URL, editable
- Dominio: input + DNS check on-blur (`getent` via backend `/api/deploy/precheck?domain=`)
- Puerto upstream: number input 1-65535
- Email LE: input default = `me.email` o `DEFAULT_CERT_EMAIL`
- Toggle "Saltar check DNS" (advertencia)
- Toggle "Usar LE staging (no rate-limit, cert no válido para browsers — para tests)"
- Botón "Continuar" (deshabilitado si validaciones in-flight)

**Paso 2 — Variables de entorno**:
- Drag-drop zone (highlight motion al hover dragover)
- Si soltado: parse client-side + preview con redact + tamaño + count vars
- Botón "Quitar"
- Banner azul si `.env.example` detectado server-side (precheck)
- Banner gris si compose detectado con `${VARS}` → "Generaré template"
- Botón "Continuar" / "Volver"

**Paso 3 — Confirmar y desplegar**:
- Resumen tabla:
  - URL · /var/www/<name> · <domain>:<port> · email · staging? · env source
- Botón "Desplegar" → POST SSE
- Tras click → cambia a vista live:
  - Lista phases con estados (queued/running/ok/fail) animados
  - Log scrollable con auto-scroll
  - Al fail → mostrar phase rojo + error + botón "Reintentar" (re-validate desde step 1 con valores pre-llenados)
  - Al ok → modal éxito con:
    - URL final `https://<domain>` con favicon scrape (next step)
    - Webhook URL + secret (botones copiar)
    - Instrucciones GitHub paste
    - Botón "Ir al sitio" / "Cerrar"

### Animaciones
- Steps 1→2→3: AnimatePresence mode="wait" + x slide ±40
- Drag-drop zone: scale 1.02 + glow on hover
- Phase pill: pulse mientras `running`, checkmark pathLength animado al `ok`
- Log lines: fade-in + slight x slide

### Estados front
- `useDeployState`: idle, validating, ready, deploying, done, failed
- AbortController para SSE → si user navega fuera, abort stream

## 8. Seguridad — checklist

- Solo HTTPS o SSH git URL
- Sanitización dominio antes de pasarlo a shell (regex strict)
- `name` regex strict
- `.env` parse defensive: no eval, no interpolation server-side
- Multipart parser (`busboy`) con limits estrictos: `fileSize: 32*1024`, `fields: 20`, `files: 1`
- Audit log INSERT antes de cada `sh()` call destructivo
- Rate limit: max 5 `POST /api/deploy/new` por user/hora
- Lock files en `/tmp/deploy-<name>.lock` para evitar race entre nodes (innecesario en single-instance pero defensive)
- Cleanup logs: no contienen secrets (env redact antes de logar)
- SSE auth: el endpoint requireOp. Si cookie expira mid-stream → close 401

## 9. Observabilidad

- Cada deploy → registro en `deploys` + `deploy_logs`
- Métricas (in-memory exportables):
  - Total deploys / hora
  - % success
  - Avg duration por phase
  - Top errores
- Endpoint `GET /api/deploys?limit=50&user=<>&status=<>` (admin)
- Endpoint `GET /api/deploys/:id/logs?since_seq=N` (auth) — paginación incremental
- Endpoint `GET /api/deploys/:id/stream` (auth) — SSE reanudar log en vivo si reconectas
- UI tab "Histórico" dentro de pestaña Despliegues con tabla

## 10. Limpieza periódica

Cron in-process (cada 24h):
- DELETE deploys WHERE ts < now - 90d
- DELETE deploy_logs WHERE deploy_id NOT IN (SELECT id FROM deploys) OR ts_ms/1000 < now - 30d
- `docker image prune -f --filter "until=168h"` (best effort, log)
- Detectar dirs huérfanos en `/var/www` sin entrada en `deploys` ni `repos_config` (warn admin)

## 11. Casos borde y comportamiento

| Caso | Comportamiento |
|---|---|
| URL incorrecta (404) | `ls-remote` falla en validate → 400 `url_unreachable` |
| URL privada sin SSH key | `ls-remote` falla → 400 + hint "configure SSH key o usa HTTPS público" |
| DNS aún no propagado | si skip_dns=false → 400 `dns_mismatch` (con IP detectada vs esperada) |
| Dominio detrás CF proxied (orange) | DNS check pasa (CF IPs in allowlist nginx) **pero** ACME HTTP-01 falla — backend detecta en pre-check ACME → mensaje específico "pon DNS gris durante emisión, luego naranja" |
| LE rate limited (5/week) | error tras certbot → email user + flag `staging_cert` sugerido |
| Build > timeout | kill + rollback |
| Docker compose syntax error | detect.config falla → rollback |
| Container nunca healthy | timeout test → rollback (no toca prod) |
| El usuario cierra el navegador mid-deploy | pipeline sigue en backend. SSE muere. Estado consultable via `/api/deploys/:id` |
| Concurrent same domain | segundo POST → 409 `domain_in_use` (locks) |
| `.env.example` incluye comillas mal cerradas | parser permisivo, persiste tal cual, warn |
| Disk lleno mid-build | falla detectable (df pre-check). Si pasa post-check → rollback intenta cleanup, audit fail |
| Container target en compose no expone el upstream_port declarado | warning, nginx site se crea igual; user puede editarlo después |
| `.env.example` con `${...}` syntax (terraform-style) | parse simple no resuelve, persiste literal |
| nginx_reverse_proxy down | precheck falla → fix antes |
| Backend reinicia mid-deploy | al boot, deploys en estado `running` se marcan `failed` con error="backend restart" + intenta rollback automático. Si rollback no es posible (no sabe en qué phase estaba) → marcar `rolledback_partial` |

## 12. TDD — Tests obligatorios

### Tests backend (`tests/backend/deploy.test.js` nuevo)

```
POST /api/deploy/new sin auth → 401
POST /api/deploy/new como viewer → 403
POST /api/deploy/new url no git → 400 bad_url
POST /api/deploy/new url file:// → 400 bad_url
POST /api/deploy/new domain con espacios → 400 bad_domain
POST /api/deploy/new upstream_port 0 → 400 bad_port
POST /api/deploy/new upstream_port 99999 → 400 bad_port
POST /api/deploy/new name "viewerSoftware" → 400 reserved_name
POST /api/deploy/new path /var/www/edvardks ya existe → 409 path_in_use
POST /api/deploy/new domain edvardks.com ya en uso → 409 domain_in_use
POST /api/deploy/new env file 50KB → 413
POST /api/deploy/new env file con NULL byte → 400 invalid_env
Precheck DNS dominio inexistente → 400 dns_mismatch (con skip_dns=false)
Concurrent: 2 requests misma URL+name en <1s → segundo 409 concurrency_conflict
Rate limit: 6 POSTs en 1h mismo user → 6º 429
GET /api/deploys lista deploys del usuario (admin ve todos)
GET /api/deploys/:id detalle
GET /api/deploys/:id/logs paginado
SSE stream emite secuencia phases esperada
Rollback tras failed in phase 'cert' → /var/www/<name> NO existe, site conf NO existe, nginx reload ok
Rollback tras failed in phase 'build' → solo dir, nada de site/cert
busboy: rechaza multipart sin url
busboy: ignora campos desconocidos
```

### Tests E2E manual (no automatizables aquí)

Repo dummy en GitHub `EdvardKS/viewer-test-app`:
- README + Dockerfile que sirve `Hello World` en :3000
- `.env.example` con `MESSAGE=hello`

Wizard:
- URL repo
- Domain `test.edvardks.com` (configurado DNS A → server IP, NO CF proxy)
- Port 3000
- Email developerweks@gmail.com
- staging_cert=true (para no gastar LE rate limit)

Verificaciones tras done:
- `curl -sk https://test.edvardks.com/` → 200 "Hello World"
- `docker ps | grep test_app` → running healthy
- `/var/www/.nginx/sites-generated/test.edvardks.com.conf` existe
- `/etc/letsencrypt/live/test.edvardks.com/fullchain.pem` existe (staging cert)
- `repos_config` tiene entry `test` con webhook_secret
- Webhook URL devuelto se puede configurar en GitHub
- Push trivial → auto-deploy se dispara → flujo blue-green pasa → verde

Cleanup test:
- DELETE `/api/repos/test` (admin) → rollback completo

## 13. Estimación

- Backend: ~500 LOC nuevas (endpoint + state machine + rollback + busboy + SSE)
- Frontend: ~400 LOC (wizard 3 steps + SSE consumer + drag-drop)
- Migration SQL: 2 tablas + índices
- Dependencias nuevas: `busboy` (~30KB)
- Tests: ~25 tests nuevos
- Tiempo estimado: 2-3h codificación + 1h tests + 30min E2E

## 14. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| LE rate limit en testing | `staging_cert` flag default-false; tests usan staging endpoint |
| Build atrapado consumiendo CPU/RAM | timeout 600s + `mem_limit` ya en compose |
| Race condition lock file no atómico en NFS | sólo single-instance, no NFS — OK |
| SSE muere con CF Cloudflare timeout (~100s) | `X-Accel-Buffering: no` + heartbeat cada 30s `: keepalive\n\n` |
| Usuario cierra navegador → pipeline sigue | persiste en SQLite + UI consultable `/api/deploys/:id` |
| `docker compose down -v` borra volúmenes con datos reales | el `-v` solo en CANARY phase (project name distinto) — prod usa `down` sin `-v` en rollback solo si phase < cert |
| Backend crash mid-deploy | boot cleanup marca como failed + dispara rollback |
| Cert emitido pero rollback dispara | NO borrar cert (LE rate limit). Audit warn |

## 15. Plan de entrega

1. Tú apruebas SDD (este doc) + TDD (lista §12).
2. Genero tests primero (red).
3. Implemento mínimo para verde: backend endpoint + state machine + rollback.
4. Implemento frontend.
5. Tests pasan localmente.
6. Deploy a viewer.edvardks.com.
7. E2E manual con repo dummy.
8. Spec marcada como `v0.20`.

## 16. Versionado

- Este Spec: `06-deploy-wizard.md` v1.0
- Cambios futuros: append `## Changelog` al final.

---

## Anexo A — Diagrama secuencia textual

```
Cliente                Backend                 Docker/Nginx/Git
  |  POST /api/deploy/new (mp/form)  |
  |--------------->|                  |
  |                |  validate(*)     |
  |                |  busboy parse env|
  |                |  INSERT deploys  |
  |  <-- 202 + SSE start              |
  |                |--> git ls-remote |
  |  <-- event:phase clone running    |
  |                |--> git clone     |
  |  <-- log stream                   |
  |  <-- event:phase clone ok         |
  |                | escribir .env    |
  |                | detectar stack   |
  |                |--> compose build |
  |  <-- log stream                   |
  |                |--> compose -p canary up -d -f override|
  |                |    wait health   |
  |                |--> compose -p canary down -v          |
  |                |--> compose up -d (real)               |
  |                |    wait health                        |
  |                |--> nginx -t / write conf / reload     |
  |                |--> certbot certonly                   |
  |                |--> nginx HTTPS conf / reload          |
  |                |    ensureRepoCfg() webhook            |
  |  <-- event:done {url, webhook}    |
  |                | UPDATE deploys=ok|
```

## Anexo B — Mensajes error normalizados

| Code | HTTP | Phase | UI hint |
|---|---|---|---|
| bad_url | 400 | validate | "URL git inválida (debe ser https://...git o git@...git)" |
| url_unreachable | 400 | validate | "No se puede acceder al repo. Verifica permisos y URL." |
| bad_domain | 400 | validate | "Dominio inválido (e.g. app.midominio.com)" |
| dns_mismatch | 400 | validate | "DNS no apunta al servidor. Configura A record o usa skip_dns." |
| bad_port | 400 | validate | "Puerto debe ser 1-65535" |
| reserved_name | 400 | validate | "Nombre reservado por el sistema" |
| path_in_use | 409 | validate | "Ya existe `/var/www/<name>`" |
| domain_in_use | 409 | validate | "Dominio ya configurado en nginx" |
| concurrency_conflict | 409 | validate | "Hay otro deploy en curso para ese path/dominio" |
| disk_full | 500 | validate | "Disco saturado en /var/www" |
| docker_down | 500 | validate | "Docker daemon no responde" |
| clone_failed | 500 | clone | "Clone falló (ver log)" |
| build_failed | 500 | build | "Build falló (ver log)" |
| test_unhealthy | 500 | test | "Stack de prueba no llegó healthy" |
| nginx_invalid | 500 | nginx | "nginx -t rechazó la conf generada" |
| acme_unreachable | 500 | cert | "ACME challenge no alcanzable (DNS o CF proxied)" |
| cert_failed | 500 | cert | "LE rechazó emisión (ver log, posible rate-limit)" |
| internal | 500 | any | "Error interno (audit log)" |

---

# Aprobación

Marca lo que apruebas o pide cambios:

- [ ] Pipeline 10 fases con state machine
- [ ] Tablas SQLite deploys + deploy_logs (retención 90d/30d)
- [ ] Locks por name/domain + max 5 concurrent
- [ ] Validación URL git con `ls-remote` previo
- [ ] DNS precheck con flag skip
- [ ] LE staging flag opcional
- [ ] `.env` upload drag-drop + parser permisivo + redact preview
- [ ] Detect stack: compose / Dockerfile only (genera compose) / fail
- [ ] Blue-green test stack obligatorio con project name + override
- [ ] Nginx site backup + rollback
- [ ] Cert con webroot + retry hint
- [ ] Webhook secret auto-generado al final
- [ ] Rollback determinista por fase
- [ ] SSE multipart con event tipados + heartbeat
- [ ] Wizard 3 pasos con animaciones motion + drag-drop
- [ ] Pestaña sidebar `deploy_new` solo canWrite
- [ ] Métricas + endpoint `GET /api/deploys` para histórico
- [ ] 25 tests TDD según §12

Aprueba todos / di cuáles cambias / di cuáles eliminas / añade requisitos.
