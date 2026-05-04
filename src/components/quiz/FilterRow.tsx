'use client'

import clsx from 'clsx'

export type FilterValue = number | 'all'

type Props = {
  label: string
  current: FilterValue
  values: number[]
  onChange: (v: FilterValue) => void
  format: (v: number) => string
  allLabel?: string
}

export function FilterRow({ label, current, values, onChange, format, allLabel = 'Todos' }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <button type="button" onClick={() => onChange('all')} className={pillClass(current === 'all')}>
        {allLabel}
      </button>
      {values.map(v => (
        <button key={v} type="button" onClick={() => onChange(v)} className={pillClass(current === v)}>
          {format(v)}
        </button>
      ))}
    </div>
  )
}

function pillClass(active: boolean) {
  return clsx(
    'rounded-full px-3 py-1 text-xs font-medium transition',
    active
      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
      : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300'
  )
}
