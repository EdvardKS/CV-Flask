# Spec: About y lanzadores externos
**Estado:** DOCUMENTADO (ingeniería inversa del código)
**Ámbito:** src/apps/about/*, src/apps/_shared/*, src/apps/{github,linkedin,f5,iaeks}/manifest.ts
**Revisión:** 2026-06-08

## 1. Propósito

Documentar dos elementos del OS Portfolio (Next.js 15 + TypeScript):

- La **app About** (`Léeme`), una ventana informativa estática que explica qué es el portfolio y cómo usarlo.
- El **patrón de "app externa"**: manifests cuyo icono no abre una ventana del escritorio, sino que ejecutan un *deep link* a una URL externa o disparan una acción especial del sistema. Estos lanzadores comparten un componente *stub* placeholder y se diferencian de las apps normales únicamente por campos del manifest.

Todo lo descrito proviene exclusivamente del código leído.

## 2. App About

Definida en [manifest.ts](../../src/apps/about/manifest.ts) y [AboutApp.tsx](../../src/apps/about/AboutApp.tsx).

**Manifest:**

| Campo | Valor |
|---|---|
| `id` | `about` |
| `title` | `Léeme` |
| `icon` | `info` |
| `category` | `system` |
| `defaultSize` | `560 × 440` |
| `singleton` | `true` (una sola instancia) |
| `description` | `Qué es esto y cómo funciona` |
| `Component` | `AboutApp` |

**Componente** ([AboutApp.tsx](../../src/apps/about/AboutApp.tsx)): es un componente cliente (`'use client'`) puramente estático, sin estado ni props. Renderiza contenido HTML/JSX fijo con estilos inline (`lineHeight: 1.6`):

- Encabezado de bienvenida ("Bienvenido al OS Portfolio") describiendo el portfolio como un SO estilo Windows XP en Next.js 15 + TypeScript.
- Sección **"Cómo se usa"**: doble-click para abrir iconos, arrastrar barra de título, *snap* a mitad de pantalla (bordes izq./der.), maximizar (borde superior), redimensionar desde 8 bordes/esquinas, doble-click en barra de título para maximizar/restaurar, y persistencia de posición/tamaño en `localStorage`.
- Sección **"Apps disponibles"**: lista descriptiva de Mi CV, Proyectos, Quiz, Padel Scout y Contacto.

A diferencia de los lanzadores externos, About **sí** abre una ventana normal del escritorio (no tiene `externalUrl` ni `customAction`).

## 3. Patrón ExternalAppStub

El tipo `AppManifest` ([types.ts](../../src/os/types.ts)) define tres campos opcionales que alteran el comportamiento al hacer doble-click sobre el icono, **saltándose** la apertura de ventana:

```ts
externalUrl?: string       // doble-click abre esta URL en pestaña nueva (sin ventana)
standaloneRoute?: string   // doble-click navega a una ruta in-app (sin ventana)
customAction?: 'reload'    // doble-click dispara una acción de escritorio custom
```

El despacho ocurre en [DesktopIcon.tsx](../../src/os/DesktopIcon.tsx), función `open()`, con este orden de prioridad:

1. `customAction === 'reload'` → `window.location.reload()` y `return`.
2. `externalUrl` → `window.open(url, '_blank', 'noopener,noreferrer')` y `return`.
3. `standaloneRoute` → `router.push(route)` y `return`.
4. En otro caso → `openApp(manifest)` (ventana normal).

El mismo patrón se interpreta en [StartMenu.tsx](../../src/os/StartMenu.tsx).

**`ExternalAppStub`** ([ExternalAppStub.tsx](../../src/apps/_shared/ExternalAppStub.tsx)) es el componente *placeholder* que estos manifests asignan a `Component` para cumplir el contrato del tipo. Según su comentario, el icono/menú interceptan el click y abren `externalUrl` directamente, por lo que el stub **rara vez se renderiza**; se mantiene como red de seguridad. Renderiza un `<div>` centrado con el texto "Esta app abre un enlace externo en una pestaña nueva."

Existe una variante del patrón que **no** usa el stub: el manifest de F5 define su propio componente trivial `NoopApp` (devuelve `null`), porque su acción real es `customAction: 'reload'` y nunca pretende renderizar contenido.

## 4. Tabla de lanzadores

| id | Título | Icono | Mecanismo | Destino / Acción | Categoría | Component | Manifest |
|---|---|---|---|---|---|---|---|
| `github` | GitHub | `github` | `externalUrl` | `https://github.com/EdvardKS` (pestaña nueva) | `tool` | `ExternalAppStub` | [manifest.ts](../../src/apps/github/manifest.ts) |
| `linkedin` | LinkedIn | `linkedin` | `externalUrl` | `https://www.linkedin.com/in/edvardks/` (pestaña nueva) | `tool` | `ExternalAppStub` | [manifest.ts](../../src/apps/linkedin/manifest.ts) |
| `iaeks` | IAEKS | `iaeks` | `externalUrl` | `https://iaeks.com` (pestaña nueva) | `tool` | `ExternalAppStub` | [manifest.ts](../../src/apps/iaeks/manifest.ts) |
| `f5` | F5 | `refresh` | `customAction: 'reload'` | `window.location.reload()` (recarga la pantalla) | `system` | `NoopApp` (interno, `null`) | [manifest.ts](../../src/apps/f5/manifest.ts) |

Notas por lanzador:

- **github / linkedin**: `defaultSize` 400×200, `description` "Mi perfil de GitHub" / "Mi perfil de LinkedIn". No son singleton.
- **iaeks**: `defaultSize` 400×200. `description` extensa: "Mi negocio: soluciones de automatización, CRM e IA para pequeñas empresas y autónomos. Producción, despliegue y todo end-to-end."
- **f5**: `singleton: true`, `defaultSize` 100×100, `description` "Refrescar la pantalla". No abre URL ni ventana; recarga la página.

## 5. Notas / deuda

- El `ExternalAppStub` es deliberadamente código muerto en la práctica: solo se vería si el flujo de despacho de `DesktopIcon`/`StartMenu` fallara en interceptar el click. Es una red de seguridad intencional, no deuda accidental.
- Inconsistencia menor de patrón: F5 reimplementa un `NoopApp` local en lugar de reutilizar `ExternalAppStub`. Es razonable (su `customAction` corta antes de renderizar y un componente de enlace externo no aplica), pero duplica la idea de "componente que nunca se ve".
- El `customAction` está tipado de forma cerrada como literal `'reload'` ([types.ts](../../src/os/types.ts)); añadir nuevas acciones de escritorio requiere ampliar el tipo y el `if`-chain de [DesktopIcon.tsx](../../src/os/DesktopIcon.tsx).
- Las URLs externas están hardcodeadas en cada manifest; no hay configuración centralizada de enlaces.
- `standaloneRoute` está definido en el tipo y soportado en el despacho, pero **ninguno** de los manifests revisados aquí lo usa.
- About duplica en JSX texto descriptivo de otras apps (CV, Proyectos, Quiz, Padel Scout, Contacto); si cambian esas apps, la pantalla About debe actualizarse a mano.
