// @vitest-environment node
import { describe, expect, it } from 'vitest'

describe('redes manifests', () => {
  it('exposes mode summary, temario quizzes and concept topics', async () => {
    const { getRedesModeSummary, getRedesQuizById, getRedesConceptTopic } = await import('../redes')

    const summary = getRedesModeSummary()
    expect(summary).toEqual({
      autoevaluacionCount: 69,
      temarioQuizCount: 17,
      temarioQuestionCount: 309,
      conceptTopicCount: 6
    })

    const quiz = getRedesQuizById('tema-2-1-examen-test')
    expect(quiz).toBeTruthy()
    expect(quiz?.topic).toBe(2)
    expect(quiz?.questionCount).toBe(30)
    expect(quiz?.questions[0]).toMatchObject({
      kind: 'choice',
      cuatrimestre: 2,
      category: 'tema-2',
      sourceFile: 'Tema 2.1.-Examen Test.pdf',
      sourceType: 'pdf-cuestionario'
    })

    const generatedQuiz = getRedesQuizById('tema-5-repaso-del-temario')
    expect(generatedQuiz).toBeTruthy()
    expect(generatedQuiz?.questionCount).toBe(5)
    expect(generatedQuiz?.questions[0]).toMatchObject({
      category: 'tema-5',
      sourceType: 'pptx-convertido',
      sourceFile: 'IPv6-El-Futuro-de-Internet.pptx'
    })

    const deck = getRedesConceptTopic('tema-5')
    expect(deck).toBeTruthy()
    expect(deck?.topic).toBe(5)
    expect(deck?.slides.length).toBeGreaterThanOrEqual(5)
    expect(deck?.slides[0].highlights.length).toBeGreaterThan(0)
  })
})
