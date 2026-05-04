import 'server-only'
import { seedQuizDb } from './seed'

let _seeded: Promise<void> | null = null

export function ensureQuizSeeded(): Promise<void> {
  if (!_seeded) {
    _seeded = seedQuizDb().then(() => undefined).catch(err => {
      _seeded = null
      throw err
    })
  }
  return _seeded
}

export function _resetQuizBootForTests() { _seeded = null }
