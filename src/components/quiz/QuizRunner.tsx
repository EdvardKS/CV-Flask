'use client'

import { useState } from 'react'
import type { Answer } from '@lib/quiz/types'
import { QuestionCard } from './QuestionCard'
import { QuestionNavPanel, type ViewMode } from './QuestionNavPanel'
import type { SessionState } from './useQuizSession'

type Props = {
  session: SessionState
  accent: string
  repaso?: boolean
  onAnswer: (value: Answer) => void
  onGoto: (i: number) => void
  onToggleFlag: (i: number) => void
  onFinish: () => void
  onExit?: () => void
}

export function QuizRunner({ session, accent, repaso, onAnswer, onGoto, onToggleFlag, onFinish, onExit }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('single')
  const total = session.questions.length
  const idx = session.currentIndex
  const answered = Object.keys(session.answers).length
  const finishAction = repaso ? (onExit ?? onFinish) : onFinish

  const goAndScroll = (i: number) => {
    onGoto(i)
    if (viewMode === 'all') {
      document.getElementById(`q-${i + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const toggleView = () => setViewMode(m => (m === 'single' ? 'all' : 'single'))

  const navPanel = (
    <QuestionNavPanel
      questions={session.questions}
      answers={session.answers}
      flags={session.flags ?? {}}
      currentIndex={idx}
      repaso={repaso}
      viewMode={viewMode}
      onGoto={goAndScroll}
      onToggleView={toggleView}
      onFinish={finishAction}
    />
  )

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-5">
      {/* Navegación: colapsable en móvil, barra lateral fija en escritorio */}
      <details className="rounded-lg border border-[var(--mq-border)] bg-white p-3 shadow-sm lg:hidden">
        <summary className="cursor-pointer text-[14px] font-bold text-[var(--mq-navy)]">
          Navegación · {answered}/{total} respondidas
        </summary>
        <div className="mt-3">{navPanel}</div>
      </details>

      <div className="order-2 flex min-w-0 flex-col gap-4 lg:order-1">
        <div className="flex items-center justify-between text-[13px] text-[var(--mq-muted)]">
          <span className="font-semibold text-[var(--mq-navy)]">
            {viewMode === 'single' ? `Pregunta ${idx + 1} de ${total}` : `${total} preguntas`}
          </span>
          {repaso ? (
            <span className="rounded-full bg-[var(--mq-noteBg)] px-2.5 py-0.5 font-semibold text-[var(--mq-noteInk)]">Modo repaso</span>
          ) : (
            <span>Respondidas: {answered}</span>
          )}
        </div>

        {viewMode === 'single' ? (
          <>
            <QuestionCard
              question={session.questions[idx]}
              number={idx + 1}
              chosen={session.answers[idx]}
              accent={accent}
              repaso={repaso}
              flagged={!!session.flags?.[idx]}
              onToggleFlag={() => onToggleFlag(idx)}
              onPick={onAnswer}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => goAndScroll(idx - 1)}
                disabled={idx === 0}
                className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-[14px] font-semibold text-[var(--mq-ink)] transition hover:bg-slate-50 disabled:opacity-40"
              >← Anterior</button>
              {idx < total - 1 ? (
                <button
                  onClick={() => goAndScroll(idx + 1)}
                  className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-[14px] font-semibold text-[var(--mq-ink)] transition hover:bg-slate-50"
                >Página siguiente →</button>
              ) : (
                <button
                  onClick={finishAction}
                  className="flex-1 rounded-md bg-[var(--mq-navy)] px-4 py-2.5 text-[14px] font-bold text-white shadow-sm transition hover:brightness-110"
                >{repaso ? 'Salir del repaso' : 'Finalizar intento…'}</button>
              )}
            </div>
          </>
        ) : (
          <>
            {session.questions.map((q, i) => (
              <QuestionCard
                key={i}
                question={q}
                number={i + 1}
                chosen={session.answers[i]}
                accent={accent}
                repaso={repaso}
                flagged={!!session.flags?.[i]}
                onToggleFlag={() => onToggleFlag(i)}
                onPick={value => { onGoto(i); onAnswer(value) }}
              />
            ))}
            <button
              onClick={finishAction}
              className="rounded-md bg-[var(--mq-navy)] px-4 py-2.5 text-[14px] font-bold text-white shadow-sm transition hover:brightness-110"
            >{repaso ? 'Salir del repaso' : 'Finalizar intento…'}</button>
          </>
        )}
      </div>

      <aside className="order-1 hidden lg:sticky lg:top-20 lg:order-2 lg:block">
        {navPanel}
      </aside>
    </div>
  )
}
