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
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur sm:p-7">
      <p className="text-sm text-slate-400">Modo</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-100">Test de {subject.name}</h2>

      <div className="mt-5">
        <p className="mb-2 text-sm font-medium text-slate-300">¿Cuántas preguntas?</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.filter(p => p < max).map(p => (
            <button key={p} type="button" onClick={() => setLimit(p)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${limit === p
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{p}</button>
          ))}
          <button type="button" onClick={() => setLimit('all')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${limit === 'all'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>Todas ({max})</button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => onStart(limit === 'all' ? undefined : limit)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-500 px-5 py-3 text-base font-bold text-slate-950 shadow-lg shadow-sky-500/30 transition hover:brightness-110 active:scale-[0.98]">
          Empezar test <span aria-hidden>▶</span>
        </button>
        {hasResume && (
          <button type="button" onClick={onResume}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-base font-medium text-slate-200 transition hover:bg-slate-800">
            Reanudar
          </button>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-500">Tu progreso se guarda automáticamente en este dispositivo.</p>
    </section>
  )
}
