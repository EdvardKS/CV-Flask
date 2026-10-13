'use client'

import { useEffect, useState } from 'react'
import { useWM } from '@os/store'
import { APPS_BY_ID } from '@apps/_registry'

export type ProjectCategory = 'ml' | 'dl' | 'genai' | 'web'

export type GhProject = {
  id: string
  name: string
  icon: string
  url: string
  internal?: string
  private?: boolean
  description: string
  tags: string[]
  category?: ProjectCategory
}

/**
 * El orden manda: primero machine learning y ciencia de datos, después deep learning,
 * después IA generativa, y las webs al final.
 */
const CATEGORIES: { id: ProjectCategory; title: string; blurb: string; lead?: boolean }[] = [
  {
    id: 'ml',
    title: '📊 Machine learning y ciencia de datos',
    blurb: 'Datos reales, pipelines de scikit-learn y modelos que se leen por su matriz de confusión, no por su accuracy.',
    lead: true,
  },
  { id: 'dl', title: '🧠 Deep learning', blurb: 'Redes convolucionales, grafos y aprendizaje por refuerzo, entrenados de principio a fin.' },
  { id: 'genai', title: '✨ IA generativa y agentes', blurb: 'RAG, agentes y modelos de lenguaje corriendo en local, en producción.' },
  { id: 'web', title: '🌐 Web y aplicaciones', blurb: 'Producto: lo que la gente usa cada día.' },
]

export type ProjectShot = { src: string; caption: string }

export type ProjectDetailData = {
  que_es: string
  objetivo: string
  stack?: string[]
  shots?: ProjectShot[]
  diagram?: string
  highlight?: { title: string; body: string }
}

// Live apps running on this VPS (shown first, with a screenshot + direct link).
export type ProdProject = {
  id: string
  name: string
  icon: string
  image: string
  url: string | null
  private_panel?: boolean
  description: string
  tags: string[]
  detail?: ProjectDetailData
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

export function ProjectsGrid({ onOpenDetail }: { onOpenDetail?: (p: ProdProject) => void } = {}) {
  const [projects, setProjects] = useState<GhProject[] | null>(null)
  const [prod, setProd] = useState<ProdProject[]>([])
  const [error, setError] = useState<string | null>(null)
  const openApp = useWM(s => s.openApp)

  useEffect(() => {
    fetch('/data/github-projects.json?v=2', { cache: 'no-cache' })
      .then(r => r.json() as Promise<GhProject[]>)
      .then(setProjects)
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
    fetch('/data/production-projects.json?v=2', { cache: 'no-cache' })
      .then(r => r.json() as Promise<ProdProject[]>)
      .then(setProd)
      .catch(() => setProd([]))
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
    <>
      {CATEGORIES.map(cat => {
        const items = projects.filter(p => (p.category ?? 'web') === cat.id)
        const conProduccion = cat.id === 'web' && prod.length > 0
        if (items.length === 0 && !conProduccion) return null
        return (
          <section key={cat.id} className={cat.lead ? 'cat-section is-lead' : 'cat-section'}>
            <h3 className="cat-title">
              {cat.title}
              <span className="cat-count">{items.length + (conProduccion ? prod.length : 0)}</span>
            </h3>
            <p className="cat-blurb">{cat.blurb}</p>
            {conProduccion && (
              <section className="prod-section">
                <h3 className="prod-section-title">🟢 En producción <span>· apps y servicios vivos en este servidor · pulsa una tarjeta para ver su ficha</span></h3>
                <ul className="prod-grid">
                  {prod.map(p => (
                    <li key={p.id} className="prod-card">
                      {p.detail ? (
                        <button className="prod-shot as-button" onClick={() => onOpenDetail?.(p)} title={'Ver ficha de ' + p.name}>
                          <img src={p.image} alt={p.name} loading="lazy" />
                          <span className="prod-open">Ver ficha →</span>
                        </button>
                      ) : p.url ? (
                        <a className="prod-shot" href={p.url} target="_blank" rel="noopener noreferrer" title={'Abrir ' + p.name}>
                          <img src={p.image} alt={p.name} loading="lazy" />
                          <span className="prod-open">Abrir →</span>
                        </a>
                      ) : (
                        <div className="prod-shot is-service"><img src={p.image} alt={p.name} loading="lazy" /></div>
                      )}
                      <div className="prod-body">
                        <strong className="prod-name">{p.icon} {p.name}{p.private_panel && <span className="prod-pill">🔒 panel</span>}</strong>
                        <p className="prod-desc">{p.description}</p>
                        <div className="gh-project-tags">{p.tags.map(t => <span key={t} className="gh-tl-badge-item">{t}</span>)}</div>
                        <div className="prod-actions">
                          {p.detail && (
                            <button className="gh-project-btn primary" onClick={() => onOpenDetail?.(p)}>📄 Ver ficha</button>
                          )}
                          {p.url ? (
                            <a className="gh-project-btn ghost" href={p.url} target="_blank" rel="noopener noreferrer">🌐 Visitar</a>
                          ) : (
                            <span className="prod-internal">Servicio interno · infra</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <ul className="gh-projects-grid">
              {items.map(p => <ProjectCard key={p.id} p={p} onOpen={open} />)}
            </ul>
          </section>
        )
      })}
    </>
  )
}

function ProjectCard({ p, onOpen }: { p: GhProject; onOpen: (p: GhProject) => void }) {
  return (
        <li className="gh-project-card">
          <header className="gh-project-head">
            <span className="gh-project-icon" aria-hidden>{p.icon}</span>
            <div className="gh-project-title-wrap">
              <strong className="gh-project-title">
                <button onClick={() => onOpen(p)} className="gh-project-title-btn">{p.name}</button>
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
              <button className="gh-project-btn primary" onClick={() => onOpen(p)}>🪟 Abrir ventana</button>
            ) : p.private ? (
              p.url.startsWith('https://github.com/') ? (
                <button className="gh-project-btn secondary" disabled title="Repositorio privado">
                  🔒 Privado
                </button>
              ) : (
                <a className="gh-project-btn primary" href={p.url} target="_blank" rel="noopener noreferrer">
                  🌐 Ver el caso
                </a>
              )
            ) : (
              <a className="gh-project-btn primary" href={p.url} target="_blank" rel="noopener noreferrer">
                <GhIcon /> Ver en GitHub
              </a>
            )}
            <a className="gh-project-btn ghost" href={`/projects/${p.id}`} title={'Ficha de ' + p.name}>
              📄 Ficha
            </a>
          </footer>
        </li>
  )
}

function GhIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 1a9 9 0 00-2.85 17.54c.45.08.62-.19.62-.43v-1.7c-2.51.54-3.04-1.2-3.04-1.2-.41-1.04-1-1.32-1-1.32-.82-.56.06-.55.06-.55.9.06 1.38.93 1.38.93.8 1.37 2.11.97 2.63.74.08-.59.31-.98.57-1.2-1.99-.23-4.08-.99-4.08-4.41 0-.97.34-1.77.9-2.39-.09-.23-.39-1.14.09-2.37 0 0 .74-.24 2.42.91a8.42 8.42 0 014.4 0c1.68-1.15 2.42-.91 2.42-.91.48 1.23.18 2.14.09 2.37.56.62.9 1.42.9 2.39 0 3.43-2.09 4.18-4.08 4.4.32.28.6.82.6 1.66v2.46c0 .24.17.52.63.43A9 9 0 0010 1z"/>
    </svg>
  )
}
