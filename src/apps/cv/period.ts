export type ParsedPeriod = {
  raw: string
  startYear: number | null
  startMonth: number | null
  endYear: number | null
  endMonth: number | null
  current: boolean
  /** Sort key: higher = more recent. NaN if unparseable. */
  sortKey: number
  durationMonths: number | null
}

const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function matchPart(part: string): { y: number | null; m: number | null; current: boolean } {
  const s = part.trim().toLowerCase()
  if (!s) return { y: null, m: null, current: false }
  if (/current|actual|present|presente|hoy|ongoing|անցնում/i.test(s)) {
    return { y: null, m: null, current: true }
  }
  // dd/mm/yyyy
  let m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/)
  if (m) return { y: +m[3].padStart(4, '20'), m: +m[2], current: false }
  // mm/yyyy
  m = s.match(/^(\d{1,2})[\/\-\.](\d{2,4})$/)
  if (m) return { y: +m[2].padStart(4, '20'), m: +m[1], current: false }
  // yyyy alone
  m = s.match(/^(\d{4})$/)
  if (m) return { y: +m[1], m: null, current: false }
  return { y: null, m: null, current: false }
}

export function parsePeriod(raw: string | undefined | null): ParsedPeriod {
  const r = (raw ?? '').trim()
  if (!r) return { raw: r, startYear: null, startMonth: null, endYear: null, endMonth: null, current: false, sortKey: NaN, durationMonths: null }
  // Split by ' - ', ' – ', ' — ', 'to', ' a '
  const parts = r.split(/\s[-–—]\s|\sto\s|\s+a\s+/i).map(s => s.trim())
  const start = matchPart(parts[0] ?? '')
  const end = parts.length > 1 ? matchPart(parts[1] ?? '') : { y: null as number | null, m: null as number | null, current: false }
  const current = end.current
  const startYear = start.y
  const startMonth = start.m
  const endYear = end.y
  const endMonth = end.m
  // Sort key: prefer end (or now if current), fall back to start.
  const now = new Date()
  const effY = current ? now.getFullYear() : (endYear ?? startYear)
  const effM = current ? now.getMonth() + 1 : (endMonth ?? startMonth ?? 12)
  const sortKey = effY != null ? effY * 12 + (effM ?? 12) : NaN

  let durationMonths: number | null = null
  if (startYear != null) {
    const sy = startYear
    const sm = startMonth ?? 1
    const ey = current ? now.getFullYear() : (endYear ?? sy)
    const em = current ? now.getMonth() + 1 : (endMonth ?? sm)
    durationMonths = Math.max(0, (ey - sy) * 12 + (em - sm))
  }
  return { raw: r, startYear, startMonth, endYear, endMonth, current, sortKey, durationMonths }
}

export function formatPeriod(p: ParsedPeriod, locale: 'es' | 'en' | 'hy' = 'es'): string {
  if (!p.raw) return '—'
  const fmt = (y: number | null, m: number | null) => {
    if (y == null) return ''
    if (m == null) return `${y}`
    return `${String(m).padStart(2, '0')}/${y}`
  }
  const endLabel = p.current
    ? (locale === 'en' ? 'Present' : locale === 'hy' ? 'Ներկա' : 'Actualidad')
    : fmt(p.endYear, p.endMonth)
  const start = fmt(p.startYear, p.startMonth)
  if (!start && !endLabel) return p.raw
  return `${start || '—'} → ${endLabel || '—'}`
}

export function humanDuration(months: number | null, locale: 'es' | 'en' | 'hy' = 'es'): string {
  if (months == null || months <= 0) return ''
  const y = Math.floor(months / 12)
  const m = months % 12
  const yL = { en: y === 1 ? 'yr' : 'yrs', es: y === 1 ? 'año' : 'años', hy: 'տարի' }[locale]
  const mL = { en: m === 1 ? 'mo' : 'mos', es: y === 0 ? (m === 1 ? 'mes' : 'meses') : 'm', hy: 'ամիս' }[locale]
  if (y > 0 && m > 0) return `${y} ${yL} ${m} ${mL}`
  if (y > 0) return `${y} ${yL}`
  return `${m} ${mL}`
}

export function sortByRecency<T>(items: T[], pick: (it: T) => ParsedPeriod): T[] {
  return items.slice().sort((a, b) => {
    const ak = pick(a).sortKey
    const bk = pick(b).sortKey
    const aBad = Number.isNaN(ak)
    const bBad = Number.isNaN(bk)
    if (aBad && bBad) return 0
    if (aBad) return 1
    if (bBad) return -1
    return bk - ak
  })
}
