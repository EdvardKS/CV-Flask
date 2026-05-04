// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { setupTmpQuizEnv, SUBJECTS } from './fixtures'

describe('quiz growth path', () => {
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

  it('picks up a new subject file dropped after the initial seed', async () => {
    const { seedQuizDb } = await import('../seed')
    const { listSubjects, listQuestions } = await import('../repo')
    await seedQuizDb()
    expect(listSubjects()).toHaveLength(1)

    const newMetas = [
      ...SUBJECTS,
      { id: 'matematicas', name: 'Matemáticas', description: 'd', icon: '➕', color: '#0a6' }
    ]
    const dir = process.env.QUIZ_SEED_DIR!
    writeFileSync(path.join(dir, '_subjects.json'), JSON.stringify(newMetas))
    writeFileSync(path.join(dir, 'matematicas.json'), JSON.stringify([
      { q: 'pi?', options: ['3', '3.14', '4'], correctIndex: 1 }
    ]))

    const r2 = await seedQuizDb()
    expect(r2.ingested).toContain('matematicas')
    const subs = listSubjects()
    expect(subs.map(s => s.id).sort()).toEqual(['matematicas', 'test-asg'])
    expect(listQuestions('matematicas')).toHaveLength(1)
  })

  it('isolates per-subject errors — bad JSON does not block others', async () => {
    const { seedQuizDb } = await import('../seed')
    const { listSubjects, listQuestions } = await import('../repo')
    const newMetas = [
      ...SUBJECTS,
      { id: 'broken', name: 'Broken', description: 'd', icon: '💥', color: '#a00' }
    ]
    const dir = process.env.QUIZ_SEED_DIR!
    writeFileSync(path.join(dir, '_subjects.json'), JSON.stringify(newMetas))
    writeFileSync(path.join(dir, 'broken.json'), '{ this is invalid }')

    const r = await seedQuizDb()
    expect(r.ingested).toContain('test-asg')
    expect(r.errors.map(e => e.id)).toContain('broken')
    expect(listQuestions('test-asg')).toHaveLength(3)
    expect(listSubjects().map(s => s.id).sort()).toEqual(['broken', 'test-asg'])
  })
})
