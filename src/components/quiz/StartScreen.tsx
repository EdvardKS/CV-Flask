'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Question, SubjectWithCount } from '@lib/quiz/types'
import { CategoryMultiCheck, type MultiCheckItem } from './CategoryMultiCheck'
import { AttemptsPanel } from './AttemptsPanel'
import type { AttemptRecord } from './attempts'

type CuatrimestrePick = number | 'all' | 'latest'

const CUATRI_LABEL: Record<number | 'all', string> = {
  1: '1er cuatri',
  2: '2º cuatri',
  all: 'Todo el curso'
}

function categoryLabel(cat: string): string {
  const m = /^unidad-(\d+)$/i.exec(cat) ?? /^tema-(\d+)$/i.exec(cat) ?? /^t(\d+)$/i.exec(cat) ?? /^ud(\d+)$/i.exec(cat)
  if (m) return `Tema ${m[1]}`
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}

type Props = {
  subject: SubjectWithCount
  questions: Question[]
  onStart: (limit?: number, cuatrimestre?: CuatrimestrePick, categories?: string[], repaso?: boolean) => void
  onReviewAttempt: (attempt: AttemptRecord) => void
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

export function StartScreen({ subject, questions, onStart, onReviewAttempt }: Props) {
  const storageKey = `quiz-topics:${subject.id}`
  const cuatris = subject.cuatrimestres ?? []
  const showCuatri = cuatris.length > 1
  const hasLatestTest = subject.id === 'ingles' && questions.some(question => question.group === 'latest-test')
  const [cuatri, setCuatri] = useState<CuatrimestrePick>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)
  const [limitChoice, setLimitChoice] = useState<number | 'all'>('all')
  const [repaso, setRepaso] = useState(false)
  const isMixto = subject.id === 'ingles' && cuatri === 'all'

  const cuatriFiltered = useMemo(() => {
    if (cuatri === 'latest') return questions.filter(q => q.group === 'latest-test')
    if (cuatri === 'all') {
      return subject.id === 'ingles' ? questions : questions.filter(q => q.group !== 'latest-test')
    }
    const regular = questions.filter(q => q.group !== 'latest-test')
    return regular.filter(q => (q.cuatrimestre ?? 1) === cuatri)
  }, [questions, cuatri, subject.id])

  const items: MultiCheckItem[] = useMemo(() => {
    const counts = new Map<string, number>()
    for (const q of cuatriFiltered) {
      if (!q.category) continue
      counts.set(q.category, (counts.get(q.category) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, count]) => ({ id, title: categoryLabel(id), count }))
  }, [cuatriFiltered])

  useEffect(() => {
    const stored = readStored(storageKey)
    if (stored.length > 0) {
      const valid = stored.filter(id => items.some(i => i.id === id))
      setSelected(new Set(valid))
    }
    setHydrated(true)
  }, [storageKey, items])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...selected]))
    } catch { /* noop */ }
  }, [selected, storageKey, hydrated])

  const hasCategories = items.length > 0 && !isMixto
  const effectiveCount = useMemo(() => {
    if (isMixto) return cuatriFiltered.length
    if (!hasCategories) return cuatriFiltered.length
    if (selected.size === 0) return 0
    return cuatriFiltered.filter(q => q.category && selected.has(q.category)).length
  }, [cuatriFiltered, hasCategories, isMixto, selected])

  const PRESETS = [10, 20, 30, 60] as const
  const availablePresets = PRESETS.filter(n => n < effectiveCount)
  const resolvedLimit = limitChoice === 'all' ? effectiveCount : Math.min(limitChoice, effectiveCount)

  function handleStart() {
    const cats = hasCategories && selected.size > 0 ? [...selected] : undefined
    const limit = limitChoice === 'all' ? undefined : Math.min(limitChoice, effectiveCount)
    onStart(limit, cuatri, cats, repaso)
  }

  const canStart = hasCategories ? selected.size > 0 : cuatriFiltered.length > 0

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-lg border border-[var(--mq-border)] bg-white p-5 shadow-sm sm:p-6">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--mq-magenta)]">Configurar intento</p>
        <h2 className="mt-1 text-xl font-bold text-[var(--mq-navy)]">Test de {subject.name}</h2>

        {showCuatri && (
          <div className="mt-5">
            <p className="mb-2 text-[14px] font-semibold text-[var(--mq-ink)]">¿Qué parte del curso?</p>
            <div className="flex flex-wrap gap-2">
              {cuatris.map(c => (
                <Pill key={c} active={cuatri === c} accent={subject.color} onClick={() => setCuatri(c)}>
                  {CUATRI_LABEL[c] ?? `Cuatri ${c}`}
                </Pill>
              ))}
              {hasLatestTest && (
                <Pill active={cuatri === 'latest'} accent={subject.color} onClick={() => setCuatri('latest')}>
                  Último test
                </Pill>
              )}
              <Pill active={cuatri === 'all'} accent={subject.color} onClick={() => setCuatri('all')}>
                {subject.id === 'ingles' ? 'Mixto (mezclado)' : CUATRI_LABEL.all}
              </Pill>
            </div>
          </div>
        )}

        {hasCategories && (
          <div className="mt-5">
            <CategoryMultiCheck items={items} value={selected} onChange={setSelected} countLabel="preguntas" />
          </div>
        )}

        {!hasCategories && (
          <p className="mt-4 text-sm text-[var(--mq-muted)]">{cuatriFiltered.length} preguntas listas para empezar.</p>
        )}

        <div className="mt-5">
          <p className="mb-2 text-[14px] font-semibold text-[var(--mq-ink)]">
            ¿Cuántas preguntas? <span className="text-[var(--mq-muted)]">(máx {effectiveCount})</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {availablePresets.map(n => (
              <Pill key={n} active={limitChoice === n} accent={subject.color} onClick={() => setLimitChoice(n)}>
                {n}
              </Pill>
            ))}
            <Pill active={limitChoice === 'all'} accent={subject.color} onClick={() => setLimitChoice('all')}>
              Todas ({effectiveCount})
            </Pill>
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--mq-noteBorder)] bg-[var(--mq-noteBg)] p-3.5 transition has-[:checked]:brightness-95">
          <input type="checkbox" checked={repaso} onChange={e => setRepaso(e.target.checked)} className="sr-only" />
          <span
            aria-hidden
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ${repaso ? 'bg-[var(--mq-magenta)]' : 'bg-slate-300'}`}
          >
            <span className="pointer-events-none absolute left-2 text-[11px] font-bold leading-none text-white">I</span>
            <span className="pointer-events-none absolute right-2 text-[11px] font-bold leading-none text-slate-500">O</span>
            <span className={`relative z-10 ml-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${repaso ? 'translate-x-5' : 'translate-x-0'}`} />
          </span>
          <span className="text-sm">
            <span className="font-semibold text-[var(--mq-noteInk)]">Modo repaso · {repaso ? 'I activado' : 'O desactivado'}</span>
            <span className="mt-0.5 block text-[13px] leading-relaxed text-[var(--mq-noteInk)]">
              Abre el test con las respuestas correctas, pistas y explicaciones ya mostradas. No puntúa ni guarda el intento.
            </span>
          </span>
        </label>

        <button
          type="button"
          disabled={!canStart}
          onClick={handleStart}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md px-5 py-3 text-[15px] font-bold text-white shadow-sm transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          style={{ backgroundColor: subject.color }}
        >
          {repaso ? 'Empezar repaso' : 'Comenzar intento'} ({resolvedLimit}) <span aria-hidden>▶</span>
        </button>

        <p className="mt-4 text-[12px] text-[var(--mq-muted)]">Tu progreso se guarda automáticamente en este dispositivo.</p>
      </div>

      <AttemptsPanel subjectId={subject.id} accent={subject.color} onReview={onReviewAttempt} />
    </section>
  )
}

function Pill({ active, accent, onClick, children }: { active: boolean; accent: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active
        ? 'rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow-sm'
        : 'rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-[var(--mq-ink)] transition hover:bg-slate-50'}
      style={active ? { backgroundColor: accent } : undefined}
    >
      {children}
    </button>
  )
}
