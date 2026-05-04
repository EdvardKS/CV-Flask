'use client'

import { useMemo } from 'react'
import { isCorrect, primaryCorrect, type Question } from '@lib/quiz/types'
import { StatTile } from './StatTile'
import { summarize } from './summary'
import type { SessionState } from './useQuizSession'

type Props = {
  session: SessionState
  accent: string
  onRetry: () => void
  onPickAnother: () => void
}

export function ResultsScreen({ session, accent, onRetry, onPickAnother }: Props) {
  const summary = useMemo(() => summarize(session), [session])
  const dur = Math.round(((session.finishedAt ?? Date.now()) - session.startedAt) / 1000)
  const time = `${Math.floor(dur / 60)}:${String(dur % 60).padStart(2, '0')}`

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 text-center sm:p-7">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Resultado</p>
        <p className="mt-2 text-5xl font-black tabular-nums sm:text-6xl" style={{ color: accent }}>{summary.pct}%</p>
        <p className="mt-1 text-sm text-slate-400">{summary.correct} de {summary.total} aciertos en {time}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        <StatTile label="Aciertos" value={String(summary.correct)} accent="#34d399" />
        <StatTile label="Fallos" value={String(summary.incorrect)} accent="#f87171" />
        <StatTile label="Saltadas" value={String(summary.unanswered)} accent="#94a3b8" />
        <StatTile label="Tiempo" value={time} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button onClick={onRetry} className="flex-1 rounded-xl bg-cyan-500 px-5 py-3 text-base font-bold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:brightness-110">
          Reintentar
        </button>
        <button onClick={onPickAnother} className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-base font-medium text-slate-200 transition hover:bg-slate-800">
          Otra asignatura
        </button>
      </div>

      <details className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-200">Ver revisión detallada</summary>
        <ul className="mt-3 flex flex-col gap-2.5">
          {session.questions.map((q, i) => <ReviewRow key={i} q={q} chosen={session.answers[i]} index={i} />)}
        </ul>
      </details>
    </section>
  )
}

function ReviewRow({ q, chosen, index }: { q: Question; chosen?: number; index: number }) {
  const ok = chosen !== undefined && isCorrect(q, chosen)
  const tone = ok ? 'border-emerald-500/50 bg-emerald-500/5' : chosen === undefined ? 'border-slate-700 bg-slate-900/60' : 'border-rose-500/50 bg-rose-500/5'
  return (
    <li className={`rounded-xl border p-3 text-sm ${tone}`}>
      <div className="text-xs text-slate-500">{index + 1}. {ok ? '✅ Acierto' : chosen === undefined ? '⏭️ Sin responder' : '❌ Fallo'}</div>
      <div className="mt-1 font-semibold text-slate-100">{q.q}</div>
      <div className="mt-1 text-slate-300"><span className="text-slate-500">Correcta:</span> {q.options[primaryCorrect(q)]}</div>
      {chosen !== undefined && !ok && <div className="text-rose-300"><span className="text-slate-500">Tu respuesta:</span> {q.options[chosen]}</div>}
    </li>
  )
}

