'use client'

import { QuestionCard } from './QuestionCard'
import { QuizProgressBar } from './QuizProgressBar'
import type { SessionState } from './useQuizSession'

type Props = {
  session: SessionState
  accent: string
  onAnswer: (i: number) => void
  onGoto: (i: number) => void
  onFinish: () => void
}

export function QuizRunner({ session, accent, onAnswer, onGoto, onFinish }: Props) {
  const total = session.questions.length
  const idx = session.currentIndex
  const q = session.questions[idx]
  const chosen = session.answers[idx]
  const answered = Object.keys(session.answers).length

  return (
    <section className="flex flex-col gap-3 pb-24">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold text-slate-300">{idx + 1} / {total}</span>
        <span>Respondidas: {answered}</span>
      </div>
      <QuizProgressBar value={idx + 1} max={total} accent={accent} />

      <QuestionCard question={q} chosen={chosen} accent={accent} onPick={onAnswer} />

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-800 bg-slate-950/90 px-3 py-3 backdrop-blur-md sm:static sm:rounded-2xl sm:border sm:bg-slate-900/60 sm:px-4"
        aria-label="Navegación de preguntas"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <button
            onClick={() => onGoto(idx - 1)}
            disabled={idx === 0}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:opacity-40"
            aria-label="Pregunta anterior"
          >←</button>
          <button
            onClick={() => onGoto(idx + 1)}
            disabled={idx >= total - 1}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:opacity-40"
          >Siguiente →</button>
          <button
            onClick={onFinish}
            className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:brightness-110"
          >Terminar</button>
        </div>
      </nav>
    </section>
  )
}
