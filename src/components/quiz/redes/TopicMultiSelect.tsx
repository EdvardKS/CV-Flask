'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export type TopicOption = {
  id: string
  title: string
  count: number
}

type Props = {
  topics: TopicOption[]
  accent: string
  storageKey: string
  destination: string
  ctaLabel: string
  countLabel: string
  emptyHint?: string
  disabled?: boolean
}

function readStored(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function TopicMultiSelect({ topics, accent, storageKey, destination, ctaLabel, countLabel, emptyHint, disabled }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = readStored(storageKey)
    if (stored.length > 0) {
      const valid = stored.filter(id => topics.some(t => t.id === id))
      setSelected(new Set(valid))
    }
    setHydrated(true)
  }, [storageKey, topics])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...selected]))
    } catch {}
  }, [selected, storageKey, hydrated])

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(topics.map(t => t.id)))
  }

  function clearAll() {
    setSelected(new Set())
  }

  function start() {
    if (selected.size === 0) return
    const sorted = [...selected].sort()
    const url = `${destination}?temas=${encodeURIComponent(sorted.join(','))}`
    router.push(url)
  }

  const totalSelected = topics
    .filter(t => selected.has(t.id))
    .reduce((sum, t) => sum + t.count, 0)
  const noneAvailable = topics.length === 0

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
      {noneAvailable ? (
        <p className="text-sm text-slate-500">{emptyHint ?? 'Sin temas disponibles.'}</p>
      ) : (
        <>
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
            {topics.map(t => {
              const checked = selected.has(t.id)
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
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-500">
              {selected.size === 0
                ? 'Marca al menos un tema.'
                : `${selected.size} tema(s) · ${totalSelected} ${countLabel}`}
            </span>
            <button
              type="button"
              onClick={start}
              disabled={disabled || selected.size === 0}
              className="rounded-xl px-4 py-2 text-sm font-bold text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >{ctaLabel}</button>
          </div>
        </>
      )}
    </div>
  )
}
