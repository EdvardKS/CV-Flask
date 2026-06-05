'use client'

import { useMemo } from 'react'
import { AttemptResultView } from './AttemptResultView'
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
  const finishedAt = session.finishedAt ?? Date.now()

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-[var(--mq-navy)]">Revisión del intento</h2>
      <AttemptResultView
        accent={accent}
        correct={summary.correct}
        incorrect={summary.incorrect}
        unanswered={summary.unanswered}
        total={summary.total}
        pct={summary.pct}
        durationSeconds={Math.round((finishedAt - session.startedAt) / 1000)}
        startedAt={session.startedAt}
        finishedAt={finishedAt}
        questions={session.questions}
        answers={session.answers}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={onRetry}
          className="flex-1 rounded-md bg-[var(--mq-navy)] px-5 py-3 text-[15px] font-bold text-white shadow-sm transition hover:brightness-110"
        >Volver a intentar</button>
        <button
          onClick={onPickAnother}
          className="rounded-md border border-slate-300 bg-white px-5 py-3 text-[15px] font-semibold text-[var(--mq-ink)] transition hover:bg-slate-50"
        >Otra asignatura</button>
      </div>
    </section>
  )
}
