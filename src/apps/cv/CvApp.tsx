'use client'

import { useEffect, useState } from 'react'
import { loadCVData, pickLocalized, type CVData } from '@lib/cv-data'
import { useLocale, useT } from '@lib/i18n/config'
import { Timeline, type TimelineNode } from './Timeline'
import { SkillsChart } from './SkillsChart'
import { ProjectsGrid } from '@apps/projects/ProjectsGrid'
import type { Locale } from '@os/types'

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
  const raw = pickLocalized(data.translations.skills.list as unknown as Record<string, string>, locale)
  const extra = raw ? raw.split(/[,•;|]/).map(s => s.trim()).filter(Boolean) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SkillsChart />
      {extra.length > 0 && (
        <details style={{ background: '#fff', border: '1px solid #d0d7de', borderRadius: 8, padding: '8px 12px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#0f172a' }}>
            Stack completo declarado en CV ({extra.length})
          </summary>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {extra.map((s, i) => (
              <span key={i} className="gh-tl-badge-item">{s}</span>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function ProjectsTab(_: { data: CVData; locale: Locale }) {
  return <ProjectsGrid />
}
