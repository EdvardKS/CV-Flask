# Spec 06 — Wizard "Desplegar Nuevo": clone → env → up → cert → dominio

## Objetivo

Un flujo guiado de **un solo paso** que toma:
- URL git
- Nombre de directorio (auto-derivado)
- Dominio público (e.g. `app.edvardks.com`)
- Upstream port (e.g. `3000`)
- Email para Let's Encrypt
- (opcional) `.env` arrastrado desde el navegador

Y ejecuta automáticamente:
1. `git clone <url> /var/www/<name>`
2. Si el repo trae `.env.example` y no se subió `.env`: copia `.example` → `.env` (advertir keys placeholder)
3. Si el usuario arrastró `.env`: persiste en `/var/www/<name>/.env` con `chmod 600`
4. **Detecta** stack: si hay `docker-compose.yml` → usa compose; si hay `Dockerfile` solo → genera compose mínimo; si nada → error con sugerencia
5. **Build + test stack aislado** (blue-green del Spec 05) — si falla → revertir todo (rm -rf clone)
6. Si OK: **`docker compose up -d`** real
7. Espera healthcheck
8. **Crea entrada nginx**: `/var/www/.nginx/sites-generated/<domain>.conf` con HTTP→ACME + HTTPS proxy a `<container>:<puerto>`
9. **Emite cert Let's Encrypt** vía add_site_and_cert.sh existente
10. **`nginx -s reload`**
11. **Auto-config webhook**: añade entry en `repos_config` con secret generado. Devuelve URL+secret al usuario para que la pegue en GitHub.

Cada paso es **idempotente** y con rollback.

## Pasos detallados

### Validación previa (síncrono antes de empezar)
- URL git: regex válida + reachable (`git ls-remote --heads <url>`)
- Domain: regex + DNS resuelve a IP del servidor (o `--skip-dns` flag)
- Upstream port: numérico 1-65535
- Email: regex válida
- Path destino: `^/var/www/[a-z][a-z0-9_.-]{0,63}$` + no existe + no es reservado

### Generación `.env`
Estrategia (en orden):
1. **Si usuario subió** `.env` por drag-drop → usar ese
2. Si no, **si repo trae `.env.example`** → copiar a `.env` con warning de placeholders
3. Si no, **escanear** `docker-compose.yml` para `${VAR}` → generar `.env` con esas keys vacías + comentario `# TODO: rellenar`
4. Si no hay nada → continuar sin `.env`

### Detección stack
- `docker-compose.yml` o `compose.yml`: compose nativo
- Solo `Dockerfile`: generar compose mínimo en `/var/www/<name>/docker-compose.yml`:
  ```yaml
  services:
    app:
      build: .
      container_name: <name>_app
      restart: always
      networks: [<name>_net, reverse_proxy]
      env_file: [.env]
  networks:
    <name>_net: { driver: bridge }
    reverse_proxy: { external: true }
  ```
- Si no hay ni compose ni Dockerfile → abort + sugerencia

### Nginx site
Reutilizar template `/var/www/.nginx/templates/site-https.conf.tpl` ya existente.
Llamar al script `add_site_and_cert.sh <domain> <container>:<port> <email>` que ya valida DNS + ACME + cert + reload.

### Webhook auto-config
Backend ya crea entrada en `repos_config` al primer GET `/api/repos`. Tras clonar, hacer fetch interno o invocar `ensureRepoCfg(name)` directamente. Devolver URL+secret en response final.

## Endpoints nuevos backend

```
POST /api/deploy/new                    (op+)
Body: multipart/form-data
- url (string)
- name (string, opcional, default = repo name)
- domain (string)
- upstream_port (number)
- email (string, opcional, default DEFAULT_CERT_EMAIL)
- skip_dns (boolean opcional)
- env (file opcional, mime text/plain)

Response (Server-Sent Events stream):
- event:step data:{"phase":"validate","ok":true,"message":"..."}
- event:step data:{"phase":"clone","ok":true,"out":"..."}
- event:step data:{"phase":"env","ok":true,"source":"upload|example|generated|none"}
- event:step data:{"phase":"detect","ok":true,"stack":"compose|dockerfile|generated"}
- event:step data:{"phase":"build","ok":true}
- event:step data:{"phase":"test","ok":true}
- event:step data:{"phase":"up","ok":true}
- event:step data:{"phase":"nginx","ok":true}
- event:step data:{"phase":"cert","ok":true}
- event:step data:{"phase":"webhook","ok":true,"webhook_url":"...","secret":"..."}
- event:done data:{"ok":true,"url":"https://domain"}
```

Si cualquier paso falla → `event:fail` con `phase`, `error`, `rollback_log`. Rollback ejecuta:
- Stop containers nuevos
- rm -rf `/var/www/<name>`
- rm `/var/www/.nginx/sites-generated/<domain>.conf` (si fue creado)
- nginx reload
- Cert NO se borra (Let's Encrypt persiste). Email notify al admin para revisar.

## Frontend

### Nueva pestaña sidebar `🚀 Desplegar Nuevo`

Tras `🔏 Certificados`, antes de `📦 Repositorios`. Solo visible para `canWrite` (op+/admin).

### Flujo UI (3 pasos visuales)

**Paso 1 — Datos del proyecto**
- Input URL git
- Input nombre (auto-fill al perder foco URL)
- Input dominio
- Input upstream port
- Input email (auto-fill DEFAULT_CERT_EMAIL)
- Toggle "Skip DNS check"

**Paso 2 — Configuración `.env`** (skippable)
- Área drag-and-drop: soltar archivo `.env` → se queda en memoria, no se sube hasta confirmar
- Alternativas mostradas: "Detectaré .env.example automáticamente" / "Generaré template desde compose"
- Preview del .env si subió/detectó (con secretos enmascarados visualmente: `*****`)

**Paso 3 — Confirmación**
- Resumen: URL + path destino + dominio + puerto + email + fuente .env
- Botón **Desplegar** → POST `/api/deploy/new` (SSE)
- Panel en vivo: cada paso pinta ✓ verde / ✗ rojo / ⏳ spinner
- Al terminar: si OK → modal con webhook URL + secret + botón "Copiar" + link al dominio. Si fail → log + botón "Reintentar tras revisar"

### Animaciones
- Transición paso 1→2→3 con AnimatePresence
- Cada step del SSE: fade-in + checkmark animado pathLength
- Drag-drop: bg-moss-50 highlight cuando hover

## Seguridad

- `op+` mínimo (también `admin`). Viewer no puede.
- URL git debe ser HTTPS o SSH. No `file://`, no `--upload-pack=`.
- Domain validación + sandbox a `/var/www/.nginx/sites-generated/`.
- `.env` upload: max 32KB, content-type text/plain o application/octet-stream.
- Rollback completo si cualquier paso intermedio falla.

## Rollback

Cada paso registra qué hizo. Al fallar:
1. Para containers iniciados (compose down)
2. Borra clone (`rm -rf /var/www/<name>`)
3. Borra site conf si fue creado
4. Reload nginx
5. NO borra certs (LE rate limit 5/week/dominio)
6. Marca audit log

## Casos borde

- Dominio ya en uso: error temprano paso 1 (check `/var/www/.nginx/sites-generated/<domain>.conf` existe)
- Path ya en uso: error temprano
- DNS no resuelve y `skip_dns=false`: error
- LE falla (rate-limited / falta DNS / token mal): error, mantiene clone + containers (no rm) para que usuario pueda reintentar manual con `--skip-dns`. Pero ¿es bueno? Mejor rollback total: rm clone, marca cert_failed con instrucciones manuales.
- `.env` con líneas inválidas: parse permisivo, persiste tal cual
- Repo grande (>500MB): warning pero permite
- Build muy lento (>5min): timeout configurable
- Container sin healthcheck: aceptar `State.Running` como suficiente (60s)

## Limitaciones conocidas

- LE rate limit 5 certs por dominio/semana. Si reintentas mucho → bloqueo.
- Solo HTTP-01 challenge (no DNS-01). Servidor debe estar accesible públicamente vía puerto 80.
- DNS debe estar configurado por el usuario antes de pulsar Desplegar (o usar `skip_dns` + esperar).
- Sin soporte aún para: multi-container con múltiples dominios, paths /api separados (req cambios spec).

## TDD — Tests añadidos a `tests/backend/auth.test.js`

```
POST /api/deploy/new sin auth = 401
POST /api/deploy/new como viewer = 403
POST /api/deploy/new con url invalida = 400 (fase validate)
POST /api/deploy/new con domain invalido = 400
POST /api/deploy/new con upstream_port no numerico = 400
POST /api/deploy/new con path ya existe = 409
POST /api/deploy/new con domain ya en uso = 409
Parser .env upload max size = 413
SSE stream emite secuencia ['validate','clone',...,'done']
Rollback tras fallo en step 'cert' → /var/www/<name> NO existe + site conf NO existe
Tras deploy OK → repos_config tiene entrada + webhook secret retornado
```

## Archivos a modificar

- `backend/src/server.js`:
  - Endpoint `POST /api/deploy/new` con SSE response
  - Función `runDeployPipeline(input)` con orquestación + rollback
  - Helpers: `validateDeploy()`, `detectStack()`, `generateEnv()`, `installNginxSite()`, `issueCertFor()`
  - Aumentar `express.json` limit para FormData (multer? mejor `multipart` parser ligero o usar `busboy`)
- `backend/package.json`: añadir `busboy` (~30KB, sin deps) para multipart
- `frontend/src/components/Dashboard.jsx`: 
  - Nueva pestaña `deploy_new`
  - Componente `DeployWizard` con 3 pasos + SSE consumer + drag-drop dropzone
- `specs/06-deploy-wizard.md` (este)

## Riesgos

- **LE certs gastados en pruebas** — usar staging endpoint para tests (`--server https://acme-staging-v02.api.letsencrypt.org/directory` en certbot)
- **Build infinito** — timeout 5min por step
- **Rollback parcial** — si rm -rf falla post-fail → estado inconsistente. Log detallado en audit + email admin.

## Validación final

E2E manual con repo de ejemplo:
1. Crear repo dummy en GitHub con Dockerfile + .env.example
2. Wizard: URL + dominio + puerto 3000 + email
3. Verificar https://<dominio>/ 200
4. Pegar webhook secret en GitHub
5. Push trivial → auto-deploy se dispara → flujo blue-green ejecuta → verde

E2E test simulado backend: usar repo fake local + skip cert + verificar SSE stream completo.
