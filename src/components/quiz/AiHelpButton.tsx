'use client'

import type { Question } from '@lib/quiz/types'
import { buildAiSearchUrl } from './aiSearchUrl'

export function AiHelpButton({ question, accent }: { question: Question; accent: string }) {
  const onClick = () => {
    const url = buildAiSearchUrl(question.q, question.options)
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Abrir búsqueda con IA en una pestaña nueva"
      title="Abrir búsqueda con IA en una pestaña nueva"
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:shadow active:scale-95"
      style={{ color: accent }}
    >
      <RobotIcon />
    </button>
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
