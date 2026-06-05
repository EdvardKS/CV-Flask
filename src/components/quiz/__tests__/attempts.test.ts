// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadAttempts, saveAttempt } from '../attempts'
import type { SessionState } from '../useQuizSession'

// Mock mínimo de localStorage para entorno node.
function installLocalStorage() {
  const store = new Map<string, string>()
  ;(globalThis as { localStorage?: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0
  } as Storage
}

const baseSession = (over: Partial<SessionState> = {}): SessionState => ({
  subjectId: 'mat', seed: 1, currentIndex: 0, startedAt: 0, finishedAt: 10_000,
  answers: { 0: 1, 1: 0 }, flags: {},
  questions: [
    { kind: 'choice', q: 'a', options: ['a', 'b'], correctIndex: 1 },
    { kind: 'choice', q: 'b', options: ['a', 'b'], correctIndex: 1 }
  ],
  ...over
})

describe('saveAttempt', () => {
  beforeEach(installLocalStorage)
  afterEach(() => { delete (globalThis as { localStorage?: Storage }).localStorage })

  it('guarda un intento finalizado y lo recupera', () => {
    const rec = saveAttempt(baseSession())
    expect(rec).not.toBeNull()
    expect(rec!.correct).toBe(1)
    expect(rec!.total).toBe(2)
    expect(loadAttempts('mat')).toHaveLength(1)
  })

  it('NO guarda intentos en modo repaso', () => {
    const rec = saveAttempt(baseSession({ repaso: true }))
    expect(rec).toBeNull()
    expect(loadAttempts('mat')).toHaveLength(0)
  })

  it('NO guarda si la sesión no está finalizada', () => {
    const rec = saveAttempt(baseSession({ finishedAt: null }))
    expect(rec).toBeNull()
  })

  it('apila los intentos más recientes primero', () => {
    saveAttempt(baseSession({ finishedAt: 10_000 }))
    saveAttempt(baseSession({ finishedAt: 20_000 }))
    const list = loadAttempts('mat')
    expect(list).toHaveLength(2)
    expect(list[0].finishedAt).toBe(20_000)
  })
})
