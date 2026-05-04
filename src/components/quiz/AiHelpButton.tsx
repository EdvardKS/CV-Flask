'use client'

import { useEffect, useState } from 'react'
import type { Question } from '@lib/quiz/types'
import { AiExplainPanel } from './AiExplainPanel'
import { useAiExplain } from './useAiExplain'

type Props = {
  question: Question
  chosen?: number
  subjectName: string
  accent: string
}

export function AiHelpButton({ question, chosen, subjectName, accent }: Props) {
  const [open, setOpen] = useState(false)
  const { text, status, ask, stop, reset } = useAiExplain(subjectName)

  useEffect(() => { reset(); setOpen(false) }, [question, reset])

  const onClick = () => {
    setOpen(true)
    if (status !== 'streaming') ask(question, chosen)
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label="Pedir ayuda a la IA"
        title="Ayuda con esta pregunta"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 active:scale-95"
        style={{ color: accent }}
      >
        <RobotIcon />
      </button>
      {open && (
        <AiExplainPanel
          text={text}
          status={status}
          accent={accent}
          onClose={() => { stop(); setOpen(false) }}
          onRetry={() => ask(question, chosen)}
        />
      )}
    </>
  )
}

function RobotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="7" width="16" height="12" rx="3" />
      <path d="M12 3v4" />
      <circle cx="12" cy="3" r="1" fill="currentColor" />
      <circle cx="9" cy="13" r="1" fill="currentColor" />
      <circle cx="15" cy="13" r="1" fill="currentColor" />
      <path d="M9 17h6" />
      <path d="M2 12h2M20 12h2" />
    </svg>
  )
}
