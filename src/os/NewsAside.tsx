'use client'

import { useCallback, useEffect, useState } from 'react'
import clsx from 'clsx'
import { useUI } from './uiStore'

type NewsItem = {
  id: string
  source: 'github' | 'linkedin'
  kind: string
  title: string
  detail?: string
  url?: string
  at: string
  repo?: string
  avatar?: string
  tags?: string[]
}
type Feed = {
  updatedAt: string
  ok: boolean
  items: NewsItem[]
  errors?: string[]
  profile?: { name?: string; headline?: string; photo?: string; url: string }
}

export function NewsAside() {
  const [feed, setFeed] = useState<Feed | null>(null)
  const [loading, setLoading] = useState(false)
  const open = useUI(s => s.notificationsOpen)
  const setOpen = useUI(s => s.setNotifications)

  const load = useCallback(async (force = false) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/news${force ? '?refresh=1' : ''}`, { cache: 'no-store' })
      const data = (await res.json()) as Feed
      setFeed(data)
    } catch (e) {
      console.error('[news] load', e)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(false) }, [load])

  if (!open) return null

  return (
    <aside className={clsx('news-aside')}>
      <header className="news-head">
        <div className="news-title-block">
          <span className="news-title">Notificaciones</span>
          <span className="news-subtitle">{formatDateHeader()}</span>
        </div>
        <button
          className="news-collapse-btn"
          onClick={() => setOpen(false)}
          aria-label="Cerrar panel"
          title="Cerrar"
        >
          ×
        </button>
      </header>

      {open && (
        <>
          {feed?.profile?.photo && (
            <div className="news-profile">
              <img src={feed.profile.photo} alt={feed.profile.name ?? ''} />
              <div>
                <strong>{feed.profile.name}</strong>
                <span>{feed.profile.headline}</span>
              </div>
            </div>
          )}

          <div className="news-meta">
            <span>
              {loading ? 'Actualizando…' : feed ? `Hace ${relative(feed.updatedAt)}` : '—'}
            </span>
            <button
              className="news-refresh"
              onClick={() => load(true)}
              disabled={loading}
              title="Refrescar"
            >↻</button>
          </div>

          {feed?.errors?.length ? (
            <div className="news-warn" title={feed.errors.join(' · ')}>
              ⚠ Fuente limitada ({feed.errors.join(', ')})
            </div>
          ) : null}

          <ul className="news-list">
            {!feed && Array.from({ length: 3 }).map((_, i) => (
              <li key={`sk-${i}`} className="news-item news-skeleton">
                <span className="news-dot" />
                <div className="news-body">
                  <span className="sk-line sk-line-w" />
                  <span className="sk-line" />
                </div>
              </li>
            ))}
            {feed?.items.length === 0 && (
              <li className="news-empty">Sin actividad reciente.</li>
            )}
            {feed?.items.map(it => (
              <li key={it.id} className="news-item">
                <span
                  className="news-dot"
                  style={{ background: it.source === 'github' ? '#24292f' : '#0a66c2' }}
                  aria-hidden
                >{it.source === 'github' ? <GhIcon /> : <LiIcon />}</span>
                <a
                  className="news-body"
                  href={it.url ?? '#'}
                  target={it.url ? '_blank' : undefined}
                  rel={it.url ? 'noopener noreferrer' : undefined}
                >
                  <strong>{it.title}</strong>
                  {it.detail && <span className="news-detail">{it.detail}</span>}
                  {it.tags && it.tags.length > 0 && (
                    <span className="news-tags">
                      {it.tags.slice(0, 4).map(t => (
                        <span key={t} className="news-tag">#{t}</span>
                      ))}
                    </span>
                  )}
                  <span className="news-when">{relative(it.at)}</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  )
}

function formatDateHeader(): string {
  try {
    return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
      .format(new Date())
      .replace(/^\w/, c => c.toUpperCase())
  } catch { return new Date().toLocaleDateString() }
}

function relative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diffMs / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60); if (m < 60) return `${m} min`
  const h = Math.floor(m / 60); if (h < 24) return `${h} h`
  const d = Math.floor(h / 24); if (d < 30) return `${d} d`
  const mo = Math.floor(d / 30); if (mo < 12) return `${mo} mes`
  return `${Math.floor(mo / 12)} años`
}

function GhIcon() {
  return (
    <svg viewBox="0 0 20 20" width="10" height="10" aria-hidden fill="#fff">
      <path d="M10 1a9 9 0 00-2.85 17.54c.45.08.62-.19.62-.43v-1.7c-2.51.54-3.04-1.2-3.04-1.2-.41-1.04-1-1.32-1-1.32-.82-.56.06-.55.06-.55.9.06 1.38.93 1.38.93.8 1.37 2.11.97 2.63.74.08-.59.31-.98.57-1.2-1.99-.23-4.08-.99-4.08-4.41 0-.97.34-1.77.9-2.39-.09-.23-.39-1.14.09-2.37 0 0 .74-.24 2.42.91a8.42 8.42 0 014.4 0c1.68-1.15 2.42-.91 2.42-.91.48 1.23.18 2.14.09 2.37.56.62.9 1.42.9 2.39 0 3.43-2.09 4.18-4.08 4.4.32.28.6.82.6 1.66v2.46c0 .24.17.52.63.43A9 9 0 0010 1z"/>
    </svg>
  )
}
function LiIcon() {
  return (
    <svg viewBox="0 0 20 20" width="10" height="10" aria-hidden fill="#fff">
      <path d="M4 7h3v9H4V7zm1.5-3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM9 7h3v1.3c.5-.9 1.5-1.5 2.8-1.5 2.2 0 3.2 1.4 3.2 3.7V16h-3v-4.8c0-1.1-.4-1.8-1.5-1.8-1 0-1.5.7-1.5 1.7V16H9V7z"/>
    </svg>
  )
}
