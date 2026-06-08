// @vitest-environment node
//
// TDD — Sistemas Digitales (ver specs/sistemas-digitales/tdd.md, ciclos 1 y 2).
// Bloquea la persistencia column-mapped de los campos NUEVOS de la feature:
//   - question.image   (columna quiz_questions.image)
//   - subject.materials (columna quiz_subjects.materials_json)
// El test de banco (sistemas-digitales.test.ts) solo valida el JSON; este prueba
// el viaje real seed → SQLite → repo, que es donde el column-mapping podía perder
// un campo no mapeado.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const SUBJECTS = [
  {
    id: 'sdig-test', name: 'SDIG Test', description: 'd', icon: '🔢', color: '#ea580c', curso: 1,
    materials: [
      { title: 'Simulacro', url: '/data/quiz/sdig-test/sim.html', icon: '📝' },
      { title: 'Guía', url: '/data/quiz/sdig-test/guia.html' }
    ]
  },
  { id: 'plain', name: 'Plain', description: 'd', icon: '📝', color: '#000', curso: 1 }
]

const SDIG_QUESTIONS = [
  {
    kind: 'choice', q: 'Figura?', options: ['a', 'b', 'c', 'd'], correctIndex: 2,
    image: '/data/quiz/sdig-test/assets/q1.jpg', evidence: 'porque sí',
    category: 'simulacro-examen', cuatrimestre: 2
  },
  { kind: 'choice', q: 'Sin imagen', options: ['x', 'y'], correctIndex: 0 }
]

function setup(): string {
  const tmp = mkdtempSync(path.join(tmpdir(), 'sdig-'))
  const seedDir = path.join(tmp, 'seed')
  mkdirSync(seedDir, { recursive: true })
  writeFileSync(path.join(seedDir, '_subjects.json'), JSON.stringify(SUBJECTS))
  writeFileSync(path.join(seedDir, 'sdig-test.json'), JSON.stringify(SDIG_QUESTIONS))
  writeFileSync(path.join(seedDir, 'plain.json'), JSON.stringify([{ kind: 'choice', q: 'q', options: ['a', 'b'], correctIndex: 0 }]))
  process.env.QUIZ_DB_PATH = path.join(tmp, 'db', 'q.db')
  process.env.QUIZ_SEED_DIR = seedDir
  return tmp
}

describe('sistemas-digitales persistence (image + materials round-trip)', () => {
  let tmp: string
  beforeEach(async () => {
    tmp = setup()
    ;(await import('../db')).closeQuizDb()
  })
  afterEach(async () => {
    ;(await import('../db')).closeQuizDb()
    rmSync(tmp, { recursive: true, force: true })
  })

  it('persists question.image through seed → SQLite → repo', async () => {
    const { seedQuizDb } = await import('../seed')
    const { listQuestions } = await import('../repo')
    await seedQuizDb()
    const qs = listQuestions('sdig-test')
    expect(qs).toHaveLength(2)
    expect(qs[0].image).toBe('/data/quiz/sdig-test/assets/q1.jpg')
    expect(qs[1].image).toBeUndefined()
  })

  it('persists subject.materials as JSON column and parses it back', async () => {
    const { seedQuizDb } = await import('../seed')
    const { getSubject } = await import('../repo')
    await seedQuizDb()
    const s = getSubject('sdig-test')
    expect(s?.materials).toHaveLength(2)
    expect(s?.materials?.[0]).toEqual({ title: 'Simulacro', url: '/data/quiz/sdig-test/sim.html', icon: '📝' })
    expect(s?.materials?.[1].icon).toBeUndefined()
  })

  it('leaves materials undefined for subjects that declare none (no regression)', async () => {
    const { seedQuizDb } = await import('../seed')
    const { getSubject } = await import('../repo')
    await seedQuizDb()
    expect(getSubject('plain')?.materials).toBeUndefined()
  })
})
