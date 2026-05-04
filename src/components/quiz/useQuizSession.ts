'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Answer, Question } from '@lib/quiz/types'
import { shuffled } from './shuffle'

export type SessionState = {
  subjectId: string
  seed: number
  questions: Question[]
  answers: Record<number, Answer>
  currentIndex: number
  startedAt: number
  finishedAt: number | null
  cuatrimestre?: number | 'all'
}

const VERSION = 3
const key = (id: string) => `quiz:v${VERSION}:${id}`

function load(id: string): SessionState | null {
  if (typeof localStorage === 'undefined') return null
  try { const raw = localStorage.getItem(key(id)); return raw ? JSON.parse(raw) as SessionState : null }
  catch { return null }
}
function save(s: SessionState) { try { localStorage.setItem(key(s.subjectId), JSON.stringify(s)) } catch {} }
function clear(id: string) { try { localStorage.removeItem(key(id)) } catch {} }

export type StartOpts = { limit?: number; cuatrimestre?: number | 'all' }

export function useQuizSession(subjectId: string, source: Question[]) {
  const [session, setSession] = useState<SessionState | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const existing = load(subjectId)
    if (existing && existing.questions.length > 0 && !existing.finishedAt) setSession(existing)
    setHydrated(true)
  }, [subjectId])

  const start = useCallback((opts: StartOpts = {}) => {
    const seed = (Date.now() & 0xffffffff) >>> 0
    const filtered = !opts.cuatrimestre || opts.cuatrimestre === 'all'
      ? source
      : source.filter(q => (q.cuatrimestre ?? 1) === opts.cuatrimestre)
    let qs = shuffled(filtered, seed)
    if (opts.limit && opts.limit < qs.length) qs = qs.slice(0, opts.limit)
    const next: SessionState = {
      subjectId, seed, questions: qs, answers: {}, currentIndex: 0,
      startedAt: Date.now(), finishedAt: null,
      cuatrimestre: opts.cuatrimestre
    }
    setSession(next); save(next)
  }, [subjectId, source])

  const update = useCallback((fn: (prev: SessionState) => SessionState) => {
    setSession(prev => { if (!prev) return prev; const n = fn(prev); save(n); return n })
  }, [])

  const answer = useCallback((value: Answer) => update(p => ({ ...p, answers: { ...p.answers, [p.currentIndex]: value } })), [update])
  const goto = useCallback((idx: number) => update(p => ({ ...p, currentIndex: Math.max(0, Math.min(p.questions.length - 1, idx)) })), [update])
  const finish = useCallback(() => update(p => ({ ...p, finishedAt: Date.now() })), [update])
  const reset = useCallback(() => { clear(subjectId); setSession(null) }, [subjectId])

  return { session, hydrated, start, answer, goto, finish, reset }
}
