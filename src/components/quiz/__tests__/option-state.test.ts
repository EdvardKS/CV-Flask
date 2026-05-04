// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isCorrect, type Question } from '@lib/quiz/types'

const q: Question = { q: '?', options: ['A', 'B', 'C'], correctIndex: [0, 2] }

function stateFor(question: Question, optionIndex: number, chosen?: number) {
  if (chosen === undefined) return 'idle'
  const userOk = isCorrect(question, chosen)
  if (optionIndex === chosen) return userOk ? 'correct' : 'wrong'
  if (!userOk && isCorrect(question, optionIndex)) return 'reveal'
  return 'idle'
}

describe('answer option state machine', () => {
  it('all idle when nothing chosen', () => {
    expect(stateFor(q, 0)).toBe('idle')
    expect(stateFor(q, 1)).toBe('idle')
    expect(stateFor(q, 2)).toBe('idle')
  })
  it('marks chosen as correct when picked is in correct set (multi)', () => {
    expect(stateFor(q, 0, 0)).toBe('correct')
    expect(stateFor(q, 2, 0)).toBe('idle') // already shown via "correct"
  })
  it('marks wrong + reveals all correct alternatives', () => {
    expect(stateFor(q, 1, 1)).toBe('wrong')
    expect(stateFor(q, 0, 1)).toBe('reveal')
    expect(stateFor(q, 2, 1)).toBe('reveal')
  })
})
