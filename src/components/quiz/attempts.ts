import type { Answer, Question } from '@lib/quiz/types'
import type { SessionState } from './useQuizSession'
import { summarize } from './summary'

/** Un intento finalizado, persistido en localStorage para revisión posterior. */
export type AttemptRecord = {
  id: string
  subjectId: string
  finishedAt: number
  durationSeconds: number
  correct: number
  incorrect: number
  unanswered: number
  total: number
  pct: number
  config: {
    cuatrimestre?: number | 'all' | 'latest'
    categories?: string[]
  }
  questions: Question[]
  answers: Record<number, Answer>
}

const VERSION = 1
const MAX_PER_SUBJECT = 30
const key = (subjectId: string) => `quiz:attempts:v${VERSION}:${subjectId}`

export function loadAttempts(subjectId: string): AttemptRecord[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(key(subjectId))
    const parsed = raw ? (JSON.parse(raw) as AttemptRecord[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getAttempt(subjectId: string, id: string): AttemptRecord | null {
  return loadAttempts(subjectId).find(a => a.id === id) ?? null
}

/**
 * Agrega los intentos de TODAS las asignaturas guardados en este navegador,
 * ordenados del más reciente al más antiguo. Para el «área personal».
 */
export function loadAllAttempts(): AttemptRecord[] {
  if (typeof localStorage === 'undefined') return []
  const prefix = `quiz:attempts:v${VERSION}:`
  const out: AttemptRecord[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith(prefix)) continue
    try {
      const parsed = JSON.parse(localStorage.getItem(k) ?? '[]')
      if (Array.isArray(parsed)) out.push(...(parsed as AttemptRecord[]))
    } catch { /* ignora claves corruptas */ }
  }
  return out.sort((a, b) => b.finishedAt - a.finishedAt)
}

/** Corta una porción de `size` elementos (página 0-based). Clampa los límites. */
export function paginate<T>(list: T[], page: number, size: number): T[] {
  if (size <= 0) return []
  const pages = Math.max(1, Math.ceil(list.length / size))
  const p = Math.min(Math.max(0, page), pages - 1)
  return list.slice(p * size, p * size + size)
}

export function clearAttempts(subjectId: string): void {
  try { localStorage.removeItem(key(subjectId)) } catch { /* noop */ }
}

function newId(finishedAt: number): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  } catch { /* fall through */ }
  return `${finishedAt}-${Math.round(finishedAt % 100000)}`
}

/**
 * Guarda un intento finalizado. NO guarda los intentos en modo repaso
 * (el repaso no puntúa). Devuelve el registro guardado, o null si se omite.
 */
export function saveAttempt(session: SessionState): AttemptRecord | null {
  if (session.repaso || !session.finishedAt) return null
  const s = summarize(session)
  const record: AttemptRecord = {
    id: newId(session.finishedAt),
    subjectId: session.subjectId,
    finishedAt: session.finishedAt,
    durationSeconds: Math.max(0, Math.round((session.finishedAt - session.startedAt) / 1000)),
    correct: s.correct,
    incorrect: s.incorrect,
    unanswered: s.unanswered,
    total: s.total,
    pct: s.pct,
    config: { cuatrimestre: session.cuatrimestre, categories: session.categories },
    questions: session.questions,
    answers: session.answers
  }
  try {
    const list = [record, ...loadAttempts(session.subjectId)].slice(0, MAX_PER_SUBJECT)
    localStorage.setItem(key(session.subjectId), JSON.stringify(list))
  } catch { /* storage full / unavailable — best effort */ }
  return record
}
