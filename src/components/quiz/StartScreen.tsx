'use client'

import { useState } from 'react'
import type { SubjectWithCount } from '@lib/quiz/types'

const PRESETS = [10, 20, 50] as const

export function StartScreen({
  subject, onStart, hasResume, onResume
}: {
  subject: SubjectWithCount
  hasResume: boolean
  onStart: (limit?: number) => void
  onResume: () => void
}) {
  const max = subject.questionCount
  const [limit, setLimit] = useState<number | 'all'>(max <= 20 ? 'all' : 20)

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <p className="text-sm text-slate-500">Modo</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-900">Test de {subject.name}</h2>

      <div className="mt-5">
        <p className="mb-2 text-sm font-medium text-slate-700">¿Cuántas preguntas?</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.filter(p => p < max).map(p => (
            <button key={p} type="button" onClick={() => setLimit(p)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${limit === p
                ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{p}</button>
          ))}
          <button type="button" onClick={() => setLimit('all')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${limit === 'all'
              ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Todas ({max})</button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => onStart(limit === 'all' ? undefined : limit)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 px-5 py-3 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110 active:scale-[0.98]">
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
