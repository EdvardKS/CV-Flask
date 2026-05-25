'use client'

export type MultiCheckItem = {
  id: string
  title: string
  count: number
}

type Props = {
  items: MultiCheckItem[]
  value: Set<string>
  onChange: (next: Set<string>) => void
  countLabel?: string
  emptyHint?: string
}

export function CategoryMultiCheck({ items, value, onChange, countLabel = 'preguntas', emptyHint }: Props) {
  function toggle(id: string) {
    const next = new Set(value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }

  function selectAll() {
    onChange(new Set(items.map(i => i.id)))
  }

  function clearAll() {
    onChange(new Set())
  }

  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyHint ?? 'Sin temas disponibles.'}</p>
  }

  const totalSelected = items.filter(i => value.has(i.id)).reduce((sum, i) => sum + i.count, 0)

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold uppercase tracking-wider text-slate-500">Selecciona temas</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 font-medium text-slate-700 hover:bg-slate-100"
          >Todos</button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 font-medium text-slate-700 hover:bg-slate-100"
          >Ninguno</button>
        </div>
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {items.map(t => {
          const checked = value.has(t.id)
          return (
            <li key={t.id}>
              <label className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                checked ? 'border-slate-400 bg-white shadow-sm' : 'border-slate-200 bg-white/70 hover:border-slate-300'
              }`}>
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(t.id)}
                    className="h-4 w-4 accent-slate-700"
                  />
                  <span className="font-medium text-slate-800">{t.title}</span>
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{t.count}</span>
              </label>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-xs text-slate-500">
        {value.size === 0
          ? 'Marca al menos un tema (o "Todos").'
          : `${value.size} tema(s) · ${totalSelected} ${countLabel}`}
      </p>
    </div>
  )
}
