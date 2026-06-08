'use client'

import type { ReactNode } from 'react'

export type QuestionStatus = 'unanswered' | 'correct' | 'incorrect' | 'review'

type Props = {
  number: number
  status: QuestionStatus
  flagged: boolean
  onToggleFlag: () => void
  children: ReactNode
}

const STATUS_TEXT: Record<QuestionStatus, { label: string; cls: string }> = {
  unanswered: { label: 'Sin responder aún', cls: 'text-[var(--mq-muted)]' },
  correct: { label: 'Correcta', cls: 'text-[#2f6b2f]' },
  incorrect: { label: 'Incorrecta', cls: 'text-[#a33a3a]' },
  review: { label: 'Información', cls: 'text-[var(--mq-muted)]' }
}

const POINTS: Record<QuestionStatus, string> = {
  unanswered: 'Se puntúa 1,00',
  correct: 'Se puntúa 1,00 sobre 1,00',
  incorrect: 'Se puntúa 0,00 sobre 1,00',
  review: ''
}

/**
 * Marco de pregunta tipo Moodle: columna de estado a la izquierda
 * ("Pregunta N · estado · Marcar pregunta") + cuerpo de la pregunta a la derecha.
 * En móvil se apila (estado arriba en horizontal).
 */
export function QuestionFrame({ number, status, flagged, onToggleFlag, children }: Props) {
  const s = STATUS_TEXT[status]
  return (
    <article
      id={`q-${number}`}
      className="overflow-hidden rounded-lg border border-[var(--mq-border)] bg-white shadow-sm scroll-mt-20 sm:flex"
    >
      <aside className="flex shrink-0 flex-row items-center justify-between gap-3 border-b border-[var(--mq-border)] bg-slate-50 px-4 py-2.5 text-[13px] sm:w-44 sm:flex-col sm:items-start sm:justify-start sm:border-b-0 sm:border-r sm:py-4">
        <div>
          <p className="font-bold text-[var(--mq-ink)]">Pregunta <span className="tabular-nums">{number}</span></p>
          <p className={`mt-0.5 font-semibold ${s.cls}`}>{s.label}</p>
          {POINTS[status] && <p className="mt-0.5 text-[11px] text-[var(--mq-muted)]">{POINTS[status]}</p>}
        </div>
        <button
          type="button"
          onClick={onToggleFlag}
          aria-pressed={flagged}
          className={`inline-flex items-center gap-1 border-0 bg-transparent p-0 text-[12px] font-semibold outline-none transition focus-visible:underline ${
            flagged ? 'text-[var(--mq-magenta)] hover:underline' : 'text-[var(--mq-link)] hover:underline'
          }`}
        >
          <span aria-hidden>{flagged ? '🚩' : '⚐'}</span>
          {flagged ? 'Quitar marca' : 'Marcar pregunta'}
        </button>
      </aside>
      <div className="min-w-0 flex-1 p-4 sm:p-5">{children}</div>
    </article>
  )
}
