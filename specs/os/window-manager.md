# Spec: Sistema operativo (gestor de ventanas)
**Estado:** DOCUMENTADO (ingeniería inversa del código)
**Ámbito:** src/os/*
**Revisión:** 2026-06-08

> Todas las rutas se citan como enlaces relativos a este documento (`specs/os/window-manager.md`). Solo se describe lo que el código muestra.

---

## 1. Propósito

`src/os/*` implementa un **escritorio simulado estilo Windows XP/11** sobre el que corre el portfolio. Cada "aplicación" del CV (currículum, mini-proyectos, herramientas, chat IA...) se abre como una **ventana flotante** dentro de un escritorio HTML, con barra de tareas, menú inicio, iconos arrastrables, drag/resize/snap de ventanas y varios adornos decorativos (fondo IA animado, panel de noticias, carrusel de fotos).

El estado de las ventanas vive en un **store Zustand persistido en `localStorage`** ([src/os/store.ts](../../src/os/store.ts)). Los componentes leen del store y disparan acciones (abrir, cerrar, focus, minimizar, maximizar, snap). El catálogo de apps proviene de un registro externo `@apps/_registry` (`APPS`, `APPS_BY_ID`), que provee objetos `AppManifest`; ese registro queda **fuera del ámbito de este spec** (`src/apps/_registry.ts`), pero se consume aquí.

---

## 2. Componentes

| Archivo | Rol |
|---|---|
| [src/os/store.ts](../../src/os/store.ts) | Store Zustand `useWM`: estado y ciclo de vida de ventanas, z-index, snap, persistencia. |
| [src/os/uiStore.ts](../../src/os/uiStore.ts) | Store Zustand `useUI`: panel de notificaciones y bandeja del sistema (tray). |
| [src/os/types.ts](../../src/os/types.ts) | Tipos: `WindowState`, `WindowBounds`, `SnapRegion`, `AppManifest`, `AppCategory`, `Locale`. |
| [src/os/Window.tsx](../../src/os/Window.tsx) | Render de una ventana (title bar, controles, body, handles de resize, preview de snap) + helper `iconGlyph`. |
| [src/os/useDraggable.ts](../../src/os/useDraggable.ts) | Hook de arrastre de la title bar con detección de snap en vivo. |
| [src/os/useResizable.ts](../../src/os/useResizable.ts) | Hook de redimensionado en 8 direcciones con mínimos. |
| [src/os/snap.ts](../../src/os/snap.ts) | Detección de zona de snap por bordes + cálculo del rectángulo de preview. |
| [src/os/Desktop.tsx](../../src/os/Desktop.tsx) | Composición raíz del escritorio: wallpaper, iconos, ventanas, taskbar, menú inicio, adornos. |
| [src/os/DesktopIcon.tsx](../../src/os/DesktopIcon.tsx) | Icono de escritorio (doble-click → abrir app / URL / ruta / acción). |
| [src/os/Taskbar.tsx](../../src/os/Taskbar.tsx) | Barra de tareas: botón Start, items de ventanas, bandeja (reloj, idioma, IA, notificaciones). |
| [src/os/StartMenu.tsx](../../src/os/StartMenu.tsx) | Menú inicio agrupado por categoría + "Cerrar todas las ventanas". |
| [src/os/DeepLinkOpener.tsx](../../src/os/DeepLinkOpener.tsx) | Abre una app automáticamente al montar (deep-link). |
| [src/os/AiWallpaper.tsx](../../src/os/AiWallpaper.tsx) | Fondo animado tipo red neuronal en canvas. |
| [src/os/NewsAside.tsx](../../src/os/NewsAside.tsx) | Aside de "Notificaciones" que consume `/api/news` (GitHub/LinkedIn). |
| [src/os/PhotoCarousel.tsx](../../src/os/PhotoCarousel.tsx) | Carrusel de fotos que abre el CV. |

---

## 3. Estado (store Zustand + persistencia)

### 3.1 `useWM` — gestor de ventanas

Definido en [src/os/store.ts:66](../../src/os/store.ts#L66) con middleware `persist`.

**Forma del estado** ([src/os/store.ts:11-26](../../src/os/store.ts#L11)):

| Campo | Tipo | Significado |
|---|---|---|
| `windows` | `WindowState[]` | Lista de ventanas abiertas (orden de inserción; el orden visual lo da `zIndex`). |
| `zTop` | `number` | Mayor z-index entregado hasta ahora; arranca en `10`. |
| `openInstanceCount` | `Record<string, number>` | Nº de instancias abiertas por `appId` (clave de manifest). Usado para el cascadeo. |
| `focusedId` | `string \| null` | Id de instancia con foco. |

**Acciones:** `openApp`, `close`, `focus`, `minimize`, `restore`, `toggleMaximize`, `snap`, `setBounds`, `setParams`.

### 3.2 Z-index

No hay reordenación del array `windows`; el apilado es puramente por `zIndex`. Cada vez que se abre o se hace `focus` de una ventana se incrementa `zTop` y se asigna ese valor a la ventana ([src/os/store.ts:143-151](../../src/os/store.ts#L143)). `zTop` **crece monótonamente y nunca se normaliza** → ver deuda técnica (§10).

### 3.3 Geometría y helpers internos

- `TASKBAR_H = 40` ([src/os/store.ts:7](../../src/os/store.ts#L7)): altura reservada para la taskbar; el "viewport útil" es `window.innerHeight - 40`.
- `viewport()` ([src/os/store.ts:28](../../src/os/store.ts#L28)): devuelve `{w,h}` útil. **Fallback SSR** `{1440, 900}` cuando `window` es `undefined`.
- `snapBounds(region)` ([src/os/store.ts:33](../../src/os/store.ts#L33)): traduce una `SnapRegion` a `WindowBounds` reales (mitades / cuadrantes / pantalla completa para `top`).
- `cascadePosition(count)` ([src/os/store.ts:48](../../src/os/store.ts#L48)): posición en cascada; origen `{x:120,y:40}`, paso `28px`, ciclo de **8** (`count % 8`), con tope para no salirse del viewport.
- `clampToViewport(w)` ([src/os/store.ts:57](../../src/os/store.ts#L57)): recorta tamaño y posición de una ventana a los límites del viewport. Se aplica al crear ([src/os/store.ts:114](../../src/os/store.ts#L114)).

### 3.4 Persistencia

Config `persist` en [src/os/store.ts:209-219](../../src/os/store.ts#L209):

- **Clave localStorage:** `os:windows:v1` (`name`).
- **Storage:** `createJSONStorage(() => localStorage)` con guarda SSR (`undefined` si no hay `window`).
- **`skipHydration: true`**: NO hidrata automáticamente. La rehidratación es explícita: `useWM.persist.rehydrate()` se llama en el `useEffect` de montaje del escritorio ([src/os/Desktop.tsx:21](../../src/os/Desktop.tsx#L21)). Esto evita el mismatch de hidratación SSR/CSR.
- **`partialize`** ([src/os/store.ts:213](../../src/os/store.ts#L213)): persiste `windows` (forzando `minimized: false` en cada una al guardar), `zTop` y `openInstanceCount`. **No persiste** `focusedId`.
- **`version: 1`** (sin migraciones definidas).

Efecto: al recargar, las ventanas reaparecen no-minimizadas pero sin foco asignado (`focusedId` arranca en `null`).

### 3.5 `useUI` — estado de UI auxiliar

Definido en [src/os/uiStore.ts:15](../../src/os/uiStore.ts#L15), persistido bajo clave **`os:ui:v1`** (hidratación por defecto, sin `skipHydration`).

| Campo | Default | Descripción |
|---|---|---|
| `notificationsOpen` | `true` | Visibilidad del aside de notificaciones ([NewsAside](../../src/os/NewsAside.tsx)). |
| `trayExpanded` | `false` | Popover de iconos ocultos de la bandeja. |

Acciones: `toggleNotifications`, `setNotifications`, `toggleTray`.

---

## 4. Tipos

Definidos en [src/os/types.ts](../../src/os/types.ts).

- **`Locale`** = `'es' | 'en' | 'hy'` ([:3](../../src/os/types.ts#L3)).
- **`SnapRegion`** = `'left' | 'right' | 'top' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'` ([:5](../../src/os/types.ts#L5)). Nótese que **no hay** `bottom` simple (solo cuadrantes inferiores).
- **`WindowBounds`** = `{ x, y, width, height }` ([:9](../../src/os/types.ts#L9)).
- **`WindowState`** ([:11-26](../../src/os/types.ts#L11)):
  - `id` (instancia única), `appId` (id del manifest), `title`, `icon`.
  - `x, y, width, height`, `zIndex`.
  - `minimized`, `maximized` (booleans), `snapped: SnapRegion | null`.
  - `prevBounds?` — bounds previos para restaurar tras maximizar/snap.
  - `params?: Record<string, string | number | boolean>` — parámetros pasados al body de la app.
- **`AppCategory`** = `'cv' | 'mini-project' | 'tool' | 'system'` ([:28](../../src/os/types.ts#L28)).
- **`AppManifest`** ([:30-44](../../src/os/types.ts#L30)) — descriptor de una app del escritorio:
  - `id`, `title`, `icon`, `category`.
  - `defaultSize: {width,height}`, `minSize?: {width,height}`.
  - `singleton?` — si `true`, abrir reusa la instancia existente.
  - `deepLink?` — slug para deep-linking.
  - `description?`, `externalUrl?`, `standaloneRoute?`, `customAction?: 'reload'`.
  - `Component: ComponentType<{ params? }>` — el cuerpo React que se renderiza dentro de la ventana.

  Comportamiento de doble-click según campos (resuelto en [DesktopIcon](../../src/os/DesktopIcon.tsx) y [StartMenu](../../src/os/StartMenu.tsx)):
  1. `customAction === 'reload'` → `window.location.reload()`.
  2. `externalUrl` → `window.open(..., '_blank', 'noopener,noreferrer')` (sin ventana).
  3. `standaloneRoute` → `router.push()` (navegación in-app, sin ventana).
  4. en otro caso → `openApp(manifest)` (abre ventana). El StartMenu **no** maneja `customAction` (ver §10).

---

## 5. Ciclo de vida de ventana

### 5.1 Abrir — `openApp(manifest, params?)`
[src/os/store.ts:74-123](../../src/os/store.ts#L74)

1. **Singleton:** si `manifest.singleton` y ya existe una ventana con ese `appId`, hace `restore` + `focus` (y `setParams` si llegan params) y devuelve el id existente. No crea instancia nueva.
2. Calcula `count` = suma total de instancias abiertas (`openInstanceCount`) y obtiene `cascadePosition(count)`.
3. Genera id único: `` `${manifest.id}-${Date.now()}-${random5}` `` ([:87](../../src/os/store.ts#L87)).
4. `zIndex = zTop + 1`.
5. Tamaño: parte de `defaultSize`, acotado entre `minSize` (defaults `320×240`) y `viewport - 24`.
6. **Modo responsive / kiosco-móvil:** si `vp.w < 820 || vp.h < 520` → `preferMaximized = true`: la ventana se abre **maximizada** (x/y=0, ancho/alto=viewport) y guarda en `prevBounds` el tamaño "normal" que tendría ([:92-110](../../src/os/store.ts#L92)).
7. Inserta la ventana (pasada por `clampToViewport`), actualiza `zTop`, `focusedId`, e incrementa `openInstanceCount[manifest.id]`.

### 5.2 Cerrar — `close(id)`
[src/os/store.ts:125-141](../../src/os/store.ts#L125)

- Filtra la ventana. Si era la enfocada, el nuevo foco es la ventana restante con mayor `zIndex` (o `null` si no quedan).
- Decrementa `openInstanceCount[appId]` con tope inferior 0.

### 5.3 Foco — `focus(id)`
[src/os/store.ts:143-151](../../src/os/store.ts#L143)

- Asigna `zIndex = zTop+1`, marca `focusedId`, y **fuerza `minimized: false`** (así enfocar desde la taskbar también restaura).

### 5.4 Minimizar / Restaurar
- `minimize(id)` ([:153](../../src/os/store.ts#L153)): `minimized=true`; si era la enfocada, `focusedId=null`. (No transfiere foco a otra ventana.)
- `restore(id)` ([:158](../../src/os/store.ts#L158)): `minimized=false` (no toca z-index ni foco).

La ventana minimizada permanece en el DOM con `display:'none'` ([src/os/Window.tsx:32](../../src/os/Window.tsx#L32)).

### 5.5 Maximizar — `toggleMaximize(id)`
[src/os/store.ts:162-183](../../src/os/store.ts#L162)

- Si está maximizada: restaura desde `prevBounds` (fallback `{80,60,800,600}`), limpia `snapped` y `prevBounds`.
- Si no: guarda bounds actuales en `prevBounds`, pone `x/y=0`, `width/height = viewport`, `maximized=true`, `snapped=null`.
- Disparadores: botón maximizar y doble-click en la title bar ([src/os/Window.tsx:48,56](../../src/os/Window.tsx#L48)).

### 5.6 Snap — `snap(id, region)`
[src/os/store.ts:185-197](../../src/os/store.ts#L185)

- Aplica `snapBounds(region)`. Marca `snapped=region` y `maximized = (region === 'top')` (snap-top equivale a maximizar).
- Conserva `prevBounds` si ya estaba snapeada; si no, guarda los bounds actuales.

### 5.7 Mutaciones de geometría
- `setBounds(id, partial)` ([:199](../../src/os/store.ts#L199)): aplica bounds parciales y **resetea** `snapped=null`, `maximized=false`, `prevBounds=undefined`. Es la vía que usan drag y resize (de ahí que arrastrar/redimensionar "des-maximice"/"des-snapee").
- `setParams(id, params)` ([:205](../../src/os/store.ts#L205)): actualiza solo `params`.

---

## 6. Drag / Resize / Snap

### 6.1 Drag de la title bar — `useDraggable`
[src/os/useDraggable.ts](../../src/os/useDraggable.ts)

- **Bloqueo móvil:** si `window.innerWidth < 768`, el drag se ignora ([:24](../../src/os/useDraggable.ts#L24)) → en móvil las ventanas no se arrastran.
- Ignora el `pointerdown` si el target está bajo `[data-no-drag]` (controles de la title bar y body llevan ese atributo) ([:25](../../src/os/useDraggable.ts#L25)).
- Usa **Pointer Events** con `setPointerCapture` sobre la title bar (`handleRef`).
- **Umbral de movimiento:** no se considera arrastre real hasta superar 3px en X o Y ([:51](../../src/os/useDraggable.ts#L51)) (evita micro-arrastres en clicks).
- En cada `pointermove` calcula nueva posición acotada para que la ventana no se pierda fuera de pantalla: `x ∈ [-width+120, vw-120]`, `y ∈ [0, vh-40]` ([:56-57](../../src/os/useDraggable.ts#L56)) y la aplica con `setBounds` (lo que limpia maximize/snap).
- En paralelo llama a `detectSnapRegion` con la posición del puntero y muestra el **preview de snap** moviendo/dimensionando `previewRef` (`.xp-snap-preview`). La región pendiente se guarda en `pendingSnap`.
- En `pointerup`/`pointercancel`: oculta el preview y, si hay `pendingSnap`, ejecuta `snap(win.id, region)` ([:89-91](../../src/os/useDraggable.ts#L89)).
- Nota: el bloque `if (win.maximized || win.snapped) {...} else {...}` ([:59-63](../../src/os/useDraggable.ts#L59)) ejecuta la **misma** llamada en ambas ramas (no-op intencional/residual).

### 6.2 Resize 8 direcciones — `useResizable`
[src/os/useResizable.ts](../../src/os/useResizable.ts)

- Direcciones (`Dir`): `n, s, e, w, ne, nw, se, sw` ([:7](../../src/os/useResizable.ts#L7)).
- **Mínimos:** `MIN_W = 320`, `MIN_H = 200` ([:9-10](../../src/os/useResizable.ts#L9)). (Distinto del mínimo por defecto de `openApp`, que es 320×240.)
- **Bloqueo móvil:** igual que drag, ignora si `innerWidth < 768` ([:27](../../src/os/useResizable.ts#L27)).
- `e.stopPropagation()` evita que el resize active el drag/focus de la ventana.
- Lógica por componente de dirección ([:54-65](../../src/os/useResizable.ts#L54)):
  - `e`: `width` crece hasta `vw - x`.
  - `s`: `height` crece hasta `vh - y`.
  - `w`: recalcula `width` (mín 320) y desplaza `x` para mantener el borde derecho fijo.
  - `n`: recalcula `height` (mín 200) y desplaza `y` (acotado a `≥0`) para mantener el borde inferior fijo.
- Aplica con `setBounds` (también limpia maximize/snap).
- Los 8 handles solo se renderizan cuando la ventana **no** está maximizada ([src/os/Window.tsx:67-78](../../src/os/Window.tsx#L67)), con clases `.xp-resize-{dir}`.
- Listeners de move/up enganchados a `window` (no al handle), por lo que el resize sigue funcionando aunque el puntero salga del handle.

### 6.3 Zonas de snap — `snap.ts`
[src/os/snap.ts](../../src/os/snap.ts)

- `SNAP_EDGE = 18` px: grosor de la franja sensible en cada borde.
- `detectSnapRegion(x,y,vw,vh)` ([:5](../../src/os/snap.ts#L5)): determina cercanía a bordes y devuelve región; las esquinas tienen prioridad sobre los lados:
  - esquinas → `top-left / top-right / bottom-left / bottom-right`,
  - borde superior → `top` (= maximizar),
  - bordes laterales → `left` / `right`,
  - nada → `null`.
  - No existe región `bottom` (borde inferior solo dispara cuadrantes en combinación con un lado).
- `snapPreviewRect(region,vw,vh)` ([:21](../../src/os/snap.ts#L21)): rectángulo de preview, espejo de `snapBounds` del store (mitades / cuadrantes / pantalla completa).

> Hay **duplicación deliberada** de la geometría de snap: `snapBounds` (store) y `snapPreviewRect` (snap.ts) calculan lo mismo en sitios distintos (ver §10).

---

## 7. Escritorio, Taskbar, StartMenu

### 7.1 Escritorio — `Desktop`
[src/os/Desktop.tsx](../../src/os/Desktop.tsx)

- Estado local: `selected` (icono seleccionado), `startOpen` (menú inicio), `mounted` (gate de render de ventanas tras hidratación).
- **Montaje** ([:20-23](../../src/os/Desktop.tsx#L20)): `useWM.persist.rehydrate()` + `setMounted(true)`. Las ventanas solo se renderizan cuando `mounted` es `true` ([:66](../../src/os/Desktop.tsx#L66)) → evita flash/mismatch SSR.
- **Click-away** ([:25-37](../../src/os/Desktop.tsx#L25)): un listener global `mousedown` deselecciona iconos (si el click no fue en `.xp-icon`/`.xp-window`) y cierra el StartMenu (si no fue en `.xp-start-menu`/`.xp-start-button`).
- **Orden de iconos** ([:39-42](../../src/os/Desktop.tsx#L39)): `APPS` ordenadas por categoría `['cv','mini-project','tool','system']`.
- Composición: `<AiWallpaper/>` (fondo) → `.xp-desktop-area` con `<NewsAside/>`, cabecera "EdvardKS PC", grid de iconos, ventanas, `<PhotoCarousel/>` → `<StartMenu/>` condicional → `<Taskbar/>`.

### 7.2 Icono — `DesktopIcon`
[src/os/DesktopIcon.tsx](../../src/os/DesktopIcon.tsx)

- `onClick` selecciona; `onDoubleClick` (y `Enter`/`Espacio`) abre vía la lógica `open()` que resuelve `customAction`/`externalUrl`/`standaloneRoute`/`openApp` (§4).
- Localización: la descripción se toma de `APP_DESCRIPTIONS[locale]` con fallback a `manifest.description` ([:18](../../src/os/DesktopIcon.tsx#L18)).
- Accesible: `role="button"`, `tabIndex=0`, `aria-label`, tooltip con `role="tooltip"`.

### 7.3 Barra de tareas — `Taskbar`
[src/os/Taskbar.tsx](../../src/os/Taskbar.tsx)

- **Botón Start** ([:34](../../src/os/Taskbar.tsx#L34)): hace `stopPropagation` (para no chocar con el click-away) y llama `onStartToggle`.
- **Items de ventana** ([:42-52](../../src/os/Taskbar.tsx#L42)): uno por ventana; `active` si está enfocada y no minimizada.
  - `clickItem` ([:26-30](../../src/os/Taskbar.tsx#L26)): si minimizada → `restore`+`focus`; si ya enfocada → `minimize` (toggle); en otro caso → `focus`.
- **Reloj** ([:19-24](../../src/os/Taskbar.tsx#L19)): `now` inicializado en `useEffect` (evita mismatch SSR), refresco cada 30 s. Formateado en zona `Europe/Madrid`, locale `es-ES`.
- **SystemTray** ([:61](../../src/os/Taskbar.tsx#L61)) (estilo Windows 11):
  - **Chevron** abre popover de "iconos ocultos" (`trayExpanded` de `useUI`) con cierre por click-away propio ([:92-102](../../src/os/Taskbar.tsx#L92)). Los iconos del popover (Docker, Update, Bluetooth, Batería 87%, Micrófono, OneDrive, Ubicación, Antivirus, Power) son **decorativos** (sin acción).
  - **LocaleFlag** ([:221](../../src/os/Taskbar.tsx#L221)): cicla idioma `es → en → hy` vía `useLocale`.
  - **Botón AI** ([:172](../../src/os/Taskbar.tsx#L172)): abre la app `ai` (`APPS_BY_ID.ai`).
  - **Notificaciones** y **reloj**: ambos llaman `toggleNotifications` (muestran/ocultan el `NewsAside`).

### 7.4 Menú inicio — `StartMenu`
[src/os/StartMenu.tsx](../../src/os/StartMenu.tsx)

- Agrupa `APPS` por categoría con etiquetas ES (`Sobre mí / Mini-proyectos / Herramientas / Sistema`); grupos vacíos se omiten ([:24-28](../../src/os/StartMenu.tsx#L24)).
- Cada item: resuelve `externalUrl` → `standaloneRoute` → `openApp`, luego `onClose()`. (No contempla `customAction`.)
- `onMouseDown` con `stopPropagation` para no autocerrarse vía click-away.
- Item final **"Cerrar todas las ventanas"** ([:62-68](../../src/os/StartMenu.tsx#L62)): itera `useWM.getState().windows` y llama `close` en cada una.

---

## 8. Deep-link

`DeepLinkOpener` ([src/os/DeepLinkOpener.tsx](../../src/os/DeepLinkOpener.tsx)) es un componente sin render (`return null`) que al montar busca `APPS_BY_ID[appId]` y, si existe, llama `openApp(manifest, params)`. Sirve para abrir una app concreta desde una ruta/URL (presumiblemente montado por una página que mapea su slug — `AppManifest.deepLink` — al `appId`). El efecto depende de `[appId, params, openApp]`, por lo que reabriría si cambian esas props.

---

## 9. Adornos (wallpaper / news / carousel)

### 9.1 Wallpaper IA — `AiWallpaper`
[src/os/AiWallpaper.tsx](../../src/os/AiWallpaper.tsx)

- Canvas de fondo (`.ai-wallpaper > canvas.ai-nodes`, `aria-hidden`) con animación tipo **red de nodos**.
- Parámetros: `NODE_COUNT = 60`, `MAX_DIST = 160`. Cada nodo tiene posición y velocidad lenta (`±0.35`); rebota en los bordes.
- En cada frame (`requestAnimationFrame`) dibuja líneas entre nodos a distancia `< MAX_DIST` con alpha proporcional (cian `rgba(34,211,238,...)`) y los nodos como puntos (violeta `rgba(168,85,247,0.9)`).
- DPR limitado a 2; re-`seed()` en `resize`. Limpieza de RAF y listener en el cleanup del efecto.

### 9.2 Aside de noticias — `NewsAside`
[src/os/NewsAside.tsx](../../src/os/NewsAside.tsx)

- Visible según `useUI.notificationsOpen` (default `true`); el botón × lo cierra (`setNotifications(false)`).
- Carga `GET /api/news` (`cache:'no-store'`) al montar; refresco forzado con `?refresh=1` vía botón ↻ ([:33-44](../../src/os/NewsAside.tsx#L33)).
- Tipos locales `NewsItem` / `Feed`: items con `source: 'github' | 'linkedin'`, título, detalle, tags, timestamp; `profile` opcional (foto/nombre/headline).
- UI: cabecera con fecha (`Intl` es-ES), perfil, meta "Hace X" (helper `relative()`), aviso de errores de fuente, skeletons mientras `!feed`, estado vacío, y lista de items enlazados (abren `url` en pestaña nueva). Iconos GitHub/LinkedIn inline.

### 9.3 Carrusel de fotos — `PhotoCarousel`
[src/os/PhotoCarousel.tsx](../../src/os/PhotoCarousel.tsx)

- Lista fija `PHOTOS` (3 imágenes en `/assets/photos/`).
- Cada tarjeta es un botón que abre la app `cv` (`APPS_BY_ID.cv`) vía `openApp` ([:15-18](../../src/os/PhotoCarousel.tsx#L15)). Imágenes con `loading="lazy"`. Región accesible con `aria-label`.

---

## 10. Casos borde y deuda técnica

1. **`zTop` crece sin límite.** `focus`/`openApp` solo incrementan `zTop` y nunca lo normalizan ([src/os/store.ts:145](../../src/os/store.ts#L145)). Persistido en `os:windows:v1`, así que tras muchas sesiones puede crecer mucho (sin impacto funcional real, pero es deuda).
2. **Geometría de snap duplicada.** `snapBounds` (store, [:33](../../src/os/store.ts#L33)) y `snapPreviewRect` (snap.ts, [:21](../../src/os/snap.ts#L21)) son lógicamente idénticas; un cambio en una zona debe replicarse en la otra.
3. **Rama muerta en drag.** El `if (win.maximized || win.snapped) {...} else {...}` ([src/os/useDraggable.ts:59](../../src/os/useDraggable.ts#L59)) ejecuta lo mismo en ambas ramas.
4. **Mínimos incoherentes.** `openApp` usa default `320×240` ([:90-91](../../src/os/store.ts#L90)); `useResizable` usa `320×200` ([:9-10](../../src/os/useResizable.ts#L9)); el `minSize` del manifest solo se aplica al abrir, **no** al redimensionar (resize ignora `manifest.minSize`).
5. **StartMenu no soporta `customAction`.** A diferencia de `DesktopIcon`, el menú inicio no maneja `customAction === 'reload'` ([src/os/StartMenu.tsx:43-48](../../src/os/StartMenu.tsx#L43)); una app con solo `customAction` caería en `openApp` y abriría una ventana (probablemente vacía).
6. **Sin reaplicar clamp en resize de viewport.** `clampToViewport` solo se aplica al crear ([:114](../../src/os/store.ts#L114)). Si la ventana del navegador se encoge, las ventanas persistidas pueden quedar parcialmente fuera de pantalla (el drag las recupera por el clamp de posición, pero su tamaño no se reajusta automáticamente).
7. **Modo móvil/kiosco parcial.** En `< 768px` se deshabilitan drag y resize ([useDraggable:24](../../src/os/useDraggable.ts#L24), [useResizable:27](../../src/os/useResizable.ts#L27)); en `< 820×520` las ventanas abren maximizadas ([store:94](../../src/os/store.ts#L94)). Pero no hay un "modo kiosco" formal: dos umbrales distintos (768 y 820/520) gobiernan comportamientos relacionados.
8. **`minimize` no transfiere foco.** Al minimizar la ventana enfocada, `focusedId` pasa a `null` ([:155](../../src/os/store.ts#L155)) en lugar de pasar a la siguiente ventana visible (a diferencia de `close`, que sí calcula el siguiente foco).
9. **`prevBounds` con fallback fijo.** Al des-maximizar sin `prevBounds`, se cae a `{80,60,800,600}` ([:167](../../src/os/store.ts#L167)), que puede no encajar en viewports pequeños.
10. **`focusedId` no persiste.** Tras recargar, ninguna ventana queda enfocada (`null`) aunque las ventanas se restauren; `partialize` lo excluye ([:213-217](../../src/os/store.ts#L213)).
11. **Iconos de bandeja decorativos.** El popover de la tray (Docker, Batería 87%, etc.) es puramente cosmético; no refleja estado real del sistema.
