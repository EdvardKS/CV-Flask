# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).

## [v0.21.2] — 2026-05-26 — Stopped containers card + per-stack stop

### Added
- Backend `POST /api/containers/:name/start` + `/stop` (op+) — individual container lifecycle
- Backend `POST /api/stacks/:project/stop` (op+) — `docker compose stop -t 10` (containers paran sin borrarse)
- Frontend nueva card "Contenedores parados" en Docker tab (debajo de Eventos Docker 1h):
  - Lista containers con State !== 'running'
  - Botón ▶ por fila para `docker start <name>` individual
  - Poll 3s, animación motion + toast feedback
- Frontend botón cuadrado rojo ■ junto a ↓ down en cabecera de stack — `docker compose stop` (containers paran pero NO se borran, reversible con ↑ up sin re-create)
- ConfirmModal soporta 3 acciones: down / stop / up con mensajes diferenciados

### Tests
- 122/122 siguen verdes (backend tests)

## [v0.21.1] — 2026-05-26 — Docker stack actions + alignment fix

### Added
- Backend `POST /api/stacks/:project/{up,down}` (op+) — docker compose up/down a nivel project
- Backend `POST /api/system/docker-prune` (admin) — limpia containers parados + images sin uso + redes huérfanas + builder cache (sin volúmenes)
- Frontend per-stack `↓ down` / `↑ up` botón en cada cabecera de stack en Docker tab
- Frontend botón `🧹 Limpiar` en header Docker (admin)
- Restaurada pestaña sidebar "Desplegar nuevo" (mal interpretación previa)
- Botón "＋ Clonar nuevo" en header de Repositorios → abre modal (en lugar de form siempre visible)

### Changed
- Container stats polling 10s → 5s
- Docker tab: alineación de acciones tabular-nums + columnas con anchos fijos
- Iconos de acciones con hover-bg en lugar de underline (más claro)

### Fixed
- Botones de acción Docker tab desalineados con anchos variables

### Tests
- 122/122 todos pasando

## [v0.21] — 2026-05-26 — UX/UI refinements

### Added
- `specs/07-ui-refinements.md` documenta este sprint (9 mejoras)
- `COMMITS.md` (este archivo) inicializado
- `tests/backend/v021.test.js` con 11 tests TDD
- Backend `/api/containers` ahora expone `Labels` (objeto) y `StartedAt` (ISO)
- Backend `/api/sites` ahora expone `issuedAt` además de `expiresAt`
- Backend `/api/sites/traffic/summary?since=1h` agregado: domains[].pct
- Backend `/api/logs/tail?source=stack:<project>` combina logs de todo el stack
- Backend `/api/deploys?status=failed` filtra
- Backend funciones puras `composeQuality(yaml)` + `generateOverride(issues)`
- Pipeline `runDeployPipeline.detect` analiza compose + escribe `docker-compose.override.yml` con fixes si detecta issues no fatales
- Frontend: agrupación Docker tab por stack con `motion.layout`
- Frontend: FAB top-right "🚀 Nuevo despliegue" abre modal wizard
- Frontend: Logs tab opción `stack:<project>`
- Frontend: Certs tab columnas Emitido / Caduca / Restan con colores warn
- Frontend: Nginx tab card "Tráfico global" con barras horizontales %
- Frontend: Audit modal sub-card "Deploys recientes" con filtro failed

### Changed
- Frontend polling `containers` 10s → **3s**, `repos` 15s → **5s**
- Frontend toasts position: `bottom-right` → **`bottom-left`**
- Sidebar: tab `deploy_new` retirado (sustituido por FAB)
- `useApi` con `motion.tr layoutId` evita flicker en reorder

### Fixed
- Reorder containers/repos en UI ya no remonta DOM (motion layout)

### Tests
- 11 tests nuevos v021 (api shapes + composeQuality + generateOverride)
- 111 tests previos siguen verde (auth + deploy)

## [v0.20] — 2026-05-26 — Deploy Wizard

### Added
- Spec 06 wizard "Desplegar Nuevo" (10 phases, blue-green, SSE)
- Endpoint `POST /api/deploy/new` (busboy multipart + SSE)
- Endpoint `POST /api/deploy/inspect` (shallow clone temporal + detección)
- Endpoint `GET /api/deploy/precheck` (rápido)
- Endpoint `GET /api/deploys` + `/:id` + `/:id/logs`
- Tablas SQLite `deploys` + `deploy_logs` (90d / 30d retention)
- Frontend pestaña `deploy_new` con `DeployWizard` 3 pasos
- 19 tests `deploy.test.js`

### Changed
- `runDeployPipeline` blue-green: build → canary test → swap real prod
- Auto-detect container/port desde compose o Dockerfile EXPOSE
- Email LE fijo `developerweks@gmail.com` (default backend, sin input)

## [v0.19] — 2026-05-26 — Blue-green deploy

### Added
- `deployRepo` test stack aislado con project name override
- Nginx auto-reload post-deploy
- Boot cleanup de deploys stuck en `running`

## [v0.18] — 2026-05-26 — Webhook auto-deploy

### Added
- Tabla `repos_config` (webhook_enabled, webhook_secret, last_status)
- Endpoint público `POST /api/webhooks/git/:name` con HMAC SHA256
- Endpoint `GET /api/repos/:name/{config,config/secret,deploy-log}`
- `PATCH /api/repos/:name/config` toggle / regen
- `POST /api/repos/:name/deploy` (manual)
- Status pill UI + modal webhook URL/secret

## [v0.17] — File explorer

### Added
- Spec 04, `/api/files/{ls,read,write,mkdir,rename,delete}`
- Frontend pestaña Archivos sandbox `/var/www/*` + editor

## [v0.16] — Sidebar multipage

### Added
- Spec 03, 7 tabs, sidebar derecha colapsable, login Matrix bg

## [v0.15] — Access control

### Added
- Spec 02, Cloudflare Turnstile, IP allowlist dinámica, device cookie
- Re-seed admin user `edvardks`

## [v0.14] — Snapshot + load spike

### Added
- `/api/system/snapshot` combinado
- Anomaly load_spike vs baseline 60min

## [v0.13] — Recovery + docker events

### Added
- `/api/auth/recovery/{request,redeem}`
- `/api/docker/events`

## [v0.12] — Multi-user roles

### Added
- Migración admin.json → users.json
- Roles admin/operator/viewer + middleware requireRole

## [v0.11] — Backup codes + exec

### Added
- 2FA backup codes one-time
- Container exec allowlist

## [v0.10] — 2FA TOTP + CSV + IPv6

### Added
- TOTP (otplib + qrcode)
- Audit CSV export
- Nginx IPv6 CF ranges

## [v0.9] — Inspect + audit

### Added
- `/api/containers/:name/inspect` con secret redaction
- Audit middleware + filtros

## [v0.8] — Nginx editor

### Added
- PUT `/api/sites/:domain/conf` con rollback
- Webhook env opcional

## [v0.7] — Nginx control

### Added
- `/api/sites/:domain/conf`, `/api/nginx/{test,reload}`
- Security headers globales

## [v0.6] — SQLite + alertas

### Added
- Tabla metrics 24h + alerts 7d
- Loop background sample + checkAlerts SMTP cooldown 1h

## [v0.5] — Network + change pwd

### Added
- `/api/system/network`, `/api/auth/change-password`
- Persistencia admin.json

## [v0.4] — Cron + restart UI

### Added
- Cron editor frontend + restart confirm + traffic panel

## [v0.3] — Disk + dark mode

### Added
- `/api/system/disk`, `/api/system/top`
- Dark mode toggle, logs modal

## [v0.2] — Container stats + cron editor

### Added
- Containers stats, traffic, cron PUT, scripts allowlist
- Frontend sparklines GSAP

## [v0.1] — MVP

### Added
- Express + Astro + React stack
- Login JWT + IP whitelist nginx
- Dashboard system/containers/sites/cron/backups
