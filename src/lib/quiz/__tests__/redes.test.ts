// @vitest-environment node
import { describe, expect, it } from 'vitest'

describe('redes manifests', () => {
  it('exposes mode summary, temario quizzes and concept topics', async () => {
    const { getRedesModeSummary, getRedesQuizById, getRedesConceptTopic } = await import('../redes')

    const summary = getRedesModeSummary()
    expect(summary).toEqual({
      autoevaluacionCount: 0,
      temarioQuizCount: 4,
      temarioQuestionCount: 120,
      conceptTopicCount: 6
    })

    const quiz = getRedesQuizById('tema-2-1-examen-test')
    expect(quiz).toBeTruthy()
    expect(quiz?.topic).toBe(2)
    expect(quiz?.questionCount).toBe(30)
    expect(quiz?.questions[0]).toMatchObject({
      kind: 'choice',
      cuatrimestre: 2,
      category: 'tema-2'
    })

    const deck = getRedesConceptTopic('tema-5')
    expect(deck).toBeTruthy()
    expect(deck?.topic).toBe(5)
    expect(deck?.slides.length).toBeGreaterThanOrEqual(5)
    expect(deck?.slides[0].highlights.length).toBeGreaterThan(0)
  })
})
