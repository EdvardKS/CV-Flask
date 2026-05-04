import type { SubjectWithCount } from '@lib/quiz/types'
import type { SessionState } from './useQuizSession'
import { summarize } from './summary'

export async function postQuizResult(subject: SubjectWithCount, session: SessionState, clientId: string): Promise<void> {
  const s = summarize(session)
  const dur = Math.round(((session.finishedAt ?? Date.now()) - session.startedAt) / 1000)
  try {
    await fetch('/api/quiz/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectId: subject.id, clientId,
        correct: s.correct, incorrect: s.incorrect, unanswered: s.unanswered,
        total: s.total, durationSeconds: Math.max(0, Math.min(60 * 60 * 12, dur))
      })
    })
  } catch (e) {
    // Result history is best-effort; the user-facing screen is unaffected.
    if (typeof console !== 'undefined') console.warn('[quiz] result post failed', e)
  }
}
