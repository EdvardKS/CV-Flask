'use client'

import { useMemo } from 'react'
import type { PadelMatch } from '../store'
import { aggregateSets, calculateScoreData } from '@lib/padel/scoring'
import {
  ERROR_FIELDS, SUCCESS_FIELDS,
  ERROR_LABELS, SUCCESS_LABELS,
  ERROR_WEIGHTS, SUCCESS_WEIGHTS,
  type ErrorField, type SuccessField
} from '@lib/padel/constants'

export function Dashboard({ match }: { match: PadelMatch }) {
  const agg = useMemo(() => aggregateSets(match.sets), [match.sets])
  const score = useMemo(() => calculateScoreData(agg.errors, agg.successes), [agg])

  const topErrors = useMemo(
    () => ERROR_FIELDS
      .map(f => ({ field: f, count: agg.errors[f] ?? 0, weighted: (agg.errors[f] ?? 0) * ERROR_WEIGHTS[f] }))
      .filter(x => x.count > 0)
      .sort((a, b) => b.weighted - a.weighted)
      .slice(0, 5),
    [agg]
  )
  const topSuccesses = useMemo(
    () => SUCCESS_FIELDS
      .map(f => ({ field: f, count: agg.successes[f] ?? 0, weighted: (agg.successes[f] ?? 0) * SUCCESS_WEIGHTS[f] }))
      .filter(x => x.count > 0)
      .sort((a, b) => b.weighted - a.weighted)
      .slice(0, 5),
    [agg]
  )

  const levelColor = {
    'Alto rendimiento': '#2e7d32',
    'Competitivo': '#1565c0',
    'Inestable': '#ef6c00',
    'En desarrollo': '#c62828'
  }[score.nivel]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        <BigStat label="Score" value={`${score.score}`} color={levelColor} />
        <BigStat label="Nivel" value={score.nivel} color={levelColor} />
        <BigStat label="Pts. acierto" value={`${score.puntos_acierto}`} color="#2e7d32" />
        <BigStat label="Pts. error" value={`${score.puntos_error}`} color="#c62828" />
        <BigStat label="Impacto neto" value={`${score.impacto_neto}`} color={score.impacto_neto >= 0 ? '#2e7d32' : '#c62828'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        <TopList title="Top aciertos" items={topSuccesses} labels={SUCCESS_LABELS as Record<string, string>} color="#2e7d32" />
        <TopList title="Errores más costosos" items={topErrors} labels={ERROR_LABELS as Record<string, string>} color="#c62828" />
      </div>

      <div>
        <strong>Resumen por set</strong>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6, fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#0a246a', color: '#fff' }}>
              <th style={th}>Set</th>
              <th style={th}>Aciertos</th>
              <th style={th}>Errores</th>
              <th style={th}>Score</th>
              <th style={th}>Nivel</th>
            </tr>
          </thead>
          <tbody>
            {match.sets.map((row, i) => {
              const setAgg = aggregateSets([row])
              const setScore = calculateScoreData(setAgg.errors, setAgg.successes)
              const totalErr = ERROR_FIELDS.reduce((s, f) => s + (row[f] ?? 0), 0)
              const totalSuc = SUCCESS_FIELDS.reduce((s, f) => s + (row[f] ?? 0), 0)
              return (
                <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={td}>{i + 1}</td>
                  <td style={{ ...td, color: '#2e7d32' }}>{totalSuc}</td>
                  <td style={{ ...td, color: '#c62828' }}>{totalErr}</td>
                  <td style={{ ...td, fontWeight: 'bold' }}>{setScore.score}</td>
                  <td style={td}>{setScore.nivel}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BigStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ border: `2px solid ${color}`, padding: 10, background: '#fff', borderRadius: 4, textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: '#777', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 'bold', color }}>{value}</div>
    </div>
  )
}

function TopList<F extends string>({ title, items, labels, color }: {
  title: string
  items: { field: F; count: number; weighted: number }[]
  labels: Record<string, string>
  color: string
}) {
  if (items.length === 0) return (
    <div>
      <strong style={{ color }}>{title}</strong>
      <p style={{ color: '#999', fontSize: 12 }}>Sin datos aún.</p>
    </div>
  )
  const max = items[0].weighted
  return (
    <div>
      <strong style={{ color }}>{title}</strong>
      <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {items.map(it => (
          <li key={it.field} style={{ fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{labels[it.field] ?? it.field}</span>
              <span style={{ fontWeight: 'bold' }}>{it.count} · {it.weighted.toFixed(1)}pts</span>
            </div>
            <div style={{ height: 5, background: '#eee', borderRadius: 2, marginTop: 2 }}>
              <div style={{ width: `${(it.weighted / max) * 100}%`, height: '100%', background: color, borderRadius: 2 }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

const th: React.CSSProperties = { padding: '6px 8px', textAlign: 'left', fontWeight: 'bold' }
const td: React.CSSProperties = { padding: '6px 8px' }
