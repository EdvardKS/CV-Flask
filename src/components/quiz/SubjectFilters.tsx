'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { SubjectWithCount } from '@lib/quiz/types'
import { SubjectCard } from './SubjectCard'
import { availableCursos, cursoLabel, filterSubjects } from './subjectFilter'
import { springSnappy, useMotionPreset } from './motion/presets'

type Group = { key: string; label: string; sort: number; subjects: SubjectWithCount[] }

function groupLabel(curso?: number, cuatri?: number): string {
  const cursoPart = curso !== undefined ? `${curso}º curso` : 'Otras'
  const cuatriPart = cuatri === 1 ? '1er cuatrimestre' : cuatri === 2 ? '2º cuatrimestre' : 'Anual'
  return curso !== undefined ? `${cursoPart} · ${cuatriPart}` : cursoPart
}

export function SubjectFilters({ subjects }: { subjects: SubjectWithCount[] }) {
  const [query, setQuery] = useState('')
  const [curso, setCurso] = useState<number | null>(null)
  const m = useMotionPreset()
  const cursos = useMemo(() => availableCursos(subjects), [subjects])

  const filtered = useMemo(() => filterSubjects(subjects, query, curso), [subjects, query, curso])

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
    <motion.div initial="hidden" animate="show" variants={m.section} className="flex flex-col gap-5">
      {/* Buscador */}
      <motion.div variants={m.item} className="group relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--mq-muted)] transition-colors group-focus-within:text-[var(--mq-link)]" aria-hidden>
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="¿Qué asignatura estás buscando?"
          aria-label="Buscar asignatura"
          className="w-full rounded-2xl border-2 border-[var(--mq-border)] bg-white py-3.5 pl-12 pr-11 text-[15px] font-medium text-[var(--mq-ink)] shadow-sm outline-none transition-all duration-200 placeholder:font-normal placeholder:text-[var(--mq-muted)] hover:border-slate-300 focus:border-[var(--mq-link)] focus:shadow-[0_0_0_4px_rgba(31,111,178,0.14)] [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[var(--mq-muted)] transition hover:bg-slate-100 hover:text-[var(--mq-ink)]"
          >✕</button>
        )}
      </motion.div>

      {/* Filtro por curso */}
      {cursos.length > 1 && (
        <motion.div variants={m.item} className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar por curso">
          <CursoPill active={curso === null} onClick={() => setCurso(null)} reduce={m.reduce}>Todos</CursoPill>
          {cursos.map(c => (
            <CursoPill key={c} active={curso === c} onClick={() => setCurso(c)} reduce={m.reduce}>
              {cursoLabel(c)}
            </CursoPill>
          ))}
        </motion.div>
      )}

      {filtered.length === 0 ? (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-[var(--mq-muted)]"
        >
          Sin resultados{query && <> para «{query}»</>}.
        </motion.p>
      ) : (
        groups.map(group => (
          <section key={group.key} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 border-b border-[var(--mq-border)] pb-1.5 text-[13px] font-bold uppercase tracking-wide text-[var(--mq-muted)]">
              {group.label}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold normal-case">{group.subjects.length}</span>
            </h2>
            <motion.ul
              key={`${group.key}-${curso ?? 'all'}`}
              variants={m.container}
              initial="hidden"
              animate="show"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {group.subjects.map(s => (
                <li key={s.id} className="flex"><SubjectCard subject={s} /></li>
              ))}
            </motion.ul>
          </section>
        ))
      )}
    </motion.div>
  )
}

function CursoPill({ active, onClick, reduce, children }: { active: boolean; onClick: () => void; reduce: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="relative rounded-full px-4 py-1.5 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--mq-link)]"
    >
      {active && (
        <motion.span
          layoutId="curso-pill"
          transition={reduce ? { duration: 0 } : springSnappy}
          className="absolute inset-0 rounded-full bg-[var(--mq-navy)] shadow-sm"
          aria-hidden
        />
      )}
      <span className={`relative z-10 ${active ? 'text-white' : 'text-[var(--mq-muted)] hover:text-[var(--mq-navy)]'}`}>{children}</span>
    </button>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
