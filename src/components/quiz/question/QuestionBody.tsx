'use client'

import type { ReactNode } from 'react'
import type { Question } from '@lib/quiz/types'
import { AiHelpButton } from '../AiHelpButton'

type Props = {
  question: Question
  accent: string
  /** Enunciado ya renderizado (permite resaltar huecos en preguntas fill). */
  prompt: ReactNode
  children: ReactNode
}

/**
 * Caja azul "qtext" de Moodle: contexto/instrucciones, enunciado, código y
 * la zona de respuesta (children). El feedback va FUERA, debajo de esta caja.
 */
export function QuestionBody({ question, accent, prompt, children }: Props) {
  return (
    <div className="rounded-lg border border-[var(--mq-qbodyBorder,#cfe2f5)] bg-[var(--mq-qbody)] p-3.5 sm:p-4">
      {question.context && (
        <div className="mb-3 rounded-md border-l-4 border-[var(--mq-link)] bg-white/70 px-3 py-2 text-[13px] leading-relaxed text-[var(--mq-ink)]">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--mq-link)]">Instructions / Contexto</p>
          <p className="whitespace-pre-line">{question.context}</p>
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="flex-1 text-[15px] font-semibold leading-snug text-[var(--mq-ink)] sm:text-base">
          {prompt}
        </div>
        <AiHelpButton question={question} accent={accent} />
      </div>
      {question.code && (
        <pre className="mt-3 overflow-x-auto rounded-md bg-[#0d1b2a] p-3 font-mono text-[12px] leading-relaxed text-slate-100">
{question.code}
        </pre>
      )}
      {question.image && (
        <img
          src={question.image}
          alt="Figura de la pregunta"
          loading="lazy"
          className="mt-3 w-full max-w-xl rounded-md border border-[var(--mq-qbodyBorder,#cfe2f5)] bg-white"
        />
      )}
      <div className="mt-4">{children}</div>
    </div>
  )
}
