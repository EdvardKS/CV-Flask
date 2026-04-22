'use client'

import { useEffect, useState } from 'react'
import { loadCVData, pickLocalized, type CVData } from '@lib/cv-data'
import { useLocale, useT } from '@lib/i18n/config'

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
        {tab === 'summary' && <SummaryTab data={data} />}
        {tab === 'experience' && <ExperienceTab data={data} />}
        {tab === 'education' && <EducationTab data={data} />}
        {tab === 'skills' && <SkillsTab data={data} />}
        {tab === 'projects' && <ProjectsTab data={data} />}
      </section>
    </div>
  )
}

function SummaryTab({ data }: { data: CVData }) {
  const locale = useLocale(s => s.locale)
  return <p>{pickLocalized(data.translations.summary, locale)}</p>
}

function ExperienceTab({ data }: { data: CVData }) {
  const locale = useLocale(s => s.locale)
  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.translations.workExperience.entries.map((e, i) => {
        const resp = Array.isArray(e.responsibilities)
          ? e.responsibilities
          : (e.responsibilities as Record<string, string[]>)[locale]
            ?? (e.responsibilities as Record<string, string[]>).es
            ?? []
        return (
          <li key={i} style={{ border: '1px solid #d8d4c0', padding: 10, background: '#fdfcf4', borderRadius: 4 }}>
            <strong>{pickLocalized(e.position, locale)}</strong>
            <div style={{ color: '#555', fontSize: 12 }}>
              {typeof e.company === 'string' ? e.company : pickLocalized(e.company, locale)} · {e.period}
            </div>
            <ul style={{ margin: '6px 0 0 18px' }}>
              {resp.map((r, j) => <li key={j}>{r}</li>)}
            </ul>
          </li>
        )
      })}
    </ul>
  )
}

function EducationTab({ data }: { data: CVData }) {
  const locale = useLocale(s => s.locale)
  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.translations.education.entries.map((e, i) => (
        <li key={i} style={{ borderLeft: '3px solid #0a246a', paddingLeft: 12 }}>
          <strong>{pickLocalized(e.degree, locale)}</strong>
          <div style={{ fontSize: 12, color: '#555' }}>{e.institution} · {e.period}</div>
          <div style={{ fontSize: 11, color: '#777' }}>{typeof e.location === 'string' ? e.location : pickLocalized(e.location, locale)}</div>
        </li>
      ))}
    </ul>
  )
}

function SkillsTab({ data }: { data: CVData }) {
  const list = data.translations.skills.list
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
      {Object.entries(list).map(([category, items]) => {
        const arr = Array.isArray(items) ? items : Object.values(items)[0] ?? []
        return (
          <div key={category} style={{ border: '1px solid #d8d4c0', background: '#fdfcf4', padding: 10, borderRadius: 4 }}>
            <strong style={{ display: 'block', marginBottom: 6 }}>{category}</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {(arr as string[]).map((s, i) => (
                <span key={i} style={{ fontSize: 11, background: '#0a246a', color: '#fff', padding: '2px 6px', borderRadius: 3 }}>{s}</span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ProjectsTab({ data }: { data: CVData }) {
  const locale = useLocale(s => s.locale)
  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
      {data.translations.projects.entries.map((p, i) => {
        const tags = Array.isArray(p.tags) ? p.tags : (pickLocalized(p.tags, locale) ?? '').split(',').map(s => s.trim())
        return (
          <li key={i} style={{ border: '1px solid #d8d4c0', padding: 12, background: '#fdfcf4', borderRadius: 4 }}>
            <strong>
              {p.url ? <a href={p.url} target="_blank" rel="noreferrer">{pickLocalized(p.name, locale)}</a> : pickLocalized(p.name, locale)}
            </strong>
            <p style={{ margin: '6px 0' }}>{pickLocalized(p.description, locale)}</p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {tags.filter(Boolean).map((t, j) => (
                <span key={j} style={{ fontSize: 10, background: '#ece9d8', padding: '2px 6px', borderRadius: 3 }}>{t}</span>
              ))}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
