# Spec: App CV

**Estado:** DOCUMENTADO (ingeniería inversa del código)
**Ámbito:** src/apps/cv/*, src/lib/cv-data.ts, app/api/cv, app/cv
**Revisión:** 2026-06-08

---

## 1. Propósito

La App **CV** es la ventana de currículum dentro del escritorio tipo SO del portfolio. Renderiza el currículum completo de Edvard Khachatryan Sahakyan organizado en pestañas: resumen, experiencia laboral, educación, habilidades y proyectos. Los datos de CV (nombre, título, resumen, experiencia, educación, proyectos y stack declarado) se cargan en cliente desde un JSON estático multilingüe (`es` / `en` / `hy`), mientras que el gráfico de habilidades (radar + tarjetas) se alimenta de un dataset curado en código.

Es una app **singleton** (una sola instancia) registrada en el sistema de apps del escritorio, con deep-link propio (`/cv`).

Fuentes:
- [`src/apps/cv/CvApp.tsx`](../../src/apps/cv/CvApp.tsx)
- [`src/apps/cv/manifest.ts`](../../src/apps/cv/manifest.ts)

---

## 2. Manifest

Definido en [`src/apps/cv/manifest.ts`](../../src/apps/cv/manifest.ts), exporta un `AppManifest` (`@os/types`):

| Campo         | Valor                                                                            |
| ------------- | -------------------------------------------------------------------------------- |
| `id`          | `cv`                                                                              |
| `title`       | `Mi CV`                                                                           |
| `icon`        | `cv`                                                                              |
| `category`    | `cv`                                                                              |
| `defaultSize` | `{ width: 1040, height: 720 }`                                                    |
| `minSize`     | `{ width: 520, height: 400 }`                                                     |
| `singleton`   | `true`                                                                            |
| `deepLink`    | `/cv`                                                                             |
| `description` | `Currículum completo: resumen, experiencia, educación y habilidades`             |
| `Component`   | `CvApp`                                                                           |

### Deep-link / ruta

La página App Router [`app/cv/page.tsx`](../../app/cv/page.tsx) monta el `Desktop` completo y un `DeepLinkOpener` con `appId="cv"`, de modo que al entrar por `/cv` el escritorio abre automáticamente la ventana de la app CV.

```tsx
export const metadata = { title: 'Mi CV — Edvard K.' }
export default function Page() {
  return (<><Desktop /><DeepLinkOpener appId="cv" /></>)
}
```

---

## 3. Componentes (CvApp / Timeline / SkillsChart)

### 3.1 `CvApp` — [`src/apps/cv/CvApp.tsx`](../../src/apps/cv/CvApp.tsx)

Componente cliente (`'use client'`). Responsabilidades:

- **Carga de datos**: en `useEffect` llama a `loadCVData()` y guarda el resultado en estado (`data: CVData | null`). Mientras `data` es `null` muestra `t('loading')`.
- **Localización**: lee el locale activo del store con `useLocale(s => s.locale)` y traduce etiquetas con `useT()` (i18n en `@lib/i18n/config`). Todos los campos multilingües se resuelven con `pickLocalized(valor, locale)`.
- **Cabecera**: muestra `name` y `title` (ambos localizados) con estilo inline tipo Windows XP/clásico (borde inferior beige `#c3bfa5`).
- **Navegación por pestañas**: estado `tab: Tab` con cinco valores: `summary | experience | education | skills | projects`. Las etiquetas se traducen con `t('about')`, `t('experience')`, `t('education')`, `t('skills')`, `t('projects')`. Estilo de botón activo azul `#0a246a`.

Pestañas (sub-componentes internos):

- **`SummaryTab`**: párrafo con `pickLocalized(data.translations.summary, locale)`.
- **`ExperienceTab`**: mapea `data.translations.workExperience.entries` a `TimelineNode[]` y los pasa a `<Timeline>`. Por entrada:
  - `company`, `location`, `responsibilities` se tratan como `string | objeto localizado` (resuelto con `pickLocalized` si no es string).
  - `avatar` = logo de empresa en `/assets/companies/${e.img_name}` (si existe `img_name`).
  - `body` = párrafo con las responsabilidades (panel expandible del timeline).
- **`EducationTab`**: mapea `data.translations.education.entries` a `TimelineNode[]`:
  - `title` = `degree` localizado; `subtitle` = `institution`.
  - `avatar` (punto del rail) = `/assets/certificates/${certificate_image}` con **fallback** a `/assets/companies/${certificate_image}`.
  - `href` = `certificate_pdf_link` **solo si** es URL `http(s)` (regex `/^https?:/i`); si es un nombre de archivo local no se usa como enlace.
  - `body` = imagen del certificado (`maxHeight 360`, `loading="lazy"`) con manejo de error `onError` que cae al fallback o se oculta; añade enlace "Ver credencial ↗" si `pdf_link` es URL.
- **`SkillsTab`**: renderiza `<SkillsChart />` (radar curado) y, debajo, un `<details>` colapsable "Stack completo declarado en CV" con el `skills.list` del JSON. El string localizado se **trocea** por separadores `,•;|` (`split(/[,•;|]/)`), se limpian espacios y vacíos, y cada token se pinta como `<span className="gh-tl-badge-item">`.
- **`ProjectsTab`**: delega por completo en `<ProjectsGrid />` de [`@apps/projects/ProjectsGrid`](../../src/apps/projects/ProjectsGrid.tsx). **No** usa `data.translations.projects` del CV (ignora el parámetro `data`).

### 3.2 `Timeline` — [`src/apps/cv/Timeline.tsx`](../../src/apps/cv/Timeline.tsx)

Componente reutilizable de línea de tiempo (estilo GitHub, clases `gh-timeline` / `gh-tl-*`), usado tanto por experiencia como por educación.

- **Props**: `{ nodes: TimelineNode[]; locale?: Locale }` (locale por defecto `'es'`).
- **Ordenación**: `useMemo` ordena por recencia con `sortByRecency(nodes, n => parsePeriod(n.period))` (más reciente arriba; periodos no parseables al final).
- Si no hay entradas muestra "Sin entradas.".

`TimelineNode` (tipo exportado):

```ts
type TimelineNode = {
  key: string
  period: string
  title: ReactNode
  subtitle?: ReactNode
  location?: ReactNode
  body?: ReactNode
  badge?: ReactNode
  avatar?: { src: string; alt: string; fallbackSrc?: string }
  color?: string   // color del punto; por defecto hash del key+period
  tag?: string     // "main", "feat", "current"…
  href?: string    // enlace externo del título
}
```

`TimelineRow` (fila):

- Estado local `open` para expandir/colapsar el `body` (botón `+` / `−`), visible solo si `node.body` existe.
- **Rail/punto**: si hay `avatar` muestra `<img>` (con fallback `fallbackSrc` y ocultado en error, revelando un `gh-tl-dot`); si no, punto de color. El color por defecto sale de `hashColor(key + period)` → `hsl(hue,55%,45%)`.
- **Periodo**: usa `parsePeriod` + `formatPeriod` (texto bonito) y `humanDuration` (duración). Si `parsed.current`, añade pill `● live` y clase `is-current`.
- **Título**: si `href`, lo envuelve en `<a target="_blank" rel="noreferrer">`.

### 3.3 `SkillsChart` — [`src/apps/cv/SkillsChart.tsx`](../../src/apps/cv/SkillsChart.tsx)

Gráfico de habilidades **autónomo**: lee directamente `SKILL_CATEGORIES` de [`skills-data.ts`](../../src/apps/cv/skills-data.ts) (no del JSON del CV).

- **Estado**: `focusId` (categoría resaltada). Hover sobre puntos/etiquetas del radar o sobre las tarjetas sincroniza el resaltado.
- **`Radar`** (SVG `340×340`):
  - Cada categoría es un vértice; el ángulo se reparte uniformemente (`-π/2` inicial) y el radio es `(overall/100) * maxR`.
  - Dibuja rejilla concéntrica en niveles `[20,40,60,80,100]`, radios (spokes), polígono de datos con `radialGradient` azul→morado, puntos por categoría (radio 8 si enfocado), y etiquetas de eje con `icon`, `name` y `overall%`.
- **`CategoryCard`** (una por categoría):
  - Cabecera: icono con fondo de color, `name`, `narrative` y `overall%`.
  - Lista de skills con barra de progreso (`width: level%`, gradiente del color de la categoría) y badge `HOT` para `skill.hot === true`.

---

## 4. Datos (cv_data.json + lib + API)

### 4.1 `loadCVData` y `pickLocalized` — [`src/lib/cv-data.ts`](../../src/lib/cv-data.ts)

```ts
export async function loadCVData(): Promise<CVData> {
  const res = await fetch('/data/cv_data.json', { cache: 'force-cache' })
  if (!res.ok) throw new Error(`Failed to load cv_data.json: ${res.status}`)
  return res.json() as Promise<CVData>
}
```

- **Carga**: `fetch('/data/cv_data.json', { cache: 'force-cache' })` — sirve el archivo **estático** directamente desde `public/`. Es la vía que usa `CvApp`.
- **`pickLocalized(value, locale)`**: resuelve campos multilingües. Devuelve `''` si vacío; el propio string si ya es string; si es objeto, intenta `obj[locale]` → `obj.es` → `obj.en` → primer valor disponible.

### 4.2 API `/api/cv` — [`app/api/cv/route.ts`](../../app/api/cv/route.ts)

Endpoint `GET` (Node runtime) que **lee el mismo fichero** desde el sistema de archivos y lo devuelve como JSON crudo:

- Ruta: `path.join(process.cwd(), 'public', 'data', 'cv_data.json')`.
- Cabeceras: `Content-Type: application/json; charset=utf-8`, `Cache-Control: public, max-age=300`.
- En error: `console.error('[cv api]', e)` y `404 { error: 'Not found' }`.

> Nota: `CvApp` consume el JSON estático vía `/data/cv_data.json` (sección 4.1), **no** vía `/api/cv`. La ruta API expone el mismo contenido como endpoint alternativo (p. ej. para consumo externo/SSR), pero no hay referencias a ella en los componentes documentados.

### 4.3 Estructura de `public/data/cv_data.json`

JSON multilingüe con idiomas `["en","es","hy"]`. Forma (resumen):

```jsonc
{
  "languages": ["en", "es", "hy"],
  "translations": {
    "name":    { "en": "...", "es": "...", "hy": "..." },
    "title":   { "en": "...", "es": "...", "hy": "..." },
    "summary": { "es": "...", "en": "...", "hy": "..." },

    "education": {
      "title": { "en": "...", "es": "...", "hy": "..." },
      "entries": [
        {
          "institution": "Universidad Alfonso X el Sabio",   // string plano
          "period": "09/2025 - Current",
          "degree":   { "en": "...", "es": "...", "hy": "..." },
          "location": { "en": "...", "es": "...", "hy": "..." },
          "certificate_image": "uax.jpg",
          "certificate_pdf_link": "uax.jpg"                   // a veces nombre de archivo, no URL
        }
        // … más entradas (IES Abastos, IES Hermanos Amorós, Udacity-AWS, …)
      ]
    },

    "workExperience": {
      "title": { "en": "...", "es": "...", "hy": "..." },
      "entries": [
        {
          "position":  { "en": "...", "es": "...", "hy": "..." },
          "company":   "JNC Sistemas Informáticos SL",        // string plano en el dataset real
          "period":    "09/2025 - Current",
          "location":  { "en": "...", "es": "...", "hy": "..." },
          "responsibilities": { "en": "...", "es": "...", "hy": "..." }, // string por locale
          "img_name":  "jnc.png"
        }
        // … Navegatel, Posiziona, Freelance (period ""), Business Solutions
      ]
    },

    "skills": {
      "title": { "en": "...", "es": "...", "hy": "..." },
      "list":  { "en": "Python, SQL, PHP, …", "es": "…", "hy": "…" }  // string CSV por locale
    },

    "projects": {
      "title": { "en": "...", "es": "...", "hy": "..." },
      "entries": [
        {
          "name": "Padel Scout",                              // string plano
          "url": "/padel",
          "tags": ["Flask", "Python", "Data"],                // array de strings
          "description": { "en": "...", "es": "...", "hy": "..." }
        }
        // … Personal CV Site (url "/"), ECSO / Sistemas Operativos (url "/ECSO")
      ]
    },

    // Claves sueltas extra de UI/i18n del sitio Flask original:
    "nav-home": {...}, "nav-projects": {...},
    "summary-title": {...}, "experience-title": {...}, …
  }
}
```

Observaciones sobre la forma **real** del dataset:

- `responsibilities` viene como **string localizado** (`{ en, es, hy }`), no como array de strings (ver §5, divergencia con el tipo).
- `skills.list` viene como **string CSV localizado** (`{ en, es, hy }`), no como objeto de listas.
- `company` y `name` (proyectos) son **strings planos** (no localizados).
- Algunos `certificate_pdf_link` son **nombres de archivo** (`uax.jpg`), no URLs; por eso `EducationTab` filtra con `^https?:` antes de generar enlace.
- Hay entradas con `period: ""` (Freelance) que `parsePeriod` marca como no parseables → caen al final del timeline.
- El objeto `translations` contiene además **claves sueltas** de i18n del sitio Flask original (`nav-home`, `summary-title`, …) no usadas por esta app (absorbidas por el index signature `[key: string]: unknown`).

### 4.4 Datos de skills — [`src/apps/cv/skills-data.ts`](../../src/apps/cv/skills-data.ts)

Dataset **curado en código** (no en el JSON), calibrado a partir del headline/aptitudes de LinkedIn y evidencia pública (ver comentario del archivo). Es un `SKILL_CATEGORIES: SkillCategory[]` con 7 categorías:

| `id`         | Nombre                          | Icono | `overall` |
| ------------ | ------------------------------- | ----- | --------- |
| `genai`      | Generative AI & Agentic         | 🤖    | 93        |
| `ml`         | Machine Learning & DL           | 🧠    | 84        |
| `cloud`      | Cloud · Kubernetes · DevOps     | ☁️    | 83        |
| `mlops`      | MLOps & Private AI              | 🔐    | 84        |
| `data`       | Data · Analytics · ELK          | 🗃️    | 86        |
| `backend`    | Backend & Web                   | ⚙️    | 82        |
| `leadership` | Leadership & PM                 | 🎯    | 74        |

Cada categoría incluye `color` (hex), `narrative` (frase corta) y `skills: { name, level, hot? }[]`. El flag `hot: true` marca lo que "las empresas piden hoy" y se renderiza como badge `HOT`.

---

## 5. Tipos

Definidos en [`src/lib/cv-data.ts`](../../src/lib/cv-data.ts):

```ts
export type LocalizedString = Record<Locale, string>   // Locale = 'es' | 'en' | 'hy'

export type CVProject = {
  name: LocalizedString
  url: string
  tags: LocalizedString | string[]
  description: LocalizedString
}

export type CVExperience = {
  position: LocalizedString
  company: string | LocalizedString
  period: string
  location: string | LocalizedString
  responsibilities: Record<Locale, string[]> | string[]
  img_name?: string
}

export type CVEducation = {
  institution: string
  period: string
  degree: LocalizedString
  location: LocalizedString | string
  certificate_image?: string
  certificate_pdf_link?: string
}

export type CVData = {
  languages: Locale[]
  translations: {
    name: LocalizedString
    title: LocalizedString
    summary: LocalizedString
    education:      { title: LocalizedString; entries: CVEducation[] }
    workExperience: { title: LocalizedString; entries: CVExperience[] }
    projects:       { title: LocalizedString; entries: CVProject[] }
    skills:         { title: LocalizedString; list: Record<string, string[] | Record<Locale, string[]>> }
    [key: string]: unknown
  }
}
```

Tipos de habilidades en [`src/apps/cv/skills-data.ts`](../../src/apps/cv/skills-data.ts):

```ts
export type Skill = { name: string; level: number; hot?: boolean }
export type SkillCategory = {
  id: string; name: string; icon: string; color: string
  overall: number; narrative: string; skills: Skill[]
}
```

Tipo de periodo en [`src/apps/cv/period.ts`](../../src/apps/cv/period.ts):

```ts
export type ParsedPeriod = {
  raw: string
  startYear: number | null;  startMonth: number | null
  endYear: number | null;    endMonth: number | null
  current: boolean
  sortKey: number            // mayor = más reciente; NaN si no parseable
  durationMonths: number | null
}
```

### 5.1 Helper de periodos — [`src/apps/cv/period.ts`](../../src/apps/cv/period.ts)

Parsea las cadenas de `period` del CV (formatos heterogéneos) para ordenar y mostrar el timeline:

- **`parsePeriod(raw)`**: divide por separadores `-`, `–`, `—`, `to`, ` a `. Cada parte (`matchPart`) reconoce:
  - "actual/current/present/presente/hoy/ongoing" (+ armenio `անցնում`) → `current = true`.
  - `dd/mm/yyyy`, `mm/yyyy`, `yyyy` (con normalización de año a 4 dígitos vía `padStart(4,'20')`).
  - Calcula `sortKey = año*12 + mes` (usando la fecha actual si `current`) y `durationMonths`.
- **`formatPeriod(p, locale)`**: produce `"MM/YYYY → MM/YYYY"`; si `current`, el extremo final es `Actualidad`/`Present`/`Ներկա` según locale. Si no hay datos, devuelve el `raw`.
- **`humanDuration(months, locale)`**: formatea años/meses (`años`/`yrs`/`տարի`, etc.). Devuelve `''` si `≤ 0`.
- **`sortByRecency(items, pick)`**: ordena descendente por `sortKey`; los `NaN` (no parseables) van al final.

---

## 6. Notas / deuda técnica

1. **Divergencia tipos ↔ dataset**:
   - `CVExperience.responsibilities` está tipado como `Record<Locale, string[]> | string[]` (listas), pero el JSON real lo trae como **string localizado** (`Record<Locale, string>`). `ExperienceTab` lo trata como string y usa un cast `as unknown as Record<string,string>` para `pickLocalized`.
   - `CVData…skills.list` está tipado como `Record<string, string[] | Record<Locale, string[]>>`, pero el JSON lo trae como **string CSV localizado**. `SkillsTab` aplica `pickLocalized(... as unknown as Record<string,string>)` y luego `split`.
   - Conviene alinear los tipos con la forma real del dataset.

2. **API `/api/cv` sin consumidores conocidos**: `CvApp` carga el JSON estático (`/data/cv_data.json`); el endpoint [`app/api/cv/route.ts`](../../app/api/cv/route.ts) duplica el mismo contenido pero no se referencia desde los componentes documentados. Posible código muerto o reservado para terceros.

3. **Dos fuentes de "skills" desacopladas**: el radar/tarjetas (`SKILL_CATEGORIES`, curado en código) y el "Stack completo declarado en CV" (`skills.list` del JSON) son independientes. Pueden quedar desincronizados; el radar no refleja cambios del JSON.

4. **Pestaña Projects ignora el CV**: `ProjectsTab` renderiza `<ProjectsGrid />` y descarta `data.translations.projects`. Los proyectos del JSON (`Padel Scout`, `Personal CV Site`, `ECSO`) **no** se muestran por esta app salvo que `ProjectsGrid` los reutilice por su cuenta.

5. **`certificate_pdf_link` ambiguo**: campo que mezcla URLs reales y nombres de archivo locales; el filtro `^https?:` evita enlaces rotos pero deja entradas sin credencial enlazable.

6. **Estilos inline**: `CvApp` usa estilos inline (paleta clásica Windows) mezclados con clases CSS (`gh-tl-*`, `skills-*`). El CSS de timeline/skills vive fuera de estos archivos (clases referenciadas, no definidas aquí).

7. **i18n parcial en datos**: `company` y `name` (proyectos) son strings planos no traducibles; el resto sí. `pickLocalized` los devuelve tal cual.
