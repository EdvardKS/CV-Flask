'use client'

import { usePadel, type PadelMatch } from '../store'
import {
  ERROR_FIELDS, SUCCESS_FIELDS,
  ERROR_LABELS, SUCCESS_LABELS,
  type SetRow
} from '@lib/padel/constants'
import { calculateErrorTotal, calculateSuccessTotal } from '@lib/padel/scoring'

export function SetCounter({ match }: { match: PadelMatch }) {
  const addSet = usePadel(s => s.addSet)
  const updateSet = usePadel(s => s.updateSet)
  const removeSet = usePadel(s => s.removeSet)

  const update = (setIndex: number, field: keyof SetRow, delta: number) => {
    const row = { ...match.sets[setIndex] }
    row[field] = Math.max(0, row[field] + delta)
    updateSet(match.id, setIndex, row)
  }

  return (
    <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {match.sets.map((row, i) => (
        <fieldset key={i} style={{ border: '1px solid #c3bfa5', padding: 10, background: '#fdfcf4' }}>
          <legend style={{ fontWeight: 'bold' }}>
            Set {i + 1} · Aciertos: {calculateSuccessTotal(row)} · Errores: {calculateErrorTotal(row)}
            {match.sets.length > 1 && (
              <button
                onClick={() => removeSet(match.id, i)}
                style={{ marginLeft: 8, fontSize: 11, color: '#c00', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕ borrar
              </button>
            )}
          </legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <strong style={{ color: '#2e7d32' }}>Aciertos</strong>
              <FieldList fields={SUCCESS_FIELDS} labels={SUCCESS_LABELS} row={row} onDelta={(f, d) => update(i, f, d)} color="#2e7d32" />
            </div>
            <div>
              <strong style={{ color: '#c62828' }}>Errores</strong>
              <FieldList fields={ERROR_FIELDS} labels={ERROR_LABELS} row={row} onDelta={(f, d) => update(i, f, d)} color="#c62828" />
            </div>
          </div>
        </fieldset>
      ))}
      <button onClick={() => addSet(match.id)} style={{ padding: '8px 14px', alignSelf: 'flex-start' }}>
        + Añadir set
      </button>
    </div>
  )
}

function FieldList<F extends string>({ fields, labels, row, onDelta, color }: {
  fields: readonly F[]
  labels: Record<F, string>
  row: SetRow
  onDelta: (f: F, d: number) => void
  color: string
}) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {fields.map(f => {
        const v = (row as Record<string, number>)[f] ?? 0
        return (
          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{labels[f]}</span>
            <button onClick={() => onDelta(f, -1)} disabled={v === 0} style={btn}>−</button>
            <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 'bold', color: v > 0 ? color : '#999' }}>{v}</span>
            <button onClick={() => onDelta(f, +1)} style={btn}>+</button>
          </li>
        )
      })}
    </ul>
  )
}

const btn: React.CSSProperties = {
  width: 22, height: 22, background: '#ece9d8', border: '1px solid #888', cursor: 'pointer', fontSize: 12, padding: 0
}
