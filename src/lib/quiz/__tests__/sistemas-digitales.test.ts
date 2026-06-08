// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { questionsSchema, subjectMetaSchema } from '../types'

const SEED_DIR = path.join(process.cwd(), 'public', 'data', 'quiz')

function readJson(file: string) {
  return JSON.parse(readFileSync(path.join(SEED_DIR, file), 'utf8'))
}

describe('sistemas-digitales bank', () => {
  const raw = readJson('sistemas-digitales.json')
  const questions = questionsSchema.parse(raw)
  const simulacro = questions.filter(q => q.category === 'simulacro-examen')

  it('parses the whole bank and keeps the 20 base + 12 simulacro questions', () => {
    expect(questions.length).toBe(32)
    expect(simulacro.length).toBe(12)
  })

  it('every simulacro question is an image-backed 4-option choice with a valid answer', () => {
    for (const q of simulacro) {
      expect(q.kind).toBe('choice')
      expect(q.cuatrimestre).toBe(2)
      expect(q.image).toMatch(/^\/data\/quiz\/sistemas-digitales\/assets\/q\d+\.jpg$/)
      if (q.kind !== 'choice') continue
      expect(q.options).toHaveLength(4)
      const idx = Array.isArray(q.correctIndex) ? q.correctIndex[0] : q.correctIndex
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(q.options.length)
      expect(q.evidence && q.evidence.length).toBeTruthy()
    }
  })
})

describe('sistemas-digitales subject metadata', () => {
  const subjects = readJson('_subjects.json') as unknown[]
  const meta = subjectMetaSchema.parse(
    subjects.find(s => (s as { id: string }).id === 'sistemas-digitales')
  )

  it('is a 1st-year subject with two external study materials', () => {
    expect(meta.curso).toBe(1)
    expect(meta.materials).toHaveLength(2)
    for (const m of meta.materials ?? []) {
      expect(m.url).toMatch(/^\/data\/quiz\/sistemas-digitales\/.+\.html$/)
      expect(m.title.length).toBeGreaterThan(0)
    }
  })
})
