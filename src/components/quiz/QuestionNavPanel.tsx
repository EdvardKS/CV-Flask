'use client'

import clsx from 'clsx'
import { isCorrect, type Answer, type Question } from '@lib/quiz/types'

export type ViewMode = 'single' | 'all'

type Props = {
  questions: Question[]
  answers: Record<number, Answer>
  flags: Record<number, boolean>
  currentIndex: number
  repaso?: boolean
  viewMode: ViewMode
  onGoto: (i: number) => void
  onToggleView: () => void
  onFinish: () => void
}

function cellState(q: Question, answer: Answer | undefined, repaso: boolean) {
  if (repaso) return 'review'
  if (answer === undefined) return 'empty'
  return isCorrect(q, answer) ? 'ok' : 'err'
}

/** "Navegación por el cuestionario" tipo Moodle: cuadrícula numerada + acciones. */
export function QuestionNavPanel({
  questions, answers, flags, currentIndex, repaso, viewMode, onGoto, onToggleView, onFinish
}: Props) {
  return (
    <div className="rounded-lg border border-[var(--mq-border)] bg-white p-4 shadow-sm">
      <h2 className="text-[15px] font-bold text-[var(--mq-navy)]">Navegación por el cuestionario</h2>

      <div className="mt-3 grid grid-cols-6 gap-2">
        {questions.map((q, i) => {
          const state = cellState(q, answers[i], repaso ?? false)
          const current = i === currentIndex && viewMode === 'single'
          return (
            <button
              key={i}
              type="button"
              onClick={() => onGoto(i)}
              aria-current={current ? 'true' : undefined}
              aria-label={`Ir a la pregunta ${i + 1}`}
              className={clsx(
                'relative grid aspect-square w-full min-w-0 place-items-center overflow-hidden rounded border text-[13px] font-semibold leading-none tabular-nums transition',
                state === 'empty' && 'border-slate-300 bg-white text-[var(--mq-ink)] hover:bg-slate-50',
                state === 'ok' && 'border-[#86c79a] bg-[#dff0d8] text-[#2f6b2f]',
                state === 'err' && 'border-[#d99] bg-[#f2dede] text-[#a33a3a]',
                state === 'review' && 'border-[var(--mq-qbodyBorder)] bg-[var(--mq-qbody)] text-[var(--mq-navy)]',
                current && 'z-10 ring-2 ring-inset ring-[var(--mq-link)]'
              )}
            >
              {i + 1}
              {flags?.[i] && <span aria-hidden className="absolute right-0.5 top-0.5 text-[9px] leading-none">🚩</span>}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onToggleView}
        className="mt-4 block text-[13px] font-semibold text-[var(--mq-link)] hover:underline"
      >
        {viewMode === 'single' ? 'Mostrar todas las preguntas' : 'Mostrar una página cada vez'}
      </button>

      <button
        type="button"
        onClick={onFinish}
        className="mt-3 w-full rounded-md bg-[var(--mq-navy)] px-4 py-2.5 text-[14px] font-bold text-white shadow-sm transition hover:brightness-110"
      >
        {repaso ? 'Salir del repaso' : 'Finalizar intento…'}
      </button>
    </div>
  )
}
