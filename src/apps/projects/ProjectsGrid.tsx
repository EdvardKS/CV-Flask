'use client'

import { useEffect, useState } from 'react'
import { useWM } from '@os/store'
import { APPS_BY_ID } from '@apps/_registry'

export type GhProject = {
  id: string
  name: string
  icon: string
  url: string
  internal?: string
  private?: boolean
  description: string
  tags: string[]
}

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

export function ProjectsGrid() {
  const [projects, setProjects] = useState<GhProject[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const openApp = useWM(s => s.openApp)

  useEffect(() => {
    fetch('/data/github-projects.json', { cache: 'force-cache' })
      .then(r => r.json() as Promise<GhProject[]>)
      .then(setProjects)
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  if (error) return <p style={{ color: '#c00' }}>Error: {error}</p>
  if (!projects) return <p>Cargando proyectos…</p>

  const open = (p: GhProject) => {
    if (p.internal) {
      const r = resolveInternal(p.internal)
      if (r) {
        const m = APPS_BY_ID[r.appId]
        if (m) { openApp(m, r.params); return }
      }
    }
    window.open(p.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <ul className="gh-projects-grid">
      {projects.map(p => (
        <li key={p.id} className="gh-project-card">
          <header className="gh-project-head">
            <span className="gh-project-icon" aria-hidden>{p.icon}</span>
            <div className="gh-project-title-wrap">
              <strong className="gh-project-title">
                <button onClick={() => open(p)} className="gh-project-title-btn">{p.name}</button>
              </strong>
              <div className="gh-project-meta">
                <span className={p.private ? 'gh-project-pill is-private' : 'gh-project-pill is-public'}>
                  {p.private ? '🔒 Private' : 'Public'}
                </span>
                {p.internal && <span className="gh-project-pill is-live">● live</span>}
              </div>
            </div>
          </header>
          <p className="gh-project-desc">{p.description}</p>
          <div className="gh-project-tags">
            {p.tags.map(t => <span key={t} className="gh-tl-badge-item">{t}</span>)}
          </div>
          <footer className="gh-project-actions">
            {p.internal ? (
              <button className="gh-project-btn primary" onClick={() => open(p)}>🪟 Abrir ventana</button>
            ) : p.private ? (
              <button className="gh-project-btn secondary" disabled title="Repositorio privado">
                🔒 Privado
              </button>
            ) : (
              <a className="gh-project-btn primary" href={p.url} target="_blank" rel="noopener noreferrer">
                <GhIcon /> Ver en GitHub
              </a>
            )}
            {!p.private && (
              <a className="gh-project-btn ghost" href={p.url} target="_blank" rel="noopener noreferrer" title="Ver en GitHub">
                <GhIcon />
              </a>
            )}
          </footer>
        </li>
      ))}
    </ul>
  )
}

function GhIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 1a9 9 0 00-2.85 17.54c.45.08.62-.19.62-.43v-1.7c-2.51.54-3.04-1.2-3.04-1.2-.41-1.04-1-1.32-1-1.32-.82-.56.06-.55.06-.55.9.06 1.38.93 1.38.93.8 1.37 2.11.97 2.63.74.08-.59.31-.98.57-1.2-1.99-.23-4.08-.99-4.08-4.41 0-.97.34-1.77.9-2.39-.09-.23-.39-1.14.09-2.37 0 0 .74-.24 2.42.91a8.42 8.42 0 014.4 0c1.68-1.15 2.42-.91 2.42-.91.48 1.23.18 2.14.09 2.37.56.62.9 1.42.9 2.39 0 3.43-2.09 4.18-4.08 4.4.32.28.6.82.6 1.66v2.46c0 .24.17.52.63.43A9 9 0 0010 1z"/>
    </svg>
  )
}
