// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { rmSync } from 'node:fs'
import { setupTmpQuizEnv } from './fixtures'

describe('quiz repo + seed', () => {
  let tmp: string
  beforeEach(async () => {
    ;({ tmp } = setupTmpQuizEnv())
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
})
