'use client'

import type { Answer } from '@lib/quiz/types'
import { QuestionCard } from './QuestionCard'
import { QuizProgressBar } from './QuizProgressBar'
import type { SessionState } from './useQuizSession'

type Props = {
  session: SessionState
  accent: string
  onAnswer: (value: Answer) => void
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
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{idx + 1} / {total}</span>
        <span>Respondidas: {answered}</span>
      </div>
      <QuizProgressBar value={idx + 1} max={total} accent={accent} />

      <QuestionCard
        question={q}
        chosen={chosen}
        accent={accent}
        onPick={onAnswer}
      />

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-3 py-3 shadow-[0_-4px_18px_rgba(15,23,42,0.06)] backdrop-blur sm:static sm:rounded-2xl sm:border sm:bg-white sm:px-4 sm:shadow-sm"
        aria-label="Navegación de preguntas"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <button
            onClick={() => onGoto(idx - 1)}
            disabled={idx === 0}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            aria-label="Pregunta anterior"
          >←</button>
          <button
            onClick={() => onGoto(idx + 1)}
            disabled={idx >= total - 1}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >Siguiente →</button>
          <button
            onClick={onFinish}
            className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-600/30 transition hover:brightness-110"
          >Terminar</button>
        </div>
      </nav>
    </section>
  )
}
