'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Question, SubjectWithCount } from '@lib/quiz/types'
import { CategoryMultiCheck, type MultiCheckItem } from './CategoryMultiCheck'

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
  hasResume: boolean
  onStart: (limit?: number, cuatrimestre?: CuatrimestrePick, categories?: string[], repaso?: boolean) => void
  onResume: () => void
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

export function StartScreen({ subject, questions, onStart, hasResume, onResume }: Props) {
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
      // Mixto (Ingles) incluye latest-test. Otros subjects no tienen latest-test, asi que es no-op.
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
    } catch {}
  }, [selected, storageKey, hydrated])

  const hasCategories = items.length > 0 && !isMixto
  const effectiveCount = useMemo(() => {
    if (isMixto) return cuatriFiltered.length
    if (!hasCategories) return cuatriFiltered.length
    if (selected.size === 0) return 0
    return cuatriFiltered.filter(q => q.category && selected.has(q.category)).length
  }, [cuatriFiltered, hasCategories, isMixto, selected])

  const PRESETS = [30, 60, 100] as const
  const availablePresets = PRESETS.filter(n => n < effectiveCount)
  const resolvedLimit = limitChoice === 'all' ? effectiveCount : Math.min(limitChoice, effectiveCount)

  function handleStart() {
    const cats = hasCategories && selected.size > 0 ? [...selected] : undefined
    const limit = limitChoice === 'all' ? undefined : Math.min(limitChoice, effectiveCount)
    onStart(limit, cuatri, cats, repaso)
  }

  const canStart = hasCategories ? selected.size > 0 : cuatriFiltered.length > 0

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <p className="text-sm text-slate-500">Modo</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-900">Test de {subject.name}</h2>

      {showCuatri && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-slate-700">¿Qué parte del curso?</p>
          <div className="flex flex-wrap gap-2">
            {cuatris.map(c => (
              <button key={c} type="button" onClick={() => setCuatri(c)} className={pillClass(cuatri === c)}>
                {CUATRI_LABEL[c] ?? `Cuatri ${c}`}
              </button>
            ))}
            {hasLatestTest && (
              <button type="button" onClick={() => setCuatri('latest')} className={pillClass(cuatri === 'latest')}>
                Último test
              </button>
            )}
            <button type="button" onClick={() => setCuatri('all')} className={pillClass(cuatri === 'all')}>
              {subject.id === 'ingles' ? 'Mixto' : CUATRI_LABEL.all}
            </button>
          </div>
        </div>
      )}

      {hasCategories && (
        <div className="mt-5">
          <CategoryMultiCheck items={items} value={selected} onChange={setSelected} countLabel="preguntas" />
        </div>
      )}

      {!hasCategories && (
        <p className="mt-4 text-sm text-slate-500">{cuatriFiltered.length} preguntas listas para empezar.</p>
      )}

      <div className="mt-5">
        <p className="mb-2 text-sm font-medium text-slate-700">¿Cuántas preguntas? <span className="text-slate-400">(máx {effectiveCount})</span></p>
        <div className="flex flex-wrap gap-2">
          {availablePresets.map(n => (
            <button key={n} type="button" onClick={() => setLimitChoice(n)} className={pillClass(limitChoice === n)}>
              {n}
            </button>
          ))}
          <button type="button" onClick={() => setLimitChoice('all')} className={pillClass(limitChoice === 'all')}>
            Todas ({effectiveCount})
          </button>
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 transition has-[:checked]:border-amber-400 has-[:checked]:bg-amber-100">
        <input
          type="checkbox"
          checked={repaso}
          onChange={e => setRepaso(e.target.checked)}
          className="sr-only"
        />
        <span
          aria-hidden
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ${repaso ? 'bg-amber-500' : 'bg-slate-300'}`}
        >
          <span className="pointer-events-none absolute left-2 text-[11px] font-bold leading-none text-white">I</span>
          <span className="pointer-events-none absolute right-2 text-[11px] font-bold leading-none text-slate-500">O</span>
          <span className={`relative z-10 ml-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${repaso ? 'translate-x-5' : 'translate-x-0'}`} />
        </span>
        <span className="text-sm">
          <span className="font-semibold text-amber-900">Modo repaso · {repaso ? 'I activado' : 'O desactivado'}</span>
          <span className="mt-0.5 block text-[13px] leading-relaxed text-amber-800">
            Abre el test con las respuestas correctas, pistas y explicaciones ya mostradas. No puntúa.
          </span>
        </span>
      </label>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={!canStart}
          onClick={handleStart}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: subject.color }}
        >
          {repaso ? 'Empezar repaso' : 'Empezar test'} ({resolvedLimit}) <span aria-hidden>▶</span>
        </button>
        {hasResume && (
          <button
            type="button"
            onClick={onResume}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Reanudar
          </button>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-400">Tu progreso se guarda automáticamente en este dispositivo.</p>
    </section>
  )
}

function pillClass(active: boolean) {
  return `rounded-full px-4 py-1.5 text-sm font-medium transition ${active
    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`
}
