'use client'

import { useMemo, useState } from 'react'
import type { SubjectWithCount } from '@lib/quiz/types'
import { SubjectCard } from './SubjectCard'

type Group = { key: string; label: string; sort: number; subjects: SubjectWithCount[] }

function groupLabel(curso?: number, cuatri?: number): string {
  const cursoPart = curso !== undefined ? `${curso}º curso` : 'Otras'
  const cuatriPart = cuatri === 1 ? '1er cuatrimestre' : cuatri === 2 ? '2º cuatrimestre' : 'Anual'
  return curso !== undefined ? `${cursoPart} · ${cuatriPart}` : cursoPart
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export function SubjectFilters({ subjects }: { subjects: SubjectWithCount[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return subjects
    return subjects.filter(s => normalize(`${s.name} ${s.description}`).includes(q))
  }, [subjects, query])

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>()
    for (const s of filtered) {
      const key = `${s.curso ?? 'z'}-${s.cuatrimestre ?? 'an'}`
      const sort = (s.curso ?? 99) * 10 + (s.cuatrimestre ?? 9)
      if (!map.has(key)) map.set(key, { key, label: groupLabel(s.curso, s.cuatrimestre), sort, subjects: [] })
      map.get(key)!.subjects.push(s)
    }
    return Array.from(map.values()).sort((a, b) => a.sort - b.sort)
  }, [filtered])

  if (subjects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-[var(--mq-muted)]">
        <p className="mb-2 text-base font-semibold text-[var(--mq-ink)]">No hay asignaturas todavía</p>
        <p>Añade un fichero <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[var(--mq-link)]">{'{id}.json'}</code> en <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[var(--mq-link)]">public/data/quiz/</code>.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mq-muted)]" aria-hidden>🔍</span>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="¿Qué asignatura estás buscando?"
          aria-label="Buscar asignatura"
          className="w-full rounded-full border border-[var(--mq-border)] bg-white py-3 pl-10 pr-4 text-[15px] text-[var(--mq-ink)] shadow-sm outline-none transition focus:border-[var(--mq-link)] focus:ring-2 focus:ring-[var(--mq-qbodyBorder)]"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-[var(--mq-muted)]">
          Sin resultados para «{query}».
        </p>
      ) : (
        groups.map(group => (
          <section key={group.key} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 border-b border-[var(--mq-border)] pb-1.5 text-[13px] font-bold uppercase tracking-wide text-[var(--mq-muted)]">
              {group.label}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold normal-case">{group.subjects.length}</span>
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.subjects.map(s => (
                <li key={s.id}><SubjectCard subject={s} /></li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
