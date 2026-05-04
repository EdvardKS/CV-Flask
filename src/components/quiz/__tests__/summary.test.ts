// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { summarize } from '../summary'
import type { SessionState } from '../useQuizSession'

const session = (answers: Record<number, number | string>): SessionState => ({
  subjectId: 'x', seed: 1, currentIndex: 0, startedAt: 0, finishedAt: 100, answers,
  questions: [
    { kind: 'choice', q: 'a', options: ['a', 'b'], correctIndex: 1 },
    { kind: 'choice', q: 'b', options: ['a', 'b', 'c'], correctIndex: [0, 2] },
    { kind: 'choice', q: 'c', options: ['a', 'b'], correctIndex: 0 },
    { kind: 'fill', q: 'd', accept: ['Hello', 'hi'] }
  ]
})

describe('summarize', () => {
  it('counts a perfect run including a fill', () => {
    const r = summarize(session({ 0: 1, 1: 2, 2: 0, 3: 'HELLO' }))
    expect(r).toMatchObject({ correct: 4, incorrect: 0, unanswered: 0, total: 4, pct: 100 })
  })
  it('honours multi-correct (any-of-these)', () => {
    const r = summarize(session({ 0: 1, 1: 0, 2: 0, 3: 'hi' }))
    expect(r.correct).toBe(4)
  })
  it('counts wrong fill + unanswered', () => {
    const r = summarize(session({ 0: 0, 3: 'wrong' }))
    expect(r).toMatchObject({ correct: 0, incorrect: 2, unanswered: 2, total: 4, pct: 0 })
  })
})
