// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const SUBJECTS = [{
  id: 'test-asg', name: 'Test Asg', description: 'desc', icon: '🧪', color: '#000'
}]
const QUESTIONS = [
  { q: '2+2?', options: ['3', '4'], correctIndex: 1 },
  { q: 'foo?', options: ['a', 'b', 'c'], correctIndex: 2, category: 'cat' },
  { q: 'multi?', options: ['x', 'y', 'z'], correctIndex: [1, 2] }
]

describe('quiz repo + seed', () => {
  let tmp: string
  beforeEach(async () => {
    tmp = mkdtempSync(path.join(tmpdir(), 'quiz-test-'))
    const seedDir = path.join(tmp, 'seed'); mkdirSync(seedDir, { recursive: true })
    writeFileSync(path.join(seedDir, '_subjects.json'), JSON.stringify(SUBJECTS))
    writeFileSync(path.join(seedDir, 'test-asg.json'), JSON.stringify(QUESTIONS))
    process.env.QUIZ_DB_PATH = path.join(tmp, 'db', 'q.db')
    process.env.QUIZ_SEED_DIR = seedDir
    const { closeQuizDb } = await import('../db')
    closeQuizDb()
  })
  afterEach(async () => {
    const { closeQuizDb } = await import('../db')
    closeQuizDb()
    rmSync(tmp, { recursive: true, force: true })
  })

  it('seeds subjects + questions and lists them (incl. multi-correct)', async () => {
    const { seedQuizDb } = await import('../seed')
    const { listSubjects, listQuestions } = await import('../repo')
    const { isCorrect, primaryCorrect } = await import('../types')
    const r = await seedQuizDb()
    expect(r.subjects).toBe(1)
    expect(r.ingested).toContain('test-asg')
    const subjects = listSubjects()
    expect(subjects[0]).toMatchObject({ id: 'test-asg', name: 'Test Asg', questionCount: 3 })
    const qs = listQuestions('test-asg')
    expect(qs).toHaveLength(3)
    expect(qs[0]).toMatchObject({ q: '2+2?', correctIndex: 1 })
    expect(qs[1].category).toBe('cat')
    expect(qs[2].correctIndex).toEqual([1, 2])
    expect(isCorrect(qs[2], 1)).toBe(true)
    expect(isCorrect(qs[2], 2)).toBe(true)
    expect(isCorrect(qs[2], 0)).toBe(false)
    expect(primaryCorrect(qs[2])).toBe(1)
  })

  it('is idempotent on repeat seed (no re-ingest if mtime unchanged)', async () => {
    const { seedQuizDb } = await import('../seed')
    await seedQuizDb()
    const r2 = await seedQuizDb()
    expect(r2.ingested).toEqual([])
  })

  it('saves and recalls results by client', async () => {
    const { seedQuizDb } = await import('../seed')
    const { saveResult, recentResults } = await import('../repo')
    await seedQuizDb()
    saveResult({ subjectId: 'test-asg', clientId: 'cid', correct: 1, incorrect: 1, unanswered: 0, total: 2, durationSeconds: 30 })
    const got = recentResults('cid', 5)
    expect(got).toHaveLength(1)
    expect(got[0]).toMatchObject({ subjectId: 'test-asg', scorePct: 50, correct: 1, total: 2 })
  })

  it('picks up a new subject file dropped after the initial seed', async () => {
    const { seedQuizDb } = await import('../seed')
    const { listSubjects, listQuestions } = await import('../repo')
    await seedQuizDb()
    expect(listSubjects()).toHaveLength(1)

    const newMetas = [
      ...SUBJECTS,
      { id: 'matematicas', name: 'Matemáticas', description: 'd', icon: '➕', color: '#0a6' }
    ]
    writeFileSync(path.join(process.env.QUIZ_SEED_DIR!, '_subjects.json'), JSON.stringify(newMetas))
    writeFileSync(path.join(process.env.QUIZ_SEED_DIR!, 'matematicas.json'), JSON.stringify([
      { q: 'pi?', options: ['3', '3.14', '4'], correctIndex: 1 }
    ]))

    const r2 = await seedQuizDb()
    expect(r2.ingested).toContain('matematicas')
    const subs = listSubjects()
    expect(subs.map(s => s.id).sort()).toEqual(['matematicas', 'test-asg'])
    expect(listQuestions('matematicas')).toHaveLength(1)
  })

  it('isolates per-subject errors — bad JSON for one does not block others', async () => {
    const { seedQuizDb } = await import('../seed')
    const { listSubjects, listQuestions } = await import('../repo')
    const newMetas = [
      ...SUBJECTS,
      { id: 'broken', name: 'Broken', description: 'd', icon: '💥', color: '#a00' }
    ]
    writeFileSync(path.join(process.env.QUIZ_SEED_DIR!, '_subjects.json'), JSON.stringify(newMetas))
    writeFileSync(path.join(process.env.QUIZ_SEED_DIR!, 'broken.json'), '{ this is invalid }')

    const r = await seedQuizDb()
    expect(r.ingested).toContain('test-asg')
    expect(r.errors.map(e => e.id)).toContain('broken')
    expect(listQuestions('test-asg')).toHaveLength(3)
    expect(listSubjects().map(s => s.id).sort()).toEqual(['broken', 'test-asg'])
  })
})
