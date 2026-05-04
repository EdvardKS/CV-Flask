'use client'

import { useMemo, useState } from 'react'
import type { Question, SubjectWithCount } from '@lib/quiz/types'

const PRESETS = [10, 20, 50] as const
type CuatrimestrePick = number | 'all'

const CUATRI_LABEL: Record<number | 'all', string> = {
  1: '1er cuatri',
  2: '2º cuatri',
  all: 'Todo el curso'
}

type Props = {
  subject: SubjectWithCount
  questions: Question[]
  hasResume: boolean
  onStart: (limit?: number, cuatrimestre?: CuatrimestrePick) => void
  onResume: () => void
}

export function StartScreen({ subject, questions, onStart, hasResume, onResume }: Props) {
  const cuatris = subject.cuatrimestres ?? []
  const showCuatri = cuatris.length > 1
  const [cuatri, setCuatri] = useState<CuatrimestrePick>('all')
  const [limit, setLimit] = useState<number | 'all'>(subject.questionCount <= 20 ? 'all' : 20)

  const filteredCount = useMemo(() => {
    if (cuatri === 'all') return questions.length
    return questions.filter(q => (q.cuatrimestre ?? 1) === cuatri).length
  }, [questions, cuatri])

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <p className="text-sm text-slate-500">Modo</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-900">Test de {subject.name}</h2>

      {showCuatri && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-slate-700">¿Qué parte del curso?</p>
          <div className="flex flex-wrap gap-2">
            {cuatris.map(c => (
              <button key={c} type="button" onClick={() => setCuatri(c)}
                className={pillClass(cuatri === c)}>{CUATRI_LABEL[c] ?? `Cuatri ${c}`}</button>
            ))}
            <button type="button" onClick={() => setCuatri('all')}
              className={pillClass(cuatri === 'all')}>{CUATRI_LABEL.all}</button>
          </div>
        </div>
      )}

      <div className="mt-5">
        <p className="mb-2 text-sm font-medium text-slate-700">¿Cuántas preguntas?</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.filter(p => p < filteredCount).map(p => (
            <button key={p} type="button" onClick={() => setLimit(p)}
              className={pillClass(limit === p)}>{p}</button>
          ))}
          <button type="button" onClick={() => setLimit('all')}
            className={pillClass(limit === 'all')}>Todas ({filteredCount})</button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button type="button" disabled={filteredCount === 0}
          onClick={() => onStart(limit === 'all' ? undefined : limit, cuatri)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 px-5 py-3 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
          Empezar test <span aria-hidden>▶</span>
        </button>
        {hasResume && (
          <button type="button" onClick={onResume}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-50">
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
