'use client'

import { useMemo, useState } from 'react'
import { SKILL_CATEGORIES, type SkillCategory } from './skills-data'

export function SkillsChart() {
  const [focusId, setFocusId] = useState<string | null>(null)
  const categories = SKILL_CATEGORIES

  return (
    <div className="skills-wrap">
      <Radar categories={categories} focusId={focusId} onHover={setFocusId} />

      <div className="skills-cats-grid">
        {categories.map(cat => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            focused={focusId === cat.id}
            onFocus={() => setFocusId(cat.id)}
            onBlur={() => setFocusId(null)}
          />
        ))}
      </div>
    </div>
  )
}

function Radar({ categories, focusId, onHover }: {
  categories: SkillCategory[]
  focusId: string | null
  onHover: (id: string | null) => void
}) {
  const size = 340
  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2 - 52
  const n = categories.length
  const levels = [20, 40, 60, 80, 100]

  const points = useMemo(() => categories.map((c, i) => {
    const angle = (-Math.PI / 2) + (i / n) * Math.PI * 2
    const r = (c.overall / 100) * maxR
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      labelX: cx + Math.cos(angle) * (maxR + 26),
      labelY: cy + Math.sin(angle) * (maxR + 26),
      angle,
      cat: c
    }
  }), [categories, cx, cy, maxR, n])

  const polygon = points.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <figure className="skills-radar">
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" role="img" aria-label="Radar de habilidades">
        {/* Concentric grid */}
        {levels.map(l => (
          <polygon
            key={l}
            points={categories.map((_, i) => {
              const a = (-Math.PI / 2) + (i / n) * Math.PI * 2
              const r = (l / 100) * maxR
              return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`
            }).join(' ')}
            fill="none"
            stroke="rgba(10,36,106,0.12)"
            strokeWidth="1"
          />
        ))}
        {/* Radial spokes */}
        {points.map((p, i) => (
          <line key={`s-${i}`} x1={cx} y1={cy} x2={cx + Math.cos(p.angle) * maxR} y2={cy + Math.sin(p.angle) * maxR} stroke="rgba(10,36,106,0.10)" strokeWidth="1" />
        ))}
        {/* Data polygon */}
        <polygon
          points={polygon}
          fill="url(#radar-fill)"
          stroke="#0a246a"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Gradients */}
        <defs>
          <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.25" />
          </radialGradient>
        </defs>
        {/* Points */}
        {points.map((p) => (
          <g key={p.cat.id}>
            <circle
              cx={p.x} cy={p.y}
              r={focusId === p.cat.id ? 8 : 5}
              fill={p.cat.color}
              stroke="#fff"
              strokeWidth="2"
              onMouseEnter={() => onHover(p.cat.id)}
              onMouseLeave={() => onHover(null)}
              style={{ cursor: 'pointer' }}
            />
          </g>
        ))}
        {/* Axis labels */}
        {points.map((p) => {
          const textAnchor = p.labelX < cx - 6 ? 'end' : p.labelX > cx + 6 ? 'start' : 'middle'
          return (
            <g key={`l-${p.cat.id}`} onMouseEnter={() => onHover(p.cat.id)} onMouseLeave={() => onHover(null)} style={{ cursor: 'pointer' }}>
              <text
                x={p.labelX}
                y={p.labelY}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={focusId === p.cat.id ? 700 : 600}
                fill={focusId === p.cat.id ? p.cat.color : '#0f172a'}
              >
                {p.cat.icon} {p.cat.name}
              </text>
              <text
                x={p.labelX}
                y={p.labelY + 13}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fontSize={10}
                fill="#64748b"
              >
                {p.cat.overall}%
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption>
        Nivel global por área · <strong>pasa el ratón</strong> para resaltar
      </figcaption>
    </figure>
  )
}

function CategoryCard({ cat, focused, onFocus, onBlur }: {
  cat: SkillCategory
  focused: boolean
  onFocus: () => void
  onBlur: () => void
}) {
  return (
    <article
      className={`skills-card${focused ? ' is-focused' : ''}`}
      style={{ borderColor: focused ? cat.color : undefined }}
      onMouseEnter={onFocus}
      onMouseLeave={onBlur}
    >
      <header className="skills-card-head">
        <span className="skills-card-icon" style={{ background: cat.color }}>{cat.icon}</span>
        <div className="skills-card-title">
          <strong>{cat.name}</strong>
          <span>{cat.narrative}</span>
        </div>
        <span className="skills-card-pct" style={{ color: cat.color }}>{cat.overall}<small>%</small></span>
      </header>
      <ul className="skills-bars">
        {cat.skills.map(s => (
          <li key={s.name} className={s.hot ? 'is-hot' : ''}>
            <span className="skills-bar-label">
              {s.name}
              {s.hot && <span className="skills-hot" title="Tendencia actual" style={{ background: cat.color }}>HOT</span>}
            </span>
            <span className="skills-bar-track">
              <span
                className="skills-bar-fill"
                style={{ width: `${s.level}%`, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}b3)` }}
              />
            </span>
            <span className="skills-bar-pct">{s.level}%</span>
          </li>
        ))}
      </ul>
    </article>
  )
}
