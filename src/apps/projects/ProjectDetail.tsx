'use client'

import { useEffect, useState } from 'react'
import type { ProdProject } from './ProjectsGrid'

export function ProjectDetail({ p, onBack }: { p: ProdProject; onBack: () => void }) {
  const d = p.detail
  const shots = d?.shots ?? []
  const [zoom, setZoom] = useState<number | null>(null)

  useEffect(() => {
    if (zoom === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(null)
      if (e.key === 'ArrowRight') setZoom(z => (z === null ? null : (z + 1) % shots.length))
      if (e.key === 'ArrowLeft') setZoom(z => (z === null ? null : (z - 1 + shots.length) % shots.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoom, shots.length])

  if (!d) return <p>Sin ficha para este proyecto.</p>

  return (
    <div className="pd">
      <div className="pd-bar">
        <button className="gh-project-btn secondary" onClick={onBack}>&larr; Volver</button>
        {p.url && (
          <a className="gh-project-btn primary" href={p.url} target="_blank" rel="noopener noreferrer">🌐 Abrir la web</a>
        )}
      </div>

      <header className="pd-head">
        <h2 className="pd-title">{p.icon} {p.name}{p.private_panel && <span className="prod-pill">🔒 privado</span>}</h2>
        <p className="pd-lead">{d.que_es}</p>
        <p className="pd-goal"><strong>Objetivo:</strong> {d.objetivo}</p>
        <div className="gh-project-tags">
          {(d.stack ?? p.tags).map(t => <span key={t} className="gh-tl-badge-item">{t}</span>)}
        </div>
      </header>

      {d.highlight && (
        <section className="pd-star">
          <span className="pd-star-tag">Lo más diferenciador</span>
          <h3 className="pd-star-title">{d.highlight.title}</h3>
          <p className="pd-star-body">{d.highlight.body}</p>
        </section>
      )}

      {d.diagram && (
        <section className="pd-block">
          <h3 className="pd-h3">Cómo funciona</h3>
          <figure className="pd-diagram">
            <img src={d.diagram} alt={'Diagrama de flujo de ' + p.name} loading="lazy" />
          </figure>
        </section>
      )}

      {shots.length > 0 && (
        <section className="pd-block">
          <h3 className="pd-h3">Capturas <span className="pd-count">{shots.length}</span></h3>
          <ul className="pd-shots">
            {shots.map((s, i) => (
              <li key={s.src} className="pd-shot">
                <button className="pd-shot-btn" onClick={() => setZoom(i)} title="Ampliar">
                  <img src={s.src} alt={s.caption} loading="lazy" />
                </button>
                <p className="pd-cap">{s.caption}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {zoom !== null && shots[zoom] && (
        <div className="pd-lightbox" onClick={() => setZoom(null)} role="dialog" aria-modal="true">
          <img src={shots[zoom].src} alt={shots[zoom].caption} />
          <p className="pd-lightbox-cap">{shots[zoom].caption}</p>
          <span className="pd-lightbox-hint">{zoom + 1} / {shots.length} · Esc para cerrar</span>
        </div>
      )}
    </div>
  )
}
