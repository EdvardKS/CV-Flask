# Spec 07 — UX/UI Refinements (v0.21)

## Objetivo

9 mejoras incrementales tras v0.20 (deploy wizard). Foco UX panel + endurecimiento pipeline deploy (compose quality check + override auto).

## Cambios

### 1. Docker tab agrupado por stack

**API**: `/api/containers` añade `Labels` (objeto) + `StartedAt` (ISO).

**Heurística**: agrupar por `Labels['com.docker.compose.project']`. Containers sin label → grupo `standalone`.

**UI**:
- Cada grupo con header: nombre stack + count + ratio healthy
- Containers ordenados StartedAt desc dentro del grupo
- Grupos ordenados por max(StartedAt) desc
- `motion.layoutId={c.ID}` para reorder fluido sin flicker
- Border-left con color derivado del hash del stack name

### 2. Real-time poll Docker + Repos

- `/api/containers` poll cada **3s** (era 10s)
- `/api/repos` poll cada **5s** (era 15s)
- `useApi` ya pausa polling si `document.hidden` ✓

### 3. Logs view stack completo

**API**: `/api/logs/tail?source=stack:<project>&limit=N`
- Recoge containers con label match
- Concat `docker logs --tail (N/count)` por cada container
- Prefijo `[<container_name>]` en cada línea

**UI**: select source añade group "Stacks" con cada `<project>` detectado.

### 4. FAB Nuevo despliegue

- Eliminar tab `deploy_new` del sidebar (queda `dashboard/nginx/docker/certs/repos/files/logs/profile`)
- `<NewDeployFab>` fixed top-right `top-4 right-4 z-30` (encima del sidebar)
- Click → modal con `<DeployWizard onClose>` reutilizado
- Solo visible si `canWrite`

### 5. Toasts bottom-left

- `fixed bottom-6 right-6` → `fixed bottom-6 left-6`
- Resto idéntico (AnimatePresence + glow)

### 6. Certs tab dates

**API**: `/api/sites` añade `issuedAt` parseando `openssl x509 -noout -startdate -in <cert>`. Devuelve ISO.

**UI** (cards o tabla):
- Sitios columnas: Dominio · Upstream · **Emitido** · **Caduca** · **Restan**
- Restan = `(expiresAt - now) / 86400000` (días). Color:
  - `< 14` → text-red-600 + ⚠
  - `< 30` → text-amber-600
  - resto → text-moss-700

### 7. Nginx traffic bars

**API nueva**: `/api/sites/traffic/summary?since=1h`
- Lee `/var/log/nginx/access.log` últimas N líneas
- Agrupa por `server_name` (heurística: parsea `host:` o `referer` o `request_line` para inferir dominio)
- Devuelve `[{domain, count, pct, top_status}]` ordenado count desc

**UI**:
- Card "Tráfico global (última hora)" en Nginx tab
- Cada dominio:
  ```
  <domain>                1234 (45%)
  ████████████░░░░░░░░░░░░░░░░
  ```
- Width % animada `motion` width

### 8. Audit deploys failed

**API**: `/api/deploys?status=failed&limit=N` filtra por status.

**UI**:
- Tab Audit (📋) sub-card "Deploys recientes"
- Filtro toggle "Solo failed"
- Status pill con color + click → modal con log

### 9. Compose quality + override auto

**API nueva**: `/api/deploy/quality-check?path=<repo>` lee compose + analiza issues.

**Función pura `composeQuality(yaml)`** (testeable):
Reglas:
- `host_ports`: servicio con `ports:` mapping `HOST:CONTAINER`
- `no_reverse_proxy`: ningún servicio en network `reverse_proxy` external
- `no_healthcheck`: servicio frontal sin healthcheck
- `no_restart`: servicio sin `restart:`
- `db_exposed`: servicio db con host ports

Devuelve `[{rule, severity:warn|error, service, fix}]`

**Función pura `generateOverride(issues, services)`**:
- Si `host_ports`: `services.<svc>.ports: !reset []`
- Si `no_reverse_proxy`: añadir `networks: [<existing>, reverse_proxy]` al servicio frontal + declarar `networks.reverse_proxy.external: true`
- Si `no_healthcheck`: añadir healthcheck stub
- Si `no_restart`: añadir `restart: always`
- Si `db_exposed`: `ports: !reset []` en db service

**Pipeline `runDeployPipeline` phase `detect`** post-detección:
- Llama `composeQuality(yaml)` sobre el `docker-compose.yml`
- Si hay issues no fatales: genera `docker-compose.override.yml` SI no existe ya
- Si existe → log warn, no sobreescribir
- Log issues + fixes en deploy_logs

## TDD — tests (11)

`tests/backend/v021.test.js`:

1. `/api/containers` devuelve cada item con `Labels` objeto y `StartedAt` string
2. `/api/sites` cada entry con `issuedAt` + `expiresAt` (cuando hay cert)
3. `/api/sites/traffic/summary?since=1h` devuelve `{since, total, domains:[{domain,count,pct}]}` con sum pct ≈ 100
4. `/api/logs/tail?source=stack:viewersoftware&limit=10` 200 + lines no vacío
5. `/api/logs/tail?source=stack:noexiste-xyz` retorna lines vacío (no error, count=0)
6. `/api/deploys?status=failed&limit=5` retorna solo items con status=failed
7. `composeQuality` detecta host_ports en yaml con `ports: ["3000:3000"]`
8. `composeQuality` detecta no_reverse_proxy en yaml sin networks reverse_proxy
9. `composeQuality` detecta no_healthcheck en servicio "frontend" sin healthcheck
10. `composeQuality` retorna [] en yaml conforme
11. `generateOverride` produce YAML válido con `ports: !reset []` para issue host_ports

## Aceptación

Listado en plan principal. Cada checkbox verificable manual o vía test.

## Versionado

Spec v1.0 — 2026-05-26. v0.21 viewerSoftware.
