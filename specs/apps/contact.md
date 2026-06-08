# Spec: App Contact

**Estado:** DOCUMENTADO (ingeniería inversa del código)
**Ámbito:** src/apps/contact/*, app/api/contact, src/lib/email.ts, app/contact
**Revisión:** 2026-06-08

---

## 1. Propósito

App de tipo formulario de contacto que permite al visitante enviar un mensaje
(nombre, email y texto) que llega por correo al propietario del portfolio. El
flujo es: formulario React (cliente) → `POST /api/contact` (validación +
rate limit) → envío SMTP vía nodemailer.

La app se integra en el escritorio (OS-like) como ventana singleton y dispone
además de una ruta dedicada `/contact` con deep-link.

---

## 2. Manifest

Definido en [`src/apps/contact/manifest.ts`](../../src/apps/contact/manifest.ts).

| Campo | Valor |
|-------|-------|
| `id` | `contact` |
| `title` | `Contacto` |
| `icon` | `mail` |
| `category` | `tool` |
| `defaultSize` | `{ width: 520, height: 560 }` |
| `singleton` | `true` (una sola instancia) |
| `deepLink` | `/contact` |
| `description` | `Envíame un mensaje` |
| `Component` | `ContactApp` |

La ruta [`app/contact/page.tsx`](../../app/contact/page.tsx) renderiza el
`Desktop` completo y un `DeepLinkOpener` con `appId="contact"`, de forma que al
entrar por URL directa se abre automáticamente la ventana de la app. Metadata de
página: `title: 'Contacto — Edvard K.'`.

---

## 3. Formulario y validación

Componente cliente: [`src/apps/contact/ContactApp.tsx`](../../src/apps/contact/ContactApp.tsx)
(`'use client'`).

**Stack:** `react-hook-form` + `zod` + `@hookform/resolvers/zod` (`zodResolver`).
Textos de etiquetas vía i18n (`useT` de `@lib/i18n/config`).

**Esquema de validación (cliente):**

| Campo | Regla zod |
|-------|-----------|
| `name` | `string().min(2).max(120)` |
| `email` | `string().email().max(200)` |
| `message` | `string().min(10).max(4000)` |

**Estado de UI** (`useState`): `'idle' | 'sending' | 'ok' | 'error'`, más
`errorMsg` para el texto de error.

**Flujo `onSubmit`:**
1. `setState('sending')`.
2. `fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })`.
3. Si `!res.ok`: intenta leer `res.json()` (con `.catch(() => ({}))`) y lanza
   `Error(body.error ?? 'HTTP <status>')`.
4. Si OK: `setState('ok')` y `reset()` del formulario.
5. En `catch`: guarda el mensaje en `errorMsg` y `setState('error')`.

**Render:**
- Estado `ok`: pantalla de confirmación con `✅`, título `t('messageSent')` y
  botón `OK` que vuelve a `idle`.
- Resto: formulario con tres campos (name con `autoComplete="name"`, email
  `type="email"` + `autoComplete="email"`, message como `textarea`
  redimensionable). Cada campo muestra `errors.<campo>.message` si falla la
  validación.
- Botón submit deshabilitado mientras `state === 'sending'`; muestra
  `t('send')…` durante el envío.
- Estado `error`: muestra `⚠️ {errorMsg}` debajo del botón.

> Nota: los mensajes de error de validación son los textos por defecto de zod
> (no hay mensajes personalizados ni traducidos).

---

## 4. API `/api/contact` (contrato request/response)

Handler: [`app/api/contact/route.ts`](../../app/api/contact/route.ts). Solo
expone `POST`.

**Request:**
- Método: `POST`
- `Content-Type: application/json`
- Body: `{ name, email, message }`

**Validación servidor (zod, idéntica al cliente):**

| Campo | Regla |
|-------|-------|
| `name` | `string().min(2).max(120)` |
| `email` | `string().email().max(200)` |
| `message` | `string().min(10).max(4000)` |

**Secuencia del handler:**
1. Resuelve IP del cliente: `x-forwarded-for` (primer valor, trimmed) →
   `x-real-ip` → `'anonymous'`.
2. Aplica rate limit (ver §6). Si excede → `429`.
3. Parsea JSON; si falla → `400 { error: 'Invalid JSON' }`.
4. `schema.safeParse(body)`; si falla → `400 { error: 'Validation', details: <zod flatten> }`.
5. `await sendContactEmail(parsed.data)`; en éxito → `200 { ok: true }`.
6. Si el envío lanza → log `console.error('[contact]', e)` y `500 { error: 'Send failure' }`.

**Respuestas:**

| Status | Body | Caso |
|--------|------|------|
| `200` | `{ ok: true }` | Mensaje enviado |
| `400` | `{ error: 'Invalid JSON' }` | Body no parseable |
| `400` | `{ error: 'Validation', details: {...} }` | Falla validación zod |
| `429` | `{ error: 'Rate limit exceeded. Try later.' }` | Rate limit superado |
| `500` | `{ error: 'Send failure' }` | Error en envío SMTP |

> El cliente lee `body.error` para mostrar el mensaje; los códigos `400`
> (validación) y `500` se presentan como texto genérico de error.

---

## 5. Envío email (nodemailer + env SMTP)

Módulo: [`src/lib/email.ts`](../../src/lib/email.ts).

**Tipo del payload:** `ContactPayload = { name, email, message }`.

**Transporter (lazy + cacheado):** se crea una sola vez (`let transporter`) en
`getTransporter()`. Configuración:

```
host:   SMTP_HOST
port:   SMTP_PORT (default 587)
secure: port === 465
auth:   { user: SMTP_USER, pass: SMTP_PASS }
```

Si falta `SMTP_HOST`, `SMTP_USER` o `SMTP_PASS` → lanza
`Error('SMTP not configured (...)')`.

**Variables de entorno:**

| Variable | Uso | Obligatoria | Default |
|----------|-----|-------------|---------|
| `SMTP_HOST` | Host del servidor SMTP | Sí | — |
| `SMTP_PORT` | Puerto | No | `587` |
| `SMTP_USER` | Usuario SMTP (y `from`/fallback de `to`) | Sí | — |
| `SMTP_PASS` | Contraseña SMTP | Sí | — |
| `CONTACT_RECIPIENT` | Destinatario del correo | No | `SMTP_USER` |

`secure` se activa automáticamente solo si el puerto es `465` (SMTPS).

**`sendContactEmail(payload)`:**
- Destinatario `to`: `CONTACT_RECIPIENT ?? SMTP_USER`; si ninguno existe →
  `Error('CONTACT_RECIPIENT not configured')`.
- Email construido:
  - `from`: `"CV Portfolio" <${SMTP_USER}>`
  - `to`: destinatario calculado
  - `replyTo`: `payload.email` (permite responder directamente al visitante)
  - `subject`: `[CV] Nuevo mensaje de ${payload.name}`
  - `text`: versión plana `De: <name> <<email>>\n\n<message>`
  - `html`: versión HTML con `escapeHtml` aplicado a `name`, `email` y
    `message`; el mensaje se muestra con `white-space:pre-wrap`.

**Anti-XSS en email:** `escapeHtml()` escapa `& < > " '` antes de inyectar los
valores del usuario en el cuerpo HTML del correo.

---

## 6. Casos borde / errores

- **Anti-spam / rate limiting:** implementado en el route con un `Map` en
  memoria (`buckets`). Límite por IP: `5` peticiones por ventana de
  `60_000 ms` (1 min). Algoritmo de ventana fija: primera petición (o ventana
  expirada) reinicia el contador; al alcanzar el límite devuelve `429`.
  - Limitación: el estado vive en memoria del proceso → no persiste entre
    reinicios ni se comparte entre instancias/serverless. En despliegues con
    múltiples instancias el límite es por-instancia, no global.
- **IP no resoluble:** si no hay `x-forwarded-for` ni `x-real-ip`, todas las
  peticiones caen en el bucket `'anonymous'` (comparten el mismo límite).
- **Body inválido / JSON malformado:** `400 Invalid JSON`.
- **Validación servidor:** doble validación (cliente y servidor) con el mismo
  esquema, por lo que el cliente no puede saltarse las reglas.
- **SMTP mal configurado:** `getTransporter()` o `sendContactEmail()` lanzan;
  el route lo captura como `500 Send failure` (el detalle solo va al log
  servidor, no al cliente).
- **Inyección HTML en el correo:** mitigada con `escapeHtml`.
- **Doble envío:** el botón se deshabilita durante `sending`, pero no hay
  protección de idempotencia en el servidor.

---

## 7. Notas / deuda técnica

- **Rate limit en memoria:** frágil en entornos serverless / multi-instancia
  (típico en Next.js sobre plataformas tipo Vercel). Considerar almacén externo
  (Redis/KV) si se requiere límite fiable y global. No hay limpieza activa de
  `buckets` (crece con IPs únicas hasta reinicio del proceso).
- **Sin honeypot ni CAPTCHA:** el único anti-spam es el rate limit por IP; no
  hay campo trampa ni verificación de bot.
- **Esquema duplicado:** el `schema` de zod está definido por separado en
  `ContactApp.tsx` y en `route.ts` (mismas reglas). Riesgo de divergencia; sería
  candidato a extraerse a un módulo compartido.
- **Mensajes de error de validación:** se muestran los textos por defecto de
  zod (en inglés), no traducidos vía i18n como el resto de la UI.
- **`replyTo` = email del visitante:** no se valida que coincida con un dominio
  verificado; es un input libre (mitigado a nivel formato por `email()`).
- **`from` fijo:** usa siempre `SMTP_USER`; según el proveedor SMTP, podría
  requerir que ese remitente esté autorizado/verificado para evitar rechazos.
- **Sin reintentos:** un fallo SMTP transitorio se traduce directamente en
  `500` sin reintento.
