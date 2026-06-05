'use client'

import { useState, type ReactNode } from 'react'
import { isCorrect, primaryCorrect, type FillQuestion } from '@lib/quiz/types'
import { QuestionBody } from './question/QuestionBody'
import { AnswerFeedback } from './question/AnswerFeedback'

type Props = {
  question: FillQuestion
  chosen?: string
  accent: string
  repaso?: boolean
  onSubmit: (value: string) => void
}

export function FillQuestionCard({ question, chosen, accent, repaso = false, onSubmit }: Props) {
  const answered = chosen !== undefined
  const revealed = answered || repaso
  const ok = repaso ? true : answered && isCorrect(question, chosen)
  const [draft, setDraft] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = draft.trim()
    if (!value || answered) return
    onSubmit(value)
    setDraft('')
  }

  const display = repaso ? primaryCorrect(question) : answered ? chosen! : draft
  const inputClasses = `w-full max-w-md rounded-md border px-3 py-2 text-[15px] shadow-inner outline-none transition focus:ring-2 ${
    revealed
      ? ok
        ? 'border-[#b7dfb9] bg-[#dff0d8] text-[#2f6b2f] focus:ring-[#b7dfb9]'
        : 'border-[#e4b9b9] bg-[#f2dede] text-[#a33a3a] focus:ring-[#e4b9b9]'
      : 'border-slate-300 bg-white text-[var(--mq-ink)] focus:border-[var(--mq-link)] focus:ring-[var(--mq-qbodyBorder)]'
  }`

  return (
    <>
      <QuestionBody question={question} accent={accent} prompt={renderWithBlank(question.q, '___')}>
        {question.hint && !repaso && !answered && (
          <p className="mb-2 text-[12px] italic text-[var(--mq-muted)]">💡 {question.hint}</p>
        )}
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={display}
            onChange={e => setDraft(e.target.value)}
            disabled={revealed}
            placeholder="Escribe tu respuesta…"
            aria-label="Respuesta"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className={inputClasses}
          />
          {!revealed && (
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-md px-4 py-2 text-[14px] font-bold text-white shadow-sm transition disabled:opacity-40"
              style={{ background: accent }}
            >Comprobar</button>
          )}
          {revealed && (
            <span aria-hidden className={ok ? 'text-[#2f6b2f]' : 'text-[#a33a3a]'}>{ok ? '✓' : '✕'}</span>
          )}
        </form>
      </QuestionBody>
      {revealed && <AnswerFeedback question={question} ok={ok} repaso={repaso} />}
    </>
  )
}

function renderWithBlank(text: string, placeholder: string): ReactNode {
  if (!text.includes(placeholder)) return text
  const parts = text.split(placeholder)
  const out: ReactNode[] = []
  parts.forEach((p, i) => {
    out.push(p)
    if (i < parts.length - 1) {
      out.push(
        <span key={i} className="mx-1 inline-block min-w-[3ch] rounded bg-[var(--mq-noteBg)] px-2 py-0.5 text-center font-mono text-[var(--mq-noteInk)]">___</span>
      )
    }
  })
  return <>{out}</>
}
