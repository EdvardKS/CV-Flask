'use client'

import { useEffect, useState } from 'react'
import { loadCVData, pickLocalized, type CVData } from '@lib/cv-data'
import { useLocale, useT } from '@lib/i18n/config'
import { Timeline, type TimelineNode } from './Timeline'
import type { Locale } from '@os/types'
import { useWM } from '@os/store'
import { APPS_BY_ID } from '@apps/_registry'

type Tab = 'summary' | 'experience' | 'education' | 'skills' | 'projects'

export function CvApp() {
  const [data, setData] = useState<CVData | null>(null)
  const [tab, setTab] = useState<Tab>('summary')
  const locale = useLocale(s => s.locale)
  const t = useT()

  useEffect(() => {
    loadCVData().then(setData).catch(console.error)
  }, [])

  if (!data) return <p>{t('loading')}</p>

  const tr = data.translations
  const name = pickLocalized(tr.name, locale)
  const title = pickLocalized(tr.title, locale)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'summary', label: t('about') },
    { id: 'experience', label: t('experience') },
    { id: 'education', label: t('education') },
    { id: 'skills', label: t('skills') },
    { id: 'projects', label: t('projects') }
  ]

  return (
    <div className="cv-app">
      <header style={{ paddingBottom: 12, borderBottom: '1px solid #c3bfa5', marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>{name}</h1>
        <p style={{ margin: '4px 0 0', color: '#444', fontSize: 13 }}>{title}</p>
      </header>

      <nav style={{ display: 'flex', gap: 2, marginBottom: 12, flexWrap: 'wrap' }}>
        {tabs.map(x => (
          <button
            key={x.id}
            onClick={() => setTab(x.id)}
            style={{
              padding: '6px 12px',
              background: tab === x.id ? '#0a246a' : '#ece9d8',
              color: tab === x.id ? '#fff' : '#000',
              border: '1px solid #888',
              borderBottom: tab === x.id ? 'none' : '1px solid #888',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            {x.label}
          </button>
        ))}
      </nav>

      <section style={{ fontSize: 13, lineHeight: 1.6 }}>
        {tab === 'summary' && <SummaryTab data={data} locale={locale} />}
        {tab === 'experience' && <ExperienceTab data={data} locale={locale} />}
        {tab === 'education' && <EducationTab data={data} locale={locale} />}
        {tab === 'skills' && <SkillsTab data={data} locale={locale} />}
        {tab === 'projects' && <ProjectsTab data={data} locale={locale} />}
      </section>
    </div>
  )
}

function SummaryTab({ data, locale }: { data: CVData; locale: Locale }) {
  return <p>{pickLocalized(data.translations.summary, locale)}</p>
}

function ExperienceTab({ data, locale }: { data: CVData; locale: Locale }) {
  const nodes: TimelineNode[] = data.translations.workExperience.entries.map((e, i) => {
    const company = typeof e.company === 'string' ? e.company : pickLocalized(e.company, locale)
    const position = pickLocalized(e.position, locale)
    const location = typeof e.location === 'string' ? e.location : pickLocalized(e.location, locale)
    const resp = typeof e.responsibilities === 'string'
      ? e.responsibilities
      : pickLocalized(e.responsibilities as unknown as Record<string, string>, locale)
    return {
      key: `exp-${i}`,
      period: e.period ?? '',
      title: position,
      subtitle: <strong>{company}</strong>,
      location,
      avatar: e.img_name ? { src: `/assets/companies/${e.img_name}`, alt: company } : undefined,
      body: resp ? <p>{resp}</p> : undefined
    }
  })
  return <Timeline nodes={nodes} locale={locale} />
}

function EducationTab({ data, locale }: { data: CVData; locale: Locale }) {
  const nodes: TimelineNode[] = data.translations.education.entries.map((e, i) => {
    const location = typeof e.location === 'string' ? e.location : pickLocalized(e.location as Record<string, string>, locale)
    const degree = pickLocalized(e.degree, locale)
    const certSrc = e.certificate_image ? `/assets/certificates/${e.certificate_image}` : undefined
    const certFallback = e.certificate_image ? `/assets/companies/${e.certificate_image}` : undefined
    const pdfLink = e.certificate_pdf_link
    const isUrl = typeof pdfLink === 'string' && /^https?:/i.test(pdfLink)
    return {
      key: `edu-${i}`,
      period: e.period ?? '',
      title: degree,
      subtitle: <strong>{e.institution}</strong>,
      location,
      avatar: certSrc ? { src: certSrc, alt: e.institution, fallbackSrc: certFallback } : undefined,
      href: isUrl ? pdfLink : undefined,
      body: certSrc ? (
        <div>
          <img
            src={certSrc}
            alt={`Certificado — ${e.institution}`}
            onError={(ev) => {
              const el = ev.target as HTMLImageElement
              if (certFallback && el.src.indexOf(certFallback) < 0) el.src = certFallback
              else el.style.display = 'none'
            }}
            style={{ maxWidth: '100%', maxHeight: 360, border: '1px solid #d0d7de', borderRadius: 6, display: 'block' }}
            loading="lazy"
          />
          {isUrl && (
            <p style={{ marginTop: 8 }}>
              <a href={pdfLink} target="_blank" rel="noreferrer">Ver credencial ↗</a>
            </p>
          )}
        </div>
      ) : undefined
    }
  })
  return <Timeline nodes={nodes} locale={locale} />
}

function SkillsTab({ data, locale }: { data: CVData; locale: Locale }) {
  // skills.list is { en | es | hy : "comma-separated string" }
  const raw = pickLocalized(data.translations.skills.list as unknown as Record<string, string>, locale)
  const items = raw
    ? raw.split(/[,•;|]/).map(s => s.trim()).filter(Boolean)
    : []
  if (items.length === 0) return <p style={{ color: '#888' }}>Sin habilidades registradas.</p>
  return (
    <div>
      <p style={{ margin: '0 0 10px', color: '#444' }}>
        {items.length} habilidades.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((s, i) => (
          <span
            key={i}
            style={{
              fontSize: 12,
              background: 'linear-gradient(180deg, #0a246a, #1941a5)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: 999,
              boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
            }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * Map project.url values from cv_data.json to a local app id
 * (optionally with deep-link params) so clicks open an OS window rather
 * than reloading the page. Anything unknown falls back to external nav.
 */
function resolveInternal(url: string | undefined | null): { appId: string; params?: Record<string, string> } | null {
  if (!url || !url.startsWith('/')) return null
  const clean = url.split('?')[0].replace(/\/$/, '') || '/'
  if (clean === '/' || clean === '/cv') return { appId: 'cv' }
  if (clean === '/padel' || clean === '/padel/errores' || clean === '/padel/resumen') return { appId: 'padel' }
  if (clean === '/projects') return { appId: 'projects' }
  if (clean === '/contact') return { appId: 'contact' }
  if (clean === '/quiz') return { appId: 'quiz' }
  if (clean === '/ECSO' || clean === '/ecso') return { appId: 'quiz', params: { subject: 'estructura' } }
  if (clean.startsWith('/quiz/')) return { appId: 'quiz', params: { subject: clean.slice('/quiz/'.length) } }
  return null
}

const PROJECT_GITHUB: Record<string, string> = {
  'Padel Scout': 'https://github.com/EdvardKS/CV-Flask',
  'Personal CV Site': 'https://github.com/EdvardKS/CV-Flask',
  'ECSO / Sistemas Operativos': 'https://github.com/EdvardKS/CV-Flask'
}

function ProjectsTab({ data, locale }: { data: CVData; locale: Locale }) {
  const openApp = useWM(s => s.openApp)

  const openProject = (url: string | undefined) => {
    const internal = resolveInternal(url)
    if (internal) {
      const manifest = APPS_BY_ID[internal.appId]
      if (manifest) { openApp(manifest, internal.params); return }
    }
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
      {data.translations.projects.entries.map((p, i) => {
        const name = pickLocalized(p.name, locale)
        const tags = Array.isArray(p.tags) ? p.tags : (pickLocalized(p.tags, locale) ?? '').split(',').map(s => s.trim())
        const internal = resolveInternal(p.url)
        const githubUrl = PROJECT_GITHUB[name] ?? (typeof p.url === 'string' && /github\.com/.test(p.url) ? p.url : null)

        return (
          <li key={i} style={{ border: '1px solid #d0d7de', padding: 12, background: '#fff', borderRadius: 6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <strong style={{ color: '#0969da', fontSize: 14, flex: 1 }}>
                <button
                  onClick={() => openProject(p.url)}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                >
                  {name}
                </button>
              </strong>
            </div>
            <p style={{ margin: '6px 0' }}>{pickLocalized(p.description, locale)}</p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
              {tags.filter(Boolean).map((t, j) => (
                <span key={j} className="gh-tl-badge-item">{t}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {internal && (
                <button onClick={() => openProject(p.url)} style={primaryBtn}>
                  🪟 Abrir ventana
                </button>
              )}
              {githubUrl && (
                <a href={githubUrl} target="_blank" rel="noopener noreferrer" style={secondaryBtn}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden><path d="M10 1a9 9 0 00-2.85 17.54c.45.08.62-.19.62-.43v-1.7c-2.51.54-3.04-1.2-3.04-1.2-.41-1.04-1-1.32-1-1.32-.82-.56.06-.55.06-.55.9.06 1.38.93 1.38.93.8 1.37 2.11.97 2.63.74.08-.59.31-.98.57-1.2-1.99-.23-4.08-.99-4.08-4.41 0-.97.34-1.77.9-2.39-.09-.23-.39-1.14.09-2.37 0 0 .74-.24 2.42.91a8.42 8.42 0 014.4 0c1.68-1.15 2.42-.91 2.42-.91.48 1.23.18 2.14.09 2.37.56.62.9 1.42.9 2.39 0 3.43-2.09 4.18-4.08 4.4.32.28.6.82.6 1.66v2.46c0 .24.17.52.63.43A9 9 0 0010 1z"/></svg>
                  &nbsp;GitHub
                </a>
              )}
              {!internal && !githubUrl && p.url && (
                <a href={p.url} target="_blank" rel="noopener noreferrer" style={secondaryBtn}>
                  Visitar ↗
                </a>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

const primaryBtn: React.CSSProperties = {
  padding: '6px 12px',
  background: '#1f883d',
  color: '#fff',
  border: '1px solid rgba(27,31,36,0.15)',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4
}
const secondaryBtn: React.CSSProperties = {
  padding: '6px 12px',
  background: '#f6f8fa',
  color: '#24292f',
  border: '1px solid #d0d7de',
  borderRadius: 6,
  textDecoration: 'none',
  fontSize: 12,
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0
}
