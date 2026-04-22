import type { Locale } from '@os/types'

export const LOCALES: Locale[] = ['es', 'en', 'hy']
export const DEFAULT_LOCALE: Locale = 'es'

export type LocalizedString = Record<Locale, string>

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
    education: { title: LocalizedString; entries: CVEducation[] }
    workExperience: { title: LocalizedString; entries: CVExperience[] }
    projects: { title: LocalizedString; entries: CVProject[] }
    skills: { title: LocalizedString; list: Record<string, string[] | Record<Locale, string[]>> }
    [key: string]: unknown
  }
}

export function pickLocalized(value: unknown, locale: Locale): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    const obj = value as Record<string, string>
    return obj[locale] ?? obj.es ?? obj.en ?? Object.values(obj)[0] ?? ''
  }
  return String(value)
}

export async function loadCVData(): Promise<CVData> {
  const res = await fetch('/data/cv_data.json', { cache: 'force-cache' })
  if (!res.ok) throw new Error(`Failed to load cv_data.json: ${res.status}`)
  return res.json() as Promise<CVData>
}
