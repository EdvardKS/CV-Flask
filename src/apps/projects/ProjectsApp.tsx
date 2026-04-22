'use client'

import { useEffect, useState } from 'react'
import { loadCVData, pickLocalized, type CVData } from '@lib/cv-data'
import { useLocale, useT } from '@lib/i18n/config'

export function ProjectsApp() {
  const [data, setData] = useState<CVData | null>(null)
  const locale = useLocale(s => s.locale)
  const t = useT()

  useEffect(() => { loadCVData().then(setData).catch(console.error) }, [])
  if (!data) return <p>{t('loading')}</p>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
      {data.translations.projects.entries.map((p, i) => {
        const tags = Array.isArray(p.tags) ? p.tags : (pickLocalized(p.tags, locale) ?? '').split(',').map(s => s.trim())
        return (
          <article key={i} style={{
            border: '1px solid #c3bfa5',
            background: '#fdfcf4',
            padding: 14,
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>
              {p.url ? <a href={p.url} target="_blank" rel="noreferrer">{pickLocalized(p.name, locale)}</a> : pickLocalized(p.name, locale)}
            </h3>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#333' }}>
              {pickLocalized(p.description, locale)}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 'auto' }}>
              {tags.filter(Boolean).map((tt, j) => (
                <span key={j} style={{ fontSize: 10, background: '#0a246a', color: '#fff', padding: '2px 6px', borderRadius: 3 }}>
                  {tt}
                </span>
              ))}
            </div>
          </article>
        )
      })}
    </div>
  )
}
