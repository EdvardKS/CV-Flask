import { isCorrect } from '@lib/quiz/types'
import type { SessionState } from './useQuizSession'

export type Summary = {
  correct: number
  incorrect: number
  unanswered: number
  total: number
  pct: number
}

export function summarize(session: SessionState): Summary {
  let correct = 0, incorrect = 0, unanswered = 0
  session.questions.forEach((q, i) => {
    const a = session.answers[i]
    if (a === undefined) unanswered++
    else if (isCorrect(q, a)) correct++
    else incorrect++
  })
  const total = session.questions.length
  const pct = total ? Math.round((correct / total) * 100) : 0
  return { correct, incorrect, unanswered, total, pct }
}
