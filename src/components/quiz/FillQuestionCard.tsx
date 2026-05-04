'use client'

import { useState, type ReactNode } from 'react'
import { isCorrect, type FillQuestion } from '@lib/quiz/types'
import { ContextBox } from './ContextBox'
import { FeedbackBanner } from './FeedbackBanner'
import { AiHelpButton } from './AiHelpButton'

type Props = {
  question: FillQuestion
  chosen?: string
  accent: string
  onSubmit: (value: string) => void
}

export function FillQuestionCard({ question, chosen, accent, onSubmit }: Props) {
  const answered = chosen !== undefined
  const ok = answered && isCorrect(question, chosen)
  const [draft, setDraft] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = draft.trim()
    if (!value || answered) return
    onSubmit(value)
    setDraft('')
  }

  const display = answered ? chosen! : draft
  const inputClasses = `flex-1 rounded-xl border px-3 py-2 text-base shadow-sm outline-none transition focus:ring-2 ${
    answered
      ? ok
        ? 'border-emerald-300 bg-emerald-50 text-emerald-900 focus:ring-emerald-200'
        : 'border-rose-300 bg-rose-50 text-rose-900 focus:ring-rose-200'
      : 'border-slate-200 bg-white text-slate-900 focus:border-sky-400 focus:ring-sky-200'
  }`

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {question.context && <ContextBox text={question.context} />}
      <div className="flex items-start gap-3">
        <h2 className="flex-1 text-lg font-semibold leading-snug text-slate-900 sm:text-xl">
          {renderWithBlank(question.q, '___')}
        </h2>
        <AiHelpButton question={question} accent={accent} />
      </div>
      {question.hint && <p className="mt-2 text-xs italic text-slate-500">💡 {question.hint}</p>}
      <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={display}
          onChange={e => setDraft(e.target.value)}
          disabled={answered}
          placeholder="Escribe tu respuesta…"
          aria-label="Respuesta"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className={inputClasses}
        />
        {!answered && (
          <button
            type="submit"
            disabled={!draft.trim()}
            className="rounded-xl px-5 py-2 text-base font-bold text-white shadow-sm transition disabled:opacity-40"
            style={{ background: accent }}
          >Comprobar</button>
        )}
      </form>
      {answered && <FeedbackBanner question={question} ok={ok} />}
    </article>
  )
}

function renderWithBlank(text: string, placeholder: string): ReactNode {
  if (!text.includes(placeholder)) return text
  const parts = text.split(placeholder)
  const out: ReactNode[] = []
  parts.forEach((p, i) => {
    out.push(p)
    if (i < parts.length - 1) out.push(<span key={i} className="mx-1 inline-block min-w-[3ch] rounded bg-amber-100 px-2 py-0.5 text-center font-mono text-amber-800">___</span>)
  })
  return <>{out}</>
}
