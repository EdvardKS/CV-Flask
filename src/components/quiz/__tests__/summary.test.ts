// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { summarize } from '../summary'
import type { SessionState } from '../useQuizSession'

const session = (answers: Record<number, number>): SessionState => ({
  subjectId: 'x', seed: 1, currentIndex: 0, startedAt: 0, finishedAt: 100, answers,
  questions: [
    { q: 'a', options: ['a', 'b'], correctIndex: 1 },
    { q: 'b', options: ['a', 'b', 'c'], correctIndex: [0, 2] },
    { q: 'c', options: ['a', 'b'], correctIndex: 0 }
  ]
})

describe('summarize', () => {
  it('counts a perfect run', () => {
    const r = summarize(session({ 0: 1, 1: 2, 2: 0 }))
    expect(r).toMatchObject({ correct: 3, incorrect: 0, unanswered: 0, total: 3, pct: 100 })
  })
  it('honours multi-correct (any-of-these)', () => {
    const r = summarize(session({ 0: 1, 1: 0, 2: 0 }))
    expect(r.correct).toBe(3) // q1 picked option 0 which is in [0,2] -> correct
  })
  it('counts wrong + unanswered', () => {
    const r = summarize(session({ 0: 0 }))
    expect(r).toMatchObject({ correct: 0, incorrect: 1, unanswered: 2, total: 3, pct: 0 })
  })
})
