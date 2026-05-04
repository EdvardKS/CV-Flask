// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

export const SUBJECTS = [{
  id: 'test-asg', name: 'Test Asg', description: 'desc', icon: '🧪', color: '#000'
}]

export const QUESTIONS = [
  { q: '2+2?', options: ['3', '4'], correctIndex: 1 },
  { q: 'foo?', options: ['a', 'b', 'c'], correctIndex: 2, category: 'cat' },
  { q: 'multi?', options: ['x', 'y', 'z'], correctIndex: [1, 2] }
]

export function setupTmpQuizEnv() {
  const tmp = mkdtempSync(path.join(tmpdir(), 'quiz-test-'))
  const seedDir = path.join(tmp, 'seed')
  mkdirSync(seedDir, { recursive: true })
  writeFileSync(path.join(seedDir, '_subjects.json'), JSON.stringify(SUBJECTS))
  writeFileSync(path.join(seedDir, 'test-asg.json'), JSON.stringify(QUESTIONS))
  process.env.QUIZ_DB_PATH = path.join(tmp, 'db', 'q.db')
  process.env.QUIZ_SEED_DIR = seedDir
  return { tmp, seedDir }
}
