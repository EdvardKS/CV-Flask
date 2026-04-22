'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { formatPeriod, humanDuration, parsePeriod, sortByRecency } from './period'
import type { Locale } from '@os/types'

export type TimelineNode = {
  key: string
  period: string
  title: ReactNode
  subtitle?: ReactNode
  location?: ReactNode
  body?: ReactNode
  badge?: ReactNode            // small badge (tags, tech stack)
  avatar?: { src: string; alt: string; fallbackSrc?: string }
  color?: string               // node dot color (defaults per-year hash)
  tag?: string                 // "main", "feat", "current"…
  href?: string                // external link for the title
}

export function Timeline({ nodes, locale = 'es' }: { nodes: TimelineNode[]; locale?: Locale }) {
  const sorted = useMemo(
    () => sortByRecency(nodes, (n) => parsePeriod(n.period)),
    [nodes]
  )
  if (sorted.length === 0) return <p style={{ color: '#888' }}>Sin entradas.</p>

  return (
    <ol className="gh-timeline">
      {sorted.map((n) => (
        <TimelineRow key={n.key} node={n} locale={locale} />
      ))}
    </ol>
  )
}

function TimelineRow({ node, locale }: { node: TimelineNode; locale: Locale }) {
  const [open, setOpen] = useState(false)
  const parsed = parsePeriod(node.period)
  const dot = node.color ?? hashColor(node.key + node.period)
  const duration = humanDuration(parsed.durationMonths, locale as 'es'|'en'|'hy')
  const pretty = formatPeriod(parsed, locale as 'es'|'en'|'hy')
  const hasDetail = !!node.body

  return (
    <li className={`gh-tl-row${open ? ' is-open' : ''}${parsed.current ? ' is-current' : ''}`}>
      <div className="gh-tl-rail" aria-hidden>
        {node.avatar ? (
          <img
            src={node.avatar.src}
            alt={node.avatar.alt}
            className="gh-tl-avatar-dot"
            loading="lazy"
            onError={(e) => {
              const el = e.target as HTMLImageElement
              if (node.avatar?.fallbackSrc && !el.src.endsWith(node.avatar.fallbackSrc)) {
                el.src = node.avatar.fallbackSrc
              } else {
                el.style.display = 'none'
                const dot = el.nextElementSibling as HTMLElement | null
                if (dot) dot.style.display = 'block'
              }
            }}
          />
        ) : null}
        <span
          className="gh-tl-dot"
          style={{ background: dot, display: node.avatar ? 'none' : 'block' }}
        />
      </div>

      <article className="gh-tl-card">
        <header className="gh-tl-head">
          <div className="gh-tl-meta">
            <div className="gh-tl-title">
              {node.href
                ? <a href={node.href} target="_blank" rel="noreferrer">{node.title}</a>
                : node.title}
              {parsed.current && <span className="gh-tl-pill gh-tl-pill-live">● live</span>}
              {node.tag && <span className="gh-tl-pill">{node.tag}</span>}
            </div>
            {node.subtitle && <div className="gh-tl-sub">{node.subtitle}</div>}
            <div className="gh-tl-period">
              <span className="gh-tl-period-date">{pretty}</span>
              {duration && <span className="gh-tl-period-dur">· {duration}</span>}
              {node.location && <span className="gh-tl-period-loc">· {node.location}</span>}
            </div>
            {node.badge && <div className="gh-tl-badge">{node.badge}</div>}
          </div>
          {hasDetail && (
            <button
              type="button"
              className="gh-tl-toggle"
              onClick={() => setOpen(v => !v)}
              aria-expanded={open}
            >
              {open ? '−' : '+'}
            </button>
          )}
        </header>
        {open && hasDetail && <div className="gh-tl-body">{node.body}</div>}
      </article>
    </li>
  )
}

function hashColor(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  const hue = Math.abs(h) % 360
  return `hsl(${hue}, 55%, 45%)`
}
