// @vitest-environment node
import { describe, expect, it } from 'vitest'

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9áéíóúñü]+/g, '')
}

describe('redes: tema-N-examenes-de-clase quizzes', () => {
  it('exists for temas 1..4, has clean structure, and is deduped vs other quizzes', async () => {
    const { getRedesTemarioManifest } = await import('../redes')
    const manifest = getRedesTemarioManifest()
    const topicsById = new Map(manifest.topics.map(t => [t.topic, t]))

    for (const topicNum of [1, 2, 3, 4]) {
      const topic = topicsById.get(topicNum)
      expect(topic, `topic ${topicNum} present`).toBeTruthy()

      const quizId = `tema-${topicNum}-examenes-de-clase`
      const quiz = topic!.quizzes.find(q => q.id === quizId)
      expect(quiz, `${quizId} present`).toBeTruthy()
      expect(quiz!.topic).toBe(topicNum)
      expect(quiz!.sourceType).toBe('pdf-cuestionario-clase')
      expect(quiz!.questionCount).toBe(quiz!.questions.length)
      expect(quiz!.questionCount).toBeGreaterThan(0)

      const otherNorms = new Set<string>()
      for (const other of topic!.quizzes) {
        if (other.id === quizId) continue
        for (const q of other.questions) otherNorms.add(normalize(q.q))
      }

      const seenWithinQuiz = new Set<string>()
      for (const q of quiz!.questions) {
        expect(q.kind).toBe('choice')
        if (q.kind !== 'choice') continue
        expect(q.category).toBe(`tema-${topicNum}`)
        expect(Array.isArray(q.options) && q.options.length === 4).toBe(true)
        for (const opt of q.options) expect(typeof opt === 'string' && opt.trim().length > 0).toBe(true)
        const correct = q.correctIndex
        expect(typeof correct).toBe('number')
        expect(correct as number).toBeGreaterThanOrEqual(0)
        expect(correct as number).toBeLessThanOrEqual(3)
        expect(q.sourceFile).toMatch(/^Examen Ud\./)

        const norm = normalize(q.q)
        expect(norm.length, 'question not empty').toBeGreaterThan(0)
        expect(otherNorms.has(norm), `dedup vs other quizzes (tema ${topicNum}): "${q.q}"`).toBe(false)
        expect(seenWithinQuiz.has(norm), `no intra-quiz duplicate: "${q.q}"`).toBe(false)
        seenWithinQuiz.add(norm)
      }
    }
  })

  it('flat redes.json contains all examenes-de-clase questions exactly once', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const flat = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'quiz', 'redes.json'), 'utf8')
    )
    const { getRedesTemarioManifest } = await import('../redes')
    const manifest = getRedesTemarioManifest()

    const flatNorms = flat
      .filter((q: { sourceType?: string }) => q.sourceType === 'pdf-cuestionario-clase')
      .map((q: { q: string }) => normalize(q.q))

    const manifestNorms: string[] = []
    for (const topic of manifest.topics) {
      for (const quiz of topic.quizzes) {
        if (quiz.sourceType !== 'pdf-cuestionario-clase') continue
        for (const q of quiz.questions) manifestNorms.push(normalize(q.q))
      }
    }

    expect(flatNorms.sort()).toEqual(manifestNorms.sort())
  })
})
